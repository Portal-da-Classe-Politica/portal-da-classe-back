module.exports = {
    urldb: process.env.DB_HOST || "localhost",
    secretdb: process.env.DB_PASS || "postgres",
    port: process.env.PORT || 7000,
    user: process.env.USERNAME || "postgres",
    environment: process.env.NODE_ENV || "local",
    emailAPIKey: process.env.EMAIL_API_KEY || "",
    emailSecretKey: process.env.EMAIL_SECRET_KEY || "",
    emailTo: process.env.EMAIL_TO || "",
}
