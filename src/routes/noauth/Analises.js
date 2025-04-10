const { Router } = require("express")
const router = Router()
const AnalisesController = require("../../controllers/AnalisesController")

router.get("/initial-filters", AnalisesController.getCargoAndAnalises)

router.get("/filters-by-role/:cargoId", AnalisesController.getFiltersForAnalyticsByRole)

module.exports = router
