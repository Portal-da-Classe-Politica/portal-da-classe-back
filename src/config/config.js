module.exports = {
    urldb: process.env.DB_HOST || "database-1.cla42k2karwn.sa-east-1.rds.amazonaws.com",
    secretdb: process.env.DB_PASS || "portalmicro198",
    port: process.env.PORT || 7000,
    user: process.env.USERNAME || "postgres",
}
