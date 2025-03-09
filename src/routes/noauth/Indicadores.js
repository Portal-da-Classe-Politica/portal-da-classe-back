const { Router } = require("express")
const router = Router()

const IndicadoresController = require("../../controllers/IndicadoresController")

router.get("/geographical-filters/uf-votes", IndicadoresController.getUFVotes)

router.get("/geographical-filters/uf-votes/:uf", IndicadoresController.getCitiesVotesByUF)

router.get("/:type/", IndicadoresController.getAllIndicadorByType)

router.get("/:type/:indicator_id", IndicadoresController.getIndicador)

module.exports = router
