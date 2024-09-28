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
        let {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds,
        } = await validateParams(req.query, "candidates")

        const elections = await EleicaoService.getInitialAndLastElections(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getCandidatesByYear(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)
        const resp_eleitos = await CandidatoEleicaoService.getCandidatesByYear(electionsIds, 0, unidadesEleitoraisIds, 1, partidos, ocupacoesIds, cargosIds)
        const resp_cands = await CandidatoEleicaoService.getCandidatesByYear(electionsIds, 0, unidadesEleitoraisIds, 0, partidos, ocupacoesIds, cargosIds)

        let data
        if (resp && resp.length) {
            const finalYearTotal = resp.find((e) => e.ano === parseInt(finalYear)).total
            const initialYearTotal = resp.find((e) => e.ano === parseInt(initialYear)).total
            const resp_eleitos_total = resp_eleitos.find((e) => e.ano === parseInt(finalYear)).total
            const resp_cands_total = resp_cands.find((e) => e.ano === parseInt(finalYear)).total
            // console.log({finalYear, finalYearTotal, resp})

            data = {
                absolute_variation: `${(finalYearTotal - initialYearTotal)}`,
                percentage_variation: `${((finalYearTotal / initialYearTotal - 1) * 100).toFixed(2)}%`,
                competition: `${(resp_cands_total / resp_eleitos_total).toFixed(2)}`
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

const getCompetitionByYear = async (req, res) => {

    try {
        let {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds,
        } = await validateParams(req.query, "elections")

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getCompetitionByYear(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

        const transformedData = resp.reduce((acc, curr) => {
            const year = curr.ano;
            const total = parseInt(curr.total);
            const wasElected = curr["situacao_turno.foi_eleito"];

            if (!acc[year]) {
                acc[year] = { true: 0, false: 0 };
            }

            acc[year][wasElected] += total;

            return acc;
        }, {});

        const result = Object.entries(transformedData).map(([year, totals]) => ({
            year: parseInt(year),
            competition: (totals.false / totals.true).toFixed(2)
        }));

        const parsedData = parseDataToLineChart(result,
            "Total",
            "Anos",
            "Candidatos por Eleito",
            "Competição - histórico",
            dataType = 'float',
            xAxisKey = "year",
            yAxisKey = 'competition')


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
        let {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, limit
        } = await validateParams(req.query, "elections")

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getTopCandidatesByVotes(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, limit)

        const data = parseDataToBarChart(resp, title='Candidatos mais votados', seriesNames="Candidatos", itemKey='nome', totalKey="mediana")
     
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

const getVotesByLocation = async(req, res) => {
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

        const resp = await CandidatoEleicaoService.getVotesMedianCandidatesByLocation(electionsIds, dimension, electoralUnits, isElected, partidos, ocupacoesIds, cargosIds)

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
    getVotesByLocation
}
