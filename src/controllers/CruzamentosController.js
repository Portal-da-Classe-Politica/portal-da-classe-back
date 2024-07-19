const CandidatoEleicaoService = require("../services/CandidatoEleicaoSvc")
const CategoriaSvc = require("../services/CategoriaSvc")
const EleicaoService = require("../services/EleicaoSvc")


function parseDataToDonutChart(data, nameKey, valueKey, title) {
    if (!Array.isArray(data)) {
        throw new Error('Input data must be an array');
    }

    const seriesData = data.map(item => {
        const name = item[nameKey];
        const value = Number(item[valueKey]) || 0; // Handle null/undefined values

        if (typeof name !== 'string' || typeof value !== 'number') {
            throw new Error('Invalid name or value type in data');
        }

        return { name, value };
    });

    return {
        type: 'donut',
        title: title || '', // Provide a default empty title if not given
        series: seriesData
    };
}

function parseDataToLineChart(data, seriesName, xAxisLabel, yAxisLabel, title) {
    if (!Array.isArray(data)) {
        throw new Error('Input data must be an array');
    }

    const xAxisValues = data.map(item => item.ano);

    const seriesData = {
        name: seriesName || 'Total',  // Use provided name or default to 'Total'
        data: data.map(item => parseInt(item.total, 10)) // Convert total to number
    };

    return {
        type: 'line',
        title: title || '',  // Use provided title or default to empty string
        xAxis: xAxisValues,
        series: [seriesData],
        extraData: {
            xAxisLabel,
            yAxisLabel
        }
    };
}


const validateParams = async (query) => {
    let { dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, categoriasOcupacoes, cargosIds } = query
    let ocupacoesIds = undefined

    if (!initialYear || !finalYear) {
        throw new Error("ERRO: initialYear e finalYear são obrigatórios.")
    }

    if (!dimension) {
        dimension = 0
    }

    if (unidadesEleitoraisIds) {
        unidadesEleitoraisIds = unidadesEleitoraisIds.split(',').map(Number)
    }

    if (partidos) {
        partidos = partidos.split(',').map(Number)
    }

    if (cargosIds) {
        cargosIds = cargosIds.split(',').map(Number)
    }

    if (categoriasOcupacoes) {
        categoriasOcupacoes = categoriasOcupacoes.split(',').map(Number)
        const ocupacoes = await CategoriaSvc.getOcubacoesByCategories(categoriasOcupacoes)
        ocupacoesIds = ocupacoes.map(i => i.id)
    }

    return { dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds }

}

const getCandidatesByYear = async (req, res) => {
    try {
        let { dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds } = await validateParams(req.query)

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map(i => i.id)

        const resp = await CandidatoEleicaoService.getCandidatesByYear(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

        const parsedData = parseDataToLineChart(resp, 'Total', 'Anos', 'Candidatos', 'Candidatos histórico');

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
        let { dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds } = await validateParams(req.query)

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map(i => i.id)

        const resp = await CandidatoEleicaoService.getCandidatesGenderByElection(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

        const parsedData = parseDataToDonutChart(resp, 'genero', 'total', 'Proporção de candidatos por gênero')

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
        let { dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds } = await validateParams(req.query)

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map(i => i.id)

        const resp = await CandidatoEleicaoService.getCandidatesByOccupation(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

        // const parsedData = parseDataToDonutChart(resp, 'genero', 'total', 'Proporção de candidatos por gênero')

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



module.exports = {
    getCandidatesByYear,
    getCandidatesByGender,
    getCandidatesByOcupations
}
