const { Router } = require("express")
const router = Router()

const Candidato = require("./Candidato")
router.use("/candidate", Candidato)

module.exports = router
