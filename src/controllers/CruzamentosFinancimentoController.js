const {
    parseDataToDonutChart, parseDataToLineChart, parseDataToBarChart, parseFinanceDataToBarChart,
} = require("../utils/chartParsers")
const { validateParams, validateParams2 } = require("../utils/validators")
const EleicaoService = require("../services/EleicaoSvc")
const CandidatoEleicaoService = require("../services/CandidatoEleicaoSvc")
const UnidadeEleitoralService = require("../services/UnidateEleitoralService")
const ipcaUtil = require("../utils/ipca")

const possibilitiesByDimension = {
    0: "Volume total de financiamento",
    1: "Quantidade doações",
    2: "Volume fundo eleitoral",
    3: "Volume fundo partidário",
    4: "Volume financiamento privado",
}

const getFinanceKPIs = async (req, res) => {
    try {
        let params
        try {
            params = await validateParams(req.query, "donations")
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                data: {},
                message: validationError.message,
            })
        }

        const {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca,
        } = params

        const elections = await EleicaoService.getInitialAndLastElections(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getFinanceKPIs(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca)
        let data
        if (resp && resp.length) {
            const finalYearId = elections.find((e) => e.ano_eleicao === parseInt(finalYear)).id
            const initialYearId = elections.find((e) => e.ano_eleicao === parseInt(initialYear)).id
            let lastYearResult = resp.find((r) => r.eleicao_id === finalYearId)
            let initialYearResult = resp.find((r) => r.eleicao_id === initialYearId)
            if (!lastYearResult) {
                lastYearResult = { resultado: 0 }
            }
            if (!initialYearResult) {
                initialYearResult = { resultado: 0 }
            }
            if (dimension !== 1) {
                lastYearResult.resultado = ipcaUtil.atualizarValor(lastYearResult.resultado, finalYear)
                initialYearResult.resultado = ipcaUtil.atualizarValor(initialYearResult.resultado, initialYear)
            }

            const abs_var = lastYearResult.resultado - initialYearResult.resultado
            const formattedAbsVar = abs_var.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

            const per_var = ((lastYearResult.resultado / initialYearResult.resultado) * 100).toFixed(2)

            const perVarValue = Number(per_var) - 100
            const formattedPerVar = perVarValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            const per_var_text = `${formattedPerVar}%`
            const comparison = (Number(per_var) - 1) > 0 ? "maior" : "menor"

            data = [
                {
                    label: "Variação Absoluta",
                    value: formattedAbsVar,
                    description: `O financiamento dos candidatos variou R$ ${formattedAbsVar} entre ${initialYear} e ${finalYear}.`,
                },
                {
                    label: "Variação Percentual",
                    value: per_var_text,
                    description: `O financiamento dos candidatos em ${finalYear} foi ${formattedPerVar}% ${comparison} em relação a ${initialYear}.`,
                },
            ]
        }

        return res.json({
            success: true,
            title: "Indicadores de Financiamento",
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
        let params
        try {
            params = await validateParams(req.query, "donations")
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                data: {},
                message: validationError.message,
            })
        }

        const {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca,
        } = params

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getFinanceCandidatesByYear(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca)

        const typeOfData = dimension === 1 ? "integer" : "float"

        const parsedData = parseDataToLineChart(resp, "Total", "Anos", possibilitiesByDimension[dimension], "Financiamento Série Histórica", typeOfData)

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
        let params
        try {
            params = await validateParams(req.query, "donations")
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                data: {},
                message: validationError.message,
            })
        }

        const {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca,
        } = params

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getFinanceMedianCandidatesByParty(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca)

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
        let params
        try {
            params = await validateParams(req.query, "donations")
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                data: {},
                message: validationError.message,
            })
        }

        const {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca, UF,
        } = params

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        let electoralUnits = []

        if (UF && UF.length) {
            // vai pegar apenas as cidades dos estados enviados
            const electoralUnitsResp = await UnidadeEleitoralService.getAllElectoralUnitsByArrayOfUFs(UF)
            if (!electoralUnitsResp.length) {
                return res.status(400).json({
                    success: false,
                    data: {},
                    message: "UF não encontrada",
                })
            }
            electoralUnits = electoralUnitsResp.map((i) => i.id)
        }

        const resp = await CandidatoEleicaoService.getFinanceMedianCandidatesByLocation(electionsIds, dimension, electoralUnits, isElected, partidos, ocupacoesIds, cargosIds, raca)

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
