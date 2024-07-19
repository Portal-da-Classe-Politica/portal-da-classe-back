const CandidatoEleicaoService = require("../services/CandidatoEleicaoSvc")
const CandidatoService = require("../services/CandidatoService")
const EleicaoService = require("../services/EleicaoSvc")



const getCandidatesByYear = async (req, res) => {
    try {
        let { dimension } = req.params
        let { initialYear, finalYear, round } = req.query

        if (!initialYear || !finalYear) {
            throw new Error("ERRO: initialYear e finalYear são obrigatórios.")
        }

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map(i => i.id)

        const resp = await CandidatoEleicaoService.getCandidatesByYear(electionsIds)

        console.log({ resp })

        return res.json({
            success: true,
            data: {
            },
            message: "Dados buscados com sucesso.",

        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar candidatos por gênero",
        })
    }
}


module.exports = {
    getCandidatesByYear
}
