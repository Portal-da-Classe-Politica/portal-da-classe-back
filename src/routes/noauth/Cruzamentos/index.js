const { Router } = require("express")
const router = Router()

const CruzamentosCandidato = require("./CruzamentosCandidato")
router.use("/candidates-profile", CruzamentosCandidato)

const CruzamentosFinanciamento = require("./CruzamentosFinanciamento")
router.use("/finance", CruzamentosFinanciamento)

const CruzamentosEleicoes = require("./CruzamentosEleicoes")
router.use("/elections", CruzamentosEleicoes)

module.exports = router
