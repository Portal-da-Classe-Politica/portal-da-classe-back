const winston = require("winston")
const logger = winston.createLogger({
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6,
    },
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`
        }),
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "app.log" }),
    ],
})

module.exports = logger
