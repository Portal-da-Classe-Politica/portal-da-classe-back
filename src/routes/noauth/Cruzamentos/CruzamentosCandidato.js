const { Router } = require("express")
const router = Router()
const CruzamentosController = require("../../../controllers/CruzamentosController")

// router.get("/", CruzamentosController.getPossibilities)

router.get("/kpis/", CruzamentosController.getCandidatesKPIs)

router.get("/by-gender/", CruzamentosController.getCandidatesByGender)

router.get("/by-year/", CruzamentosController.getCandidatesByYear)

router.get("/by-occupation/", CruzamentosController.getCandidatesByOcupations)

module.exports = router
