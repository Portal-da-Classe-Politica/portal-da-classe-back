const { parseDataToDonutChart, parseDataToLineChart, parseDataToBarChart } = require("../utils/chartParsers")
const { validateParams } = require("../utils/validators")
const EleicaoService = require("../services/EleicaoSvc")
const CandidatoEleicaoService = require("../services/CandidatoEleicaoSvc")

const getFinanceKPIs = async (req, res) => {
    try {
        let {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds,
        } = await validateParams(req.query, "donations")

        const elections = await EleicaoService.getInitialAndLastElections(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getFinanceKPIs(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

        return res.json({
            success: true,
            data: resp,
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
