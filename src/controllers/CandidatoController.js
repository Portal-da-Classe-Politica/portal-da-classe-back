const cargoService = require("../services/CargoService")
const candidatoSvc = require("../services/CandidatoService")
const nomeUrnaSvc = require("../services/NomeUrnaSvc")
const candidatoEleicaoSvc = require("../services/CandidatoEleicaoSvc")
const EleicaoSvc = require("../services/EleicaoSvc")
const { getFiltersForSearchesByOrigin } = require("../utils/filterParsers")
const indicadorPerfilSvc = require("../services/indicadores/indicadoresPerfil")
const logger = require("../utils/logger")

const getFiltersForSearch = async (req, res) => {
    const { dimension, cargoId } = req.query
    let abrangenciaId

    try {
        if (cargoId) {
            const cargo = await cargoService.getAbragencyByCargoID(cargoId)
            if (!cargo) throw new Error("Cargo não encontrado")
            abrangenciaId = cargo.abrangencia
        }
        const data = await getFiltersForSearchesByOrigin(dimension || "candidates", abrangenciaId)
        return res.json({
            success: true,
            data,
            message: "Dados buscados com sucesso.",

        })
    } catch (error) {
        logger.error(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar os filtros dos candidatos",
        })
    }
}

const getCandidateDetail = async (req, res) => {
    try {
        const { id } = req.params
        if (!id) throw new Error("ID do candidato é obrigatório")
        const candidate = await candidatoSvc.getCandidateDetailById(id)
        if (!candidate) throw new Error("Candidato não encontrado")
        return res.json({
            success: true,
            data: candidate,
            message: "Candidato encontrado com sucesso.",
        })
    } catch (error) {
        // console.log(error)
        logger.error(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar o candidato",
        })
    }
}

const getLastElectionVotesByRegion = async (req, res) => {
    try {
        const { id } = req.params
        if (!id) throw new Error("ID do candidato é obrigatório")
        const candidate = await candidatoSvc.getCandidate(id)
        if (!candidate) throw new Error("Candidato não encontrado")
        if (!candidate.ano_eleicao) throw new Error("Candidato não possui ano de eleição")
        const lastElectionFirstTurn = await EleicaoSvc.getLastElectionFirstTurn(candidate.ano_eleicao, 1)
        const votes = await candidatoEleicaoSvc.getLastElectionVotesByRegion(id, lastElectionFirstTurn.id)
        if (!votes) throw new Error("Votos não encontrados")
        return res.json({
            success: true,
            message: "Votos encontrados com sucesso.",
            data: votes,

        })
    } catch (error) {
        logger.error(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar os votos",
        })
    }
}

const getLast5LastElectionsVotes = async (req, res) => {
    // TO-DO: Implementar a busca dos votos das últimas 5 eleições
    try {
        const candidateId = req.params.id
        if (!candidateId) throw new Error("ID do candidato é obrigatório")
        const candidate = await candidatoSvc.getCandidate(candidateId)
        if (!candidate) throw new Error("Candidato não encontrado")
        const elections = await candidatoEleicaoSvc.getLast5LastElections(candidateId, 40)
        if (!elections) throw new Error("Nenhuma eleição encontrada.")
        const candidateElectionsIds = elections.map((election) => election.id)
        const votes = await candidatoEleicaoSvc.getLast5LastElectionsVotes(candidateElectionsIds)

        return res.json({
            success: true,
            message: "Votos encontrados com sucesso.",
            data: votes,

        })
    } catch (error) {
        logger.log(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar os votos",
        })
    }
}

const getKpis = async (req, res) => {
    try {
        const { id } = req.params
        if (!id) throw new Error("ID do candidato é obrigatório")
        const candidate = await candidatoSvc.getCandidate(id)
        if (!candidate) throw new Error("Candidato não encontrado")

        const [kpiMigracaoPartidaria, kpiDispersaoVotos] = await Promise.all([
            /*  indicadorPerfilSvc.getCustoPorVoto(id), */
            indicadorPerfilSvc.getCargosEleitos(id),
            // indicadorPerfilSvc.getPercentilPatrimonio(id),
            indicadorPerfilSvc.getDispersaoVotos(id),
        ])

        return res.json({
            success: true,
            message: "KPIs encontrados com sucesso.",
            data: [
                /*  kpiCustoPorVoto, */
                kpiMigracaoPartidaria,
                /* kpiPercentilPatrimonio, */
                kpiDispersaoVotos,
            ],
        })
    } catch (error) {
        logger.error(error)
        console.log(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar os KPIs",
        })
    }
}

const fuzzySearchCandidatesByName = async (req, res) => {
    try {
        const { name, page = 1, limit = 10 } = req.query

        if (!name) {
            return res.status(400).json({
                success: false,
                data: {},
                message: "Nome é obrigatório para a busca.",
            })
        }

        if (name.length < 3) {
            return res.status(400).json({
                success: false,
                data: {},
                message: "Nome deve ter pelo menos 3 caracteres.",
            })
        }

        const skip = (parseInt(page) - 1) * parseInt(limit)

        // Buscar candidatos por nome usando busca difusa
        const result = await nomeUrnaSvc.fuzzySearchCandidatesByName(name, skip, parseInt(limit))

        if (!result) throw new Error("Erro ao buscar candidatos")

        return res.json({
            success: true,
            data: result,
            message: "Candidatos encontrados com sucesso.",
        })
    } catch (error) {
        logger.error(error)
        console.error("Erro ao buscar candidatos com busca difusa:", error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar candidatos com busca difusa.",
        })
    }
}

module.exports = {
    getLast5LastElectionsVotes,
    getLastElectionVotesByRegion,
    getFiltersForSearch,
    getCandidateDetail,
    getKpis,
    fuzzySearchCandidatesByName,
}
