const { Router } = require("express")
const router = Router()
const CruzamentosController = require("../../controllers/CruzamentosController")

// router.get("/", CruzamentosController.getPossibilities)

router.get("/candidates-profile/:dimension/by-gender/", CruzamentosController.getCandidatesByGender)

router.get("/candidates-profile/:dimension/by-year/", CruzamentosController.getCandidatesByYear)

module.exports = router
