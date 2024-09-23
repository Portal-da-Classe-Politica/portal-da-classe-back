const { Router } = require("express")
const router = Router()

const IndicadoresController = require("../../controllers/IndicadoresController")


router.get("/:type/", IndicadoresController.getAllIndicadorByType)

router.get("/:type/:indicator_id", IndicadoresController.getIndicador)

module.exports = router
