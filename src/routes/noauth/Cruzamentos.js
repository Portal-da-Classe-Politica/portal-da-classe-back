const { Router } = require("express")
const router = Router()
const CruzamentosController = require("../../controllers/CruzamentosController")

// router.get("/", CruzamentosController.getPossibilities)

router.get("/candidates-profile/kpis/", CruzamentosController.getCandidatesKPIs)

router.get("/candidates-profile/by-gender/", CruzamentosController.getCandidatesByGender)

router.get("/candidates-profile/by-year/", CruzamentosController.getCandidatesByYear)

router.get("/candidates-profile/by-occupation/", CruzamentosController.getCandidatesByOcupations)

module.exports = router
