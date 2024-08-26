const {
    parseDataToDonutChart, parseDataToLineChart, parseDataToBarChart, parseFinanceDataToBarChart,
} = require("../utils/chartParsers")
const { validateParams, validateParams2 } = require("../utils/validators")
const EleicaoService = require("../services/EleicaoSvc")
const CandidatoEleicaoService = require("../services/CandidatoEleicaoSvc")
const UnidadeEleitoralService = require("../services/UnidateEleitoralService")

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

/**
 * Soma da medida por ano
 * @param {*} req
 * @param {*} res
 * @returns
 */
const getFinanceByYear = async (req, res) => {
    try {
        let {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds,
        } = await validateParams(req.query, "donations")

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getFinanceCandidatesByYear(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

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
            message: "Erro ao buscar cruzamento de financiamento por ano",
        })
    }
}
/**
 * Mediana da medida por partido
 * @param {*} req
 * @param {*} res
 */
const getFinanceMedianByParty = async (req, res) => {
    try {
        let {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds,
        } = await validateParams2(req.query, "donations")

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getFinanceMedianCandidatesByParty(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

        const parsedData = parseFinanceDataToBarChart(resp, possibilitiesByDimension[dimension], "Total")

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
            message: "Erro ao buscar cruzamento de financiamento por partido",
        })
    }
}

/**
 * Mediana por candidato da medida por uf/muncipio, Se mandar o Estado, agregar por município
 * @param {*} req
 * @param {*} res
 */
const getFinanceMedianByLocation = async (req, res) => {
    try {
        let {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, UF,
        } = await validateParams2(req.query, "donations")

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        let electoralUnits = []

        if (UF && UF.length){
            // vai pegar apenas as cidades dos estados enviados
            const electoralUnitsResp = await UnidadeEleitoralService.getAllElectoralUnitsByArrayOfUFs(UF)
            if (!electoralUnitsResp.length){
                return res.status(400).json({
                    success: false,
                    data: {},
                    message: "UF não encontrada",
                })
            }
            electoralUnits = electoralUnitsResp.map((i) => i.id)
        }

        const resp = await CandidatoEleicaoService.getFinanceMedianCandidatesByLocation(electionsIds, dimension, electoralUnits, isElected, partidos, ocupacoesIds, cargosIds)

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
            message: "Erro ao buscar cruzamento de financiamento por partido",
        })
    }
}

module.exports = {
    getFinanceKPIs,
    getFinanceByYear,
    getFinanceMedianByParty,
    getFinanceMedianByLocation,
}
