const { Sequelize } = require("sequelize")
const config = require("../config/config")
const logger = require("../utils/logger")
const { sendAlert } = require("../utils/alert/alertTelegram")

const objectDB = {
    username: "postgres",
    password: config.secretdb,
    host: config.urldb,
    database: config.environment != "development" ? "eleicao_v3" : "eleicao_v2",
    dialect: "postgres",
    port: 5432,
    logging: false,
    dialectOptions: {
        statement_timeout: 120000, // 30 segundos (valor em milissegundos)
    },
    pool: {
        max: 30, // Ajuste conforme necessário
        min: 0,
        acquire: 120000,
        idle: 10000,
    },
}

if (config.environment === "development") {
    objectDB.dialectOptions.ssl = {
        require: true,
        rejectUnauthorized: false,
    }
}

const sequelize = new Sequelize(objectDB)

const connect = async () => {
    try {
        await sequelize.authenticate()
        sequelize.sync()
        logger.info("Conexão com o banco de dados estabelecida com sucesso.")
    } catch (error) {
        logger.error("Não foi possível conectar ao banco de dados:", error)
        process.exit(1)
    }
}

module.exports = {
    sequelize,
    connect,
}
