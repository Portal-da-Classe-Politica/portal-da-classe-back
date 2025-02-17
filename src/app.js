sequelize = require("./db/sequelize-connection").sequelize
const promClient = require("prom-client")
const promBundle = require("express-prom-bundle")
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
const register = new promClient.Registry()

const httpRequestsTotal = new promClient.Counter({
    name: "http_requests_total",
    help: "Total de requisições HTTP",
    labelNames: ["method", "status"],
})

const httpRequestDurationMicroseconds = new promClient.Histogram({
    name: "http_request_duration_microseconds",
    help: "Histogram of HTTP request durations in microseconds.",
    labelNames: ["method", "status_code"],
})

const makeMiddleware = (metricsApp, normalizePath = []) => promBundle({
    includeMethod: true,
    includeStatusCode: true,
    includePath: true,
    metricType: "histogram",
    autoregister: false,
    metricsApp,
    promRegistry: promClient.register,
    normalizePath: normalizePath.map((path) => [new RegExp(path), ""]),
})

const startMetrics = () => {
    promClient.collectDefaultMetrics({ register })
    register.registerMetric(httpRequestDurationMicroseconds)
}

const start = async () => {
    try {
        await connect()
        startMetrics()

        app.listen(app.get("port"), function () {
            console.log("servidor ligado porta " + app.get("port"))
        })

        app.use((req, res, next) => {
            res.on("finish", () => {
                httpRequestsTotal.inc({ method: req.method, status: res.statusCode })
            })
            next()
        })

        app.use(makeMiddleware(app, ["/metrics", "/health"]))

        app.get("/metrics", async (req, res) => {
            res.set("Content-Type", register.contentType)
            res.end(await register.metrics())
        })

        app.get("/health", (req, res) => {
            res.status(200).send("OK")
        })

        const noAuthRoutes = require("./routes/noauth/index")
        app.use("/noauth", noAuthRoutes)
    } catch (error) {
        console.error("Não foi possível inicializar a aplicacao", error)
        process.exit(1)
    }
}

start()
