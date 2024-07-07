const { Router } = require("express")
const router = Router()
const AbrangenciaController = require("../../controllers/AbrangenciaController")

router.get("/", AbrangenciaController.getAllAbrangencies)

module.exports = router
