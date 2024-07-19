const CandidatoEleicaoService = require("../services/CandidatoEleicaoSvc")
const CategoriaSvc = require("../services/CategoriaSvc")
const EleicaoService = require("../services/EleicaoSvc")


const validateParams = async (query) => {
    let { initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, categoriasOcupacoes, cargosIds } = query
    let ocupacoesIds = undefined

    if (!initialYear || !finalYear) {
        throw new Error("ERRO: initialYear e finalYear são obrigatórios.")
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

    return { initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds }

}

const getCandidatesByYear = async (req, res) => {
    try {
        let { dimension } = req.params
        let { initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds } = await validateParams(req.query)

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map(i => i.id)

        const resp = await CandidatoEleicaoService.getCandidatesByYear(electionsIds, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

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

const getCandidatesByGender = async (req, res) => {
    try {
        let { dimension } = req.params
        let { initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds } = await validateParams(req.query)

        const elections = await EleicaoService.getElectionsByYearInterval(initialYear, finalYear, round)
        const electionsIds = elections.map(i => i.id)

        const resp = await CandidatoEleicaoService.getCandidatesGenderByElection(electionsIds, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

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
    getCandidatesByYear,
    getCandidatesByGender
}
