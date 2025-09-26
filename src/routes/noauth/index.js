const { Router } = require("express")
const router = Router()

const Candidato = require("./Candidato")
router.use("/candidate", Candidato)

const Abrangencia = require("./Abrangencia")
router.use("/abrangency", Abrangencia)

const UnidadeEleitoral = require("./UnidadeEleitoral")
router.use("/electoral-unit", UnidadeEleitoral)

// const Cruzamentos = require("./Cruzamentos/index")
// router.use("/cruzamentos", Cruzamentos)

const Indicadores = require("./Indicadores")
router.use("/indicadores", Indicadores)

const Partido = require("./Partido")
router.use("/party", Partido)

const analises = require("./analises")
router.use("/analises", analises)

const { sendEmail } = require("../../controllers/emailController")
router.post("/send-email", sendEmail)

module.exports = router
