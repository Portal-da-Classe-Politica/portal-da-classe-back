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
        if (resp && resp.length){
            const finalYearTotal = resp.find((e) => e.ano === parseInt(finalYear)).total
            const initialYearTotal = resp.find((e) => e.ano === parseInt(initialYear)).total
            const resp_eleitos_total = resp_eleitos.find((e) => e.ano === parseInt(finalYear)).total
            const resp_cands_total = resp_cands.find((e) => e.ano === parseInt(finalYear)).total
            // console.log({finalYear, finalYearTotal, resp})

            data = {
                absolute_variation: `${(finalYearTotal - initialYearTotal)}`,
                percentage_variation: `${((finalYearTotal / initialYearTotal - 1) * 100).toFixed(2)}%`,
                competition : `${(resp_cands_total / resp_eleitos_total ).toFixed(2)}`
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


        return res.json({
            success: true,
            result,
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



module.exports = {
    getEleicoesKpis,
    getCompetitionByYear
}
