const { Router } = require("express")
const router = Router()
const EleicoesController = require("../../../controllers/EleicoesController")

router.get("/kpis/", EleicoesController.getEleicoesKpis)

router.get("/competition-by-year/", EleicoesController.getCompetitionByYear)

// router.get("/by-party/", CruzamentosController.getFinanceMedianByParty)

// router.get("/by-location/", CruzamentosController.getFinanceMedianByLocation)

module.exports = router
