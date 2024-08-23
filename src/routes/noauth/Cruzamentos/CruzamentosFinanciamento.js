const { Router } = require("express")
const router = Router()
const CruzamentosController = require("../../../controllers/CruzamentosFinancimentoController")

router.get("/kpis/", CruzamentosController.getFinanceKPIs)

module.exports = router
