const CandidatoEleicaoService = require("../services/CandidatoEleicaoSvc")
const EleicaoService = require("../services/EleicaoSvc")
const { parseDataToDonutChart, parseDataToLineChart, parseDataToBarChart } = require("../utils/chartParsers")
const { validateParams } = require("../utils/validators")

const getCandidatesByYear = async (req, res) => {
    try {
        let {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds,
        } = await validateParams(req.query, "candidates")

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getCandidatesByYear(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

        const parsedData = parseDataToLineChart(resp, "Total", "Anos", "Candidatos", "Candidatos histórico")

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

const getCandidatesByGender = async (req, res) => {
    try {
        let {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds,
        } = await validateParams(req.query, "candidates")

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getCandidatesGenderByElection(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

        const parsedData = parseDataToDonutChart(resp, "genero", "total", "Proporção de candidatos por gênero")

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

const getCandidatesByOcupations = async (req, res) => {
    try {
        let {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds,
        } = await validateParams(req.query, "candidates")

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getCandidatesByOccupation(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

        const parsedData = parseDataToBarChart(resp, "Distribuição do total por categoria de ocupação", "Total")

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

const getCandidatesKPIs = async (req, res) => {
    try {
        let {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds,
        } = await validateParams(req.query, "candidates")

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getCandidatesProfileKPIs(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

        // const parsedData = parseDataToDonutChart(resp, 'genero', 'total', 'Proporção de candidatos por gênero')

        return res.json({
            success: true,
            data: resp,
            title: "Variação no financiamento dos candidatos",
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
    getCandidatesByYear,
    getCandidatesByGender,
    getCandidatesByOcupations,
    getCandidatesKPIs,
}
