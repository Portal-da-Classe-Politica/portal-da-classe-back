const { parseDataToDonutChart, parseDataToLineChart, parseDataToBarChart } = require("../utils/chartParsers")
const { validateParams } = require("../utils/validators")
const EleicaoService = require("../services/EleicaoSvc")
const CandidatoEleicaoService = require("../services/CandidatoEleicaoSvc")

const possibilitiesByDimension = {
    0: "Volume total de financiamento",
    1: "Quantidade doações",
    2: "Volume fundo eleitoral",
    3: "Volume fundo partidário",
    4: "Volume financiamento privado",
}

const getFinanceKPIs = async (req, res) => {
    try {
        let {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds,
        } = await validateParams(req.query, "donations")

        const elections = await EleicaoService.getInitialAndLastElections(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getFinanceKPIs(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)
        let data
        if (resp && resp.length){
            const finalYearId = elections.find((e) => e.ano_eleicao === parseInt(finalYear)).id
            const initialYearId = elections.find((e) => e.ano_eleicao === parseInt(initialYear)).id
            const lastYearResult = resp.find((r) => r.eleicao_id === finalYearId)
            const initialYearResult = resp.find((r) => r.eleicao_id === initialYearId)
            data = {
                absolute_variation: `${(lastYearResult.resultado - initialYearResult.resultado).toFixed(2)}`,
                percentage_variation: `${((lastYearResult.resultado / initialYearResult.resultado) * 100).toFixed(2)}%`,
            }
        }

        return res.json({
            success: true,
            data,
            message: "Dados buscados com sucesso.",

        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar KPIs financeiros",
        })
    }
}

const getFinanceByYear = async (req, res) => {
    try {
        let {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds,
        } = await validateParams(req.query, "donations")

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getFinanceCandidatesByYear(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)
        console.log(resp)
        const parsedData = parseDataToLineChart(resp, "Total", "Anos", possibilitiesByDimension[dimension], "Financiamento Série Histórica", "float")

        return res.json({
            success: true,
            data: parsedData,
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

const getFinanceByParty = async (req, res) => {
}

const getFinanceByLocation = async (req, res) => {
}

module.exports = {
    getFinanceKPIs,
    getFinanceByYear,
    getFinanceByParty,
    getFinanceByLocation,
}
