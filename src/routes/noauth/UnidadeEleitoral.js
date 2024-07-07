const { Router } = require("express")
const router = Router()
const UnidadeEleitoralController = require("../../controllers/UnidadeEleitoralController")

router.get("/", UnidadeEleitoralController.getByAbrangency)

router.get("/get-ufs/", UnidadeEleitoralController.getFederativeUnits)

module.exports = router
