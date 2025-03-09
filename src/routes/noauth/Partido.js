const { Router } = require("express")
const router = Router()
const PartidoController = require("../../controllers/PartidoController")

router.get("/", PartidoController.getAllParties)

module.exports = router
