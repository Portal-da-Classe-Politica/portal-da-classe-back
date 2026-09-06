[![Better Stack Badge](https://uptime.betterstack.com/status-badges/v1/monitor/1u5ga.svg)](https://uptime.betterstack.com/?utm_source=status_badge)

# portal-da-classe-back
Back End

## Estrutura do banco

A estrutura do banco **não** é criada por este repositório. Ela vem das migrations
em `novo_script_eleicoes/db/migrations/`, aplicadas por `node db/migrate.js up`.

O `sequelize.sync()` que existia no `connect()` foi removido: ele criava tabela
ausente mas nunca corrigia coluna divergente, então os dois repositórios podiam
discordar sobre o schema em silêncio. Foi assim que este back passou de abril a
setembro de 2026 com metade do código esperando `candidatos.raca_id` e a outra
metade `candidato_eleicaos.raca_id`.

No lugar dele, `src/db/sequelize-connection.js` confere na subida se o banco está
na versão esperada e **não sobe** se não estiver (log + alerta no Telegram +
`exit 1`).

> Ao aplicar uma migration nova em produção, **atualize `MIGRATION_ESPERADA`** em
> `src/db/sequelize-connection.js`. É manual de propósito: o acoplamento entre o
> código e a estrutura do banco fica visível no diff.

Ambientes hoje:

| | banco | Postgres |
|---|---|---|
| local | `novo_novo_redem` | 16.1 |
| servidor | `eleicao_v3` | 15.10 |

Os schemas dos dois são idênticos e estão ambos registrados em `001_baseline`.
Para comparar: `db/fingerprint.sql` no repositório `novo_script_eleicoes`.
