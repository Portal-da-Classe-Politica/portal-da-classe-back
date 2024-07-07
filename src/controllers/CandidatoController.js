const cargoService = require("../services/CargoService")
const generoSvc = require("../services/GeneroService")
const unidadeEleitoralSvc = require("../services/UnidateEleitoralService")
const candidatoSvc = require("../services/CandidatoService")
const nomeUrnaSvc = require("../services/NomeUrnaSvc")
const candidatoEleicaoSvc = require("../services/CandidatoEleicaoSvc")

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
        return res.json({
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

        let electoralUnitiesIds

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
            } else {
                const electoralUnities = await unidadeEleitoralSvc.getFederativeUnitsByAbrangency(2, "ufAndId", UF.toUpperCase())
                electoralUnitiesIds = electoralUnities.map((uf) => uf.id)
            }
        }

        if (electoralUnitId && !electoralUnitiesIds.length){
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
            const candidateIds = await nomeUrnaSvc.getCandidatesIdsByNomeUrnaOrName(name)
            if (!Array.isArray(candidateIds)) throw candidateIds

            const latestElections = await candidatoEleicaoSvc.getLatestElectionsForSearch(candidateIds, skip, limit, electoralUnitiesIds, page)
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
        return res.json({
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
        //console.log(error)
        return res.json({
            success: false,
            data: {},
            message: "Erro ao buscar o candidato",
        })
    }
}

module.exports = {
    getCandidates,
    getFiltersForSearch,
    getCandidateDetail,
}
