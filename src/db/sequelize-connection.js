const { Sequelize } = require("sequelize")
const config = require("../config/config")

const sequelize = new Sequelize({
    username: "postgres",
    password: config.secretdb,
    host: config.urldb,
    database: "eleicao_v2",
    dialect: "postgres",
    port: 5432,
    logging: false,
    dialectOptions: {
        statement_timeout: 30000, // 30 segundos (valor em milissegundos)
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
    // pool: {
    //     max: 10, // Ajuste conforme necessário
    //     min: 0,
    //     acquire: 30000,
    //     idle: 10000,
    //   },
})

sequelize.authenticate()
    .then(async () => {
        console.log("Connection has been established successfully.")
        sequelize.sync()
        console.log("sync ok")
    }).catch((error) => {
        console.log("Unable to connect to the database:", error)
    })

module.exports = sequelize
