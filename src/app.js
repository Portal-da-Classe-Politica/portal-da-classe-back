sequelize = require("./db/sequelize-connection")
const express = require("express")
config = require("./config/config")
const app = express()
const sync = require("./models/sync")

require("dotenv").config()
app.use(express.urlencoded({
    extended: true,
}))

app.set("port", config.port)

app.listen(app.get("port"), function () {
    console.log("servidor ligado porta " + app.get("port"))
})

const noAuthRoutes = require("./routes/noauth/index")
app.use("/noauth", noAuthRoutes)
