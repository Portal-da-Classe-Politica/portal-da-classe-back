const cargoService = require("../services/CargoService")
const generoSvc = require("../services/GeneroService")
const unidadeEleitoralSvc = require("../services/UnidateEleitoralService")
const candidatoSvc = require("../services/CandidatoService")
const nomeUrnaSvc = require("../services/NomeUrnaSvc")
const candidatoEleicaoSvc = require("../services/CandidatoEleicaoSvc")
const EleicaoSvc = require("../services/EleicaoSvc")
const DoacoesCandidatoEleicaoSvc = require("../services/DoacoesCandidatoEleicaoSvc")

const getFiltersForSearch = async (req, res) => {
    try {
        const [cargos, generos, estados] = await Promise.all(
            [
                cargoService.getAllCargos(),
                generoSvc.getAllGenders(),
                unidadeEleitoralSvc.getFederativeUnitsByAbrangency(1),
            ],
        )
        return res.json({
            success: true,
            data: {
                cargos,
                generos,
                estados,
            },
            message: "Dados buscados com sucesso.",

        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar os filtros dos candidatos",
        })
    }
}

const getCandidates = async (req, res) => {
    try {
        let {
            name, UF, abrangencyId, electoralUnitId, page,
        } = req.query

        let skip = 0
        const limit = 10
        if (!page) page = 1
        skip = (parseInt(page) - 1) * limit

        // se nao passar nada
        if (!abrangencyId && !UF && !electoralUnitId && !name) {
            const result = await candidatoSvc.get10CandidatesSortedByName(skip, limit)
            if (!result || !result.results || !result.results.length) throw new Error("Erro ao buscar candidatos")

            const latestElections = await candidatoEleicaoSvc.getLatestElectionsForSearch(result.results, 0, limit, undefined, page)
            return res.json({
                success: true,
                data: {
                    totalResults: result.totalResults,
                    currentPage: result.currentPage,
                    totalPages: result.totalPages,
                    results: latestElections.results,
                },
                message: "Candidatos encontrados com sucesso.",
            })
        }
        let electoralUnitiesIds
        const UFsAllowed = await unidadeEleitoralSvc.getFederativeUnitsByAbrangency(1, "ufAndId")
        let UFFinded
        if (UF) UFFinded = UFsAllowed.find((uf) => uf.sigla_unidade_federacao === UF.toUpperCase())
        if (abrangencyId === "1"){
            if (UF && !UFFinded) {
                return res.json({
                    success: false,
                    data: {},
                    message: "UF não permitida/encontrada.",
                })
            }
        }

        // se escolher apenas abrangencia
        if (!UF && !electoralUnitId){
            if (abrangencyId === "1"){
                electoralUnitiesIds = UFsAllowed.map((uf) => uf.id)
            } else {
                electoralUnitiesIds =[]
            }
        }

        // se escolher apenas UF
        if (UF && !electoralUnitId){
            if (abrangencyId === "1"){
                electoralUnitiesIds = [UFFinded.id]
            } else if (abrangencyId === "2") {
                const electoralUnities = await unidadeEleitoralSvc.getFederativeUnitsByAbrangency(2, "ufAndId", UF.toUpperCase())
                electoralUnitiesIds = electoralUnities.map((uf) => uf.id)
            } else {
                const electoralUnities = await unidadeEleitoralSvc.getAllElectoralUnitiesIdsByUF(UF.toUpperCase())
                electoralUnitiesIds = electoralUnities.map((uf) => uf.id)
            }
        }

        if (electoralUnitId && (!electoralUnitiesIds || !electoralUnitiesIds.length)){
            electoralUnitiesIds = [electoralUnitId]
        }

        if (name) {
            if (name.length < 4) {
                return res.json({
                    success: false,
                    data: {},
                    message: "Nome de candidato deve ter pelo menos 4 caracteres.",
                })
            }
            const candidates = await nomeUrnaSvc.getCandidatesIdsByNomeUrnaOrName(name, skip, limit, electoralUnitiesIds)
            if (!candidates) throw new Error("Erro ao buscar candidatos")

            const latestElections = await candidatoEleicaoSvc.getCandidatesIdsByCandidateElectionsIds(candidates.ids, skip, limit, page, candidates.count)
            return res.json({
                success: true,
                data: latestElections,
                message: "Candidatos encontrados com sucesso.",
            })
        }

        const latestElections = await candidatoEleicaoSvc.getLatestElectionsForSearch(undefined, skip, limit, electoralUnitiesIds, page)
        return res.json({
            success: true,
            data: latestElections,
            message: "Candidatos encontrados com sucesso.",
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar os candidatos",
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
        console.log(error)
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
        const elections = await candidatoEleicaoSvc.getLast5LastElections(candidateId)
        if (!elections) throw new Error("Nenhuma eleição encontrada.")
        const candidateElectionsIds = elections.map((election) => election.id)
        const votes = await candidatoEleicaoSvc.getLast5LastElectionsVotes(candidateElectionsIds)

        return res.json({
            success: true,
            message: "Votos encontrados com sucesso.",
            data: votes,

        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar os votos",
        })
    }
}

const getBiggestDonors = async (req, res) => {
    try {
        let { page } = req.query
        const limit = 10
        let skip = 0
        if (!page) page = 1
        skip = (parseInt(page) - 1) * limit
        const candidateId = req.params.id
        if (!candidateId) throw new Error("ID do candidato é obrigatório")
        const candidate = await candidatoSvc.getCandidate(candidateId)
        if (!candidate) throw new Error("Candidato não encontrado")
        const elections = await candidatoEleicaoSvc.getLastAllElections(candidateId)
        if (!elections) throw new Error("Nenhuma eleição encontrada.")
        const candidateElectionsIds = elections.map((election) => election.id)
        const donors = await DoacoesCandidatoEleicaoSvc.getBiggestDonors(candidateElectionsIds, skip, limit, page)
        return res.json({
            success: true,
            message: "Doadores encontrados com sucesso.",
            data: donors,

        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar os votos",
        })
    }
}

module.exports = {
    getBiggestDonors,
    getLast5LastElectionsVotes,
    getLastElectionVotesByRegion,
    getCandidates,
    getFiltersForSearch,
    getCandidateDetail,
}
