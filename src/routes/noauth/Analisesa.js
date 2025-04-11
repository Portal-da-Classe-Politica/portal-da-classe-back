const { Router } = require("express")
const router = Router()
const AnalisesController = require("../../controllers/AnalisesController")

router.get("/initial-filters", AnalisesController.getCargoAndAnalises)

router.get("/filters-by-role/:cargoId", AnalisesController.getFiltersForAnalyticsByRole)

router.get("/generate-graph/:dimension", AnalisesController.generateGraph)

module.exports = router
