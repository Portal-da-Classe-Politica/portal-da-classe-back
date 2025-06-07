const mailjet = require("node-mailjet")
const { sendAlert } = require("../utils/alert/alertTelegram")
const config = require("../config/config")

const sendEmail = async (req, res) => {
    const {
        nome, email, mensagem, assunto,
    } = req.body
    // verificar se todos os campos foram preenchidos e devolver qual nao foi preenchido
    if (!nome || !email || !mensagem) {
        console.error("Campos obrigatórios não preenchidos:", {
            nome, email, mensagem, assunto,
        })
        return res.status(400).send("Todos os campos são obrigatórios.")
    }

    if (mensagem.length < 10 || mensagem.length > 800) {
        return res.status(400).send("A mensagem deve ter entre 10 e 800 caracteres.")
    }
    if (nome.length < 3 || nome.length > 100) {
        return res.status(400).send("O nome deve ter entre 3 e 100 caracteres.")
    }

    if (assunto && assunto.length > 100) {
        return res.status(400).send("O assunto deve ter no máximo 100 caracteres.")
    }

    const mailjetClient = mailjet.apiConnect(
        config.emailAPIKey, // API Key
        config.emailSecretKey, // Secret Key
    )

    try {
        const result = await mailjetClient
            .post("send", { version: "v3.1" })
            .request({
                Messages: [
                    {
                        From: {
                            Email: config.emailTo, // coloque no .env
                            Name: "Contato Portal da Classe",
                        },
                        To: [
                            {
                                Email: config.emailTo, // coloque no .env
                                Name: nome,
                            },
                        ],
                        Subject: assunto,
                        TextPart: mensagem,
                        ReplyTo: {
                            Email: email,
                            Name: nome,
                        },
                    },
                ],
            })
            //console.log("Email enviado com sucesso:", result.body)
        await sendAlert(`Nova mensagem de contato:\nNome: ${nome}\nEmail: ${email}, assunto: ${assunto || "Sem assunto"}`)
        res.json({
            status: "success",
            message: "Mensagem enviada com sucesso!",
        })
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error)
        res.status(500).json({
            status: "error",
            message: "Erro ao enviar mensagem. Tente novamente mais tarde.",
        })
    }
}

module.exports = {
    sendEmail,
}
