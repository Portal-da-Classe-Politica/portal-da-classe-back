const { Router } = require("express")
const router = Router()
const CruzamentosController = require("../../../controllers/CruzamentosFinancimentoController")

router.get("/kpis/", CruzamentosController.getFinanceKPIs)

router.get("/by-year/", CruzamentosController.getFinanceByYear)

router.get("/by-party/", CruzamentosController.getFinanceMedianByParty)

router.get("/by-location/", CruzamentosController.getFinanceMedianByLocation)

module.exports = router
