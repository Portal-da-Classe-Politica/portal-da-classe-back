const {
    parseDataToDonutChart, parseDataToLineChart, parseDataToBarChart, parseFinanceDataToBarChart,
} = require("../utils/chartParsers")
const { validateParams, validateParams2 } = require("../utils/validators")
const EleicaoService = require("../services/EleicaoSvc")
const CandidatoEleicaoService = require("../services/CandidatoEleicaoSvc")
const UnidadeEleitoralService = require("../services/UnidateEleitoralService")

const possibilitiesByDimension = {
    0: "Quantidade de candidatos",
    1: "Quantidade de votos",
}

const getEleicoesKpis = async (req, res) => {
    try {
        let params
        try {
            params = await validateParams(req.query, "elections")
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

        const [resp,
            resp_eleitos,
            resp_cands,
        ] = await Promise.all([
            CandidatoEleicaoService.getCandidatesByYear(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca),
            CandidatoEleicaoService.getCandidatesByYear(electionsIds, 0, unidadesEleitoraisIds, 1, partidos, ocupacoesIds, cargosIds, raca),
            CandidatoEleicaoService.getCandidatesByYear(electionsIds, 0, unidadesEleitoraisIds, 0, partidos, ocupacoesIds, cargosIds, raca),
        ])

        let data = {
            absolute_variation: 0,
            percentage_variation: 0,
            competition: 0,
        }
        if (resp && resp.length) {
            const finalYearTotal = resp.find((e) => e.ano === parseInt(finalYear))?.total || 0
            const initialYearTotal = resp.find((e) => e.ano === parseInt(initialYear))?.total || 0
            const resp_eleitos_total = resp_eleitos.find((e) => e.ano === parseInt(finalYear))?.total || 0
            const resp_cands_total = resp_cands.find((e) => e.ano === parseInt(finalYear))?.total || 0
            // console.log({finalYear, finalYearTotal, resp})

            const abs_var = (finalYearTotal - initialYearTotal)?.toLocaleString("pt-BR")
            const per_var = ((finalYearTotal / initialYearTotal - 1) * 100)?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            const competition = (resp_cands_total / resp_eleitos_total)?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            const selectedDimension = `${dimension ? possibilitiesByDimension[dimension] : "quantidade de candidatos"}`
            data = [
                {
                    label: "Variação Absoluta",
                    value: abs_var,
                    description: `A ${selectedDimension} variou ${abs_var} entre ${initialYear} e ${finalYear}.`,
                },
                {
                    label: "Variação Percentual",
                    value: `${per_var}%`,
                    description: `A ${selectedDimension} em ${finalYear} foi ${per_var}% ${Number(per_var) - 100 > 0 ? "maior" : "menor"} em relação a ${initialYear}.`,
                },
                {
                    label: "Competição",
                    value: `${competition}`,
                    description: `Para cada candidato eleito, houve ${competition} candidatos não eleitos.`,
                },
            ]

            return res.json({
                success: true,
                title: `Variação em ${selectedDimension} em relação aos anos selecionados`,
                data,
                message: "Dados buscados com sucesso.",

            })
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar KPIs financeiros",
        })
    }
}

const getCompetitionByYear = async (req, res) => {
    try {
        let params
        try {
            params = await validateParams(req.query, "elections")
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

        const resp = await CandidatoEleicaoService.getCompetitionByYear(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca)

        const transformedData = resp.reduce((acc, curr) => {
            const year = curr.ano
            const total = parseInt(curr.total)
            const wasElected = curr["situacao_turno.foi_eleito"]

            if (!acc[year]) {
                acc[year] = { true: 0, false: 0 }
            }

            acc[year][wasElected] += total

            return acc
        }, {})

        const result = Object.entries(transformedData).map(([year, totals]) => ({
            year: parseInt(year),
            competition: (totals.false / totals.true).toFixed(2),
        }))

        const parsedData = parseDataToLineChart(result,
            "Total",
            "Anos",
            "Candidatos por Eleito",
            "Competição - histórico",
            dataType = "float",
            xAxisKey = "year",
            yAxisKey = "competition")

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
            message: "Erro ao buscar KPIs financeiros",
        })
    }
}

const getTopCandidates = async (req, res) => {
    try {
        let params
        try {
            params = await validateParams(req.query, "elections")
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                data: {},
                message: validationError.message,
            })
        }

        const {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca, limit,
        } = params

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getTopCandidatesByVotes(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, limit, raca)

        const data = parseDataToBarChart(resp, title = "Candidatos mais votados (mediana de votos por eleição)", seriesNames = "Candidatos", itemKey = "nome", totalKey = "mediana")

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
            message: "Erro ao buscar getTopCandidates",
        })
    }
}

const getVotesByLocation = async (req, res) => {
    try {
        let params
        try {
            params = await validateParams(req.query, "elections")
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
        } else if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
            const electoralUnitsResp = await UnidadeEleitoralService.getAllElectoralUnitsByArrayOfUnidadesEleitorais(unidadesEleitoraisIds)
            if (!electoralUnitsResp.length) {
                return res.status(400).json({
                    success: false,
                    data: {},
                    message: "UF não encontrada",
                })
            }
            electoralUnits = electoralUnitsResp.map((i) => i.id)
        }

        const resp = await CandidatoEleicaoService.getVotesMedianCandidatesByLocation(electionsIds, dimension, electoralUnits, isElected, round, partidos, ocupacoesIds, cargosIds, raca)

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
    getEleicoesKpis,
    getCompetitionByYear,
    getTopCandidates,
    getVotesByLocation,
}
