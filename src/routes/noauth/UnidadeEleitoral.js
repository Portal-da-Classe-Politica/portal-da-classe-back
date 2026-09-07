const { Router } = require("express")
const router = Router()
const UnidadeEleitoralController = require("../../controllers/UnidadeEleitoralController")

router.get("/", UnidadeEleitoralController.getByAbrangency)

module.exports = router
