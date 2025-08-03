const { Router } = require("express")
const router = Router()
const AnalisesController = require("../../controllers/AnalisesController")

router.get("/initial-filters", AnalisesController.getCargoAndAnalises)

router.get("/roles-by-dimension/:dimension", AnalisesController.getRolesByDimension)

router.get("/filters-by-role/:cargoId", AnalisesController.getFiltersForAnalyticsByRole)

router.get("/generate-graph", AnalisesController.generateGraph)

module.exports = router
