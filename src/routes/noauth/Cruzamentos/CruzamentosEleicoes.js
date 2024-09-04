const { Router } = require("express")
const router = Router()
const EleicoesController = require("../../../controllers/EleicoesController")

router.get("/kpis/", EleicoesController.getEleicoesKpis)

router.get("/competition-by-year/", EleicoesController.getCompetitionByYear)

router.get("/top-candidates/", EleicoesController.getTopCandidates)

router.get("/by-location/", EleicoesController.getVotesByLocation)

module.exports = router
