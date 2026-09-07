module.exports = {
    urldb: process.env.DB_HOST || "localhost",
    secretdb: process.env.DB_PASS || "postgres",
    port: process.env.PORT || 7000,
    user: process.env.USERNAME || "postgres",
    environment: process.env.NODE_ENV || "local",
    emailAPIKey: process.env.EMAIL_API_KEY || "",
    emailSecretKey: process.env.EMAIL_SECRET_KEY || "",
    emailTo: process.env.EMAIL_TO || "",
    // Trava o ano final enviado pelos indicadores cuja série depende de resultado
    // de votação/turno ou de financiamento apurado (ver indicatorsMaxYearWithoutApuracao
    // em src/utils/filterParsers.js). Desligar aqui (env LIMIT_INDICATOR_YEARS_TO_APURACAO=false)
    // quando 2026 tiver apuração completa e o mapa puder ser removido.
    limitIndicatorYearsToApuracao: true,
}
