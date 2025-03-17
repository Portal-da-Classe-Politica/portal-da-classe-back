require("dotenv").config()
const axios = require("axios")
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN
const CHAT_ID = process.env.CHAT_ID

async function sendAlert(message) {
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`
    try {
        await axios.post(telegramUrl, {
            chat_id: CHAT_ID,
            text: message,
        })
        console.log("[🚀] Alerta enviado para o Telegram!")
    } catch (err) {
        console.error("[❌] Erro ao enviar alerta para o Telegram:", err.message)
    }
}

module.exports = {
    sendAlert,
}
