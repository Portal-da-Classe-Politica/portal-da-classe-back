#!/usr/bin/env bash
# Deploy com verificação: sobe a versão nova numa porta separada (canário),
# checa o /health e só então reinicia o processo do pm2. Se algo falhar,
# volta o código para o commit anterior e o processo em produção segue intacto.
#
# Executado pelo workflow .github/workflows/github-actions-ec2.yml

# carrega node/npm/pm2 no PATH (nvm etc.) antes do modo estrito
source ~/.bashrc >/dev/null 2>&1 || true
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/portal-da-classe-back}"
APP_NAME="${APP_NAME:-portal back}"
PROD_PORT="${PROD_PORT:-7000}"
CANARY_PORT="${CANARY_PORT:-7099}"
CANARY_LOG=/tmp/portal-back-canary.log
HEALTH_TIMEOUT=30

CANARY_PID=""
cleanup() {
    if [ -n "$CANARY_PID" ]; then
        kill "$CANARY_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT

cd "$APP_DIR"
PREV=$(git rev-parse HEAD)

restore() {
    echo "❌ $1 — voltando para ${PREV:0:7}"
    git reset --hard "$PREV"
    npm install --production
}

health() { # $1 = porta
    for _ in $(seq 1 "$HEALTH_TIMEOUT"); do
        if curl -fsS "http://localhost:$1/health" >/dev/null 2>&1; then
            return 0
        fi
        # canário morreu: não adianta esperar
        if [ -n "$CANARY_PID" ] && ! kill -0 "$CANARY_PID" 2>/dev/null; then
            return 1
        fi
        sleep 1
    done
    return 1
}

if curl -fsS "http://localhost:$CANARY_PORT/health" >/dev/null 2>&1; then
    echo "❌ Porta do canário ($CANARY_PORT) já está em uso, abortando sem alterar nada"
    exit 1
fi

echo "📥 Atualizando código (atual: ${PREV:0:7})"
git fetch origin main
git reset --hard origin/main
NEW=$(git rev-parse HEAD)
echo "   nova versão: ${NEW:0:7}"

if ! npm install --production; then
    restore "npm install falhou"
    exit 1
fi

# 1) Canário: versão nova em outra porta, sem mexer no pm2
echo "🐤 Subindo canário na porta $CANARY_PORT"
PORT="$CANARY_PORT" node src/app.js >"$CANARY_LOG" 2>&1 &
CANARY_PID=$!

if ! health "$CANARY_PORT"; then
    echo "----- log do canário -----"
    cat "$CANARY_LOG" || true
    echo "--------------------------"
    cleanup
    CANARY_PID=""
    restore "canário não respondeu /health em ${HEALTH_TIMEOUT}s"
    exit 1
fi

echo "✅ Canário saudável"
cleanup
CANARY_PID=""

# 2) Só agora troca a produção
echo "🔁 Reiniciando \"$APP_NAME\""
pm2 restart "$APP_NAME" --update-env

if ! health "$PROD_PORT"; then
    restore "produção não respondeu /health após restart"
    pm2 restart "$APP_NAME" --update-env
    exit 1
fi

echo "✅ Deploy OK: ${PREV:0:7} → ${NEW:0:7}"
