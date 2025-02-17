sequelize = require("./db/sequelize-connection").sequelize
const connect = require("./db/sequelize-connection").connect
const express = require("express")
config = require("./config/config")
const app = express()
require("dotenv").config()
app.use(express.urlencoded({
    extended: true,
}))

app.set("port", config.port)
const sync = require("./models/sync")

const start = async () => {
    try {
        await connect()

        app.listen(app.get("port"), function () {
            console.log("servidor ligado porta " + app.get("port"))
        })

        const noAuthRoutes = require("./routes/noauth/index")
        app.use("/noauth", noAuthRoutes)
    } catch (error) {
        console.error("Não foi possível inicializar a aplicacao", error)
        process.exit(1)
    }
}

start()
