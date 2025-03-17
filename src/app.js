require("dotenv").config()
sequelize = require("./db/sequelize-connection").sequelize
const promClient = require("prom-client")
const promBundle = require("express-prom-bundle")
const connect = require("./db/sequelize-connection").connect
const express = require("express")
config = require("./config/config")
const app = express()
const { sendAlert } = require("./utils/alert/alertTelegram")
const logger = require("./utils/logger")

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
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 240], // Incluindo até 2 minutos
})

const makeMiddleware = (metricsApp, normalizePath = []) => promBundle({
    includeMethod: true,
    includeStatusCode: true,
    includePath: true,
    metricType: "histogram",
    autoregister: false,
    metricsApp,
    promRegistry: promClient.register,
    normalizePath,
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 240],
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

        app.use(makeMiddleware(app))

        app.get("/metrics", async (req, res) => {
            res.set("Content-Type", register.contentType)
            res.end(await register.metrics())
        })

        app.get("/health", async (req, res) => {
            // checar conexao com o banco
            try {
            // Verifica a conexão com o banco
                await sequelize.authenticate()
                res.status(200).send("OK")
            } catch (error) {
                console.error("Erro no health check:", error.message)
                res.status(500).json({ status: "DOWN", database: "Error", error: error.message })
                process.exit(1)
            }
        })

        const noAuthRoutes = require("./routes/noauth/index")
        app.use("/noauth", noAuthRoutes)

        process.on("uncaughtException", (error) => {
            logger.error("Unhandled Exception:", error)
            sendAlert(`[❌] Erro na aplicação uncaughtException: ${error.message}`)
            process.exit(1)
        })

        process.on("unhandledRejection", (reason, promise) => {
            logger.error("Unhandled Rejection at:", promise, "reason:", reason)
            sendAlert(`[❌] Erro na aplicação unhandledRejection: ${error.message}`)
            process.exit(1)
        })
    } catch (error) {
        logger.error("Não foi possível inicializar a aplicacao", error)
        sendAlert(`[❌] Erro na aplicação: ${error.message}`)
        process.exit(1)
    }
}

start()
