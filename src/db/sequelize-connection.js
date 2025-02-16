const { Sequelize } = require("sequelize")
const config = require("../config/config")

const objectDB = {
    username: "postgres",
    password: config.secretdb,
    host: config.urldb,
    database: config.environment != "development" ? "eleicao_v3" : "eleicao_v2",
    dialect: "postgres",
    port: 5432,
    logging: false,
}

if (config.environment === "development") {
    objectDB.dialectOptions = {
        statement_timeout: 120000, // 30 segundos (valor em milissegundos)
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    }
    objectDB.pool = {
        max: 20, // Ajuste conforme necessário
        min: 0,
        acquire: 120000,
        idle: 10000,
    }
    //objectDB.logging = true
}

const sequelize = new Sequelize(objectDB)

const connect = async () => {
    try {
        await sequelize.authenticate()
        sequelize.sync()
        console.log("Conexão com o banco de dados estabelecida com sucesso.")
    } catch (error) {
        console.error("Não foi possível conectar ao banco de dados:", error)
    }
}

module.exports = {
    sequelize,
    connect,
}
