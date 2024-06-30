const { Router } = require("express")
const router = Router()
const CandidatoController = require("../../controllers/CandidatoController")

router.get("/get-filters", CandidatoController.getFiltersForSearch)

module.exports = router
