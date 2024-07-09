const { Router } = require("express")
const router = Router()
const CandidatoController = require("../../controllers/CandidatoController")

router.get("/", CandidatoController.getCandidates)

router.get("/detail/:id", CandidatoController.getCandidateDetail)

router.get("/last-election-votes-by-region/:id", CandidatoController.getLastElectionVotesByRegion)

router.get("/get-filters", CandidatoController.getFiltersForSearch)

module.exports = router
