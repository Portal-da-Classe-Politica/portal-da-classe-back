const { Router } = require("express")
const router = Router()
const CandidatoController = require("../../controllers/CandidatoController")

router.get("/", CandidatoController.searchCandidatesByName)

router.get("/detail/:id", CandidatoController.getCandidateDetail)

router.get("/last-election-votes-by-region/:id", CandidatoController.getLastElectionVotesByRegion)

router.get("/get-last-5-last-elections-votes/:id", CandidatoController.getLast5LastElectionsVotes)

router.get("/biggest-donors/:id", CandidatoController.getBiggestDonors)

router.get("/get-filters", CandidatoController.getFiltersForSearch)

router.get("/cargos", CandidatoController.getCargoFilters)

router.get("/kpis/:id", CandidatoController.getKpis)

module.exports = router
