module.exports = {
    urldb: process.env.DB_HOST || "127.0.0.1",
    secretdb: process.env.DB_PASS || "postgres",
    port: process.env.PORT || 7000,
}
