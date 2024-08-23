const { Router } = require("express")
const router = Router()

const CruzamentosCandidato = require("./CruzamentosCandidato")
router.use("/candidates-profile", CruzamentosCandidato)

const CruzamentosFinanciamento = require("./CruzamentosFinanciamento")
router.use("/finance", CruzamentosFinanciamento)

module.exports = router
