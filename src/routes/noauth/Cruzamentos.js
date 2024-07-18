const { Router } = require("express")
const router = Router()
const CruzamentosController = require("../../controllers/CruzamentosController")
const CruzamentosPerfilCandidatosController = require("../../controllers/CruzamentosPerfilCandidatosController")

router.get("/", CruzamentosController.getPossibilities)

router.get("/candidates-profile/:dimension/by-gender/", CruzamentosPerfilCandidatosController.getCandidatesByGender)

router.get("/candidates-profile/:dimension/by-year/", CruzamentosPerfilCandidatosController.getCandidatesByGender)

module.exports = router
