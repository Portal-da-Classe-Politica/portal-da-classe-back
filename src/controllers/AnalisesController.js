const cargoService = require("../services/CargoService")
const generoSvc = require("../services/GeneroService")
const RacaSvc = require("../services/RacaSvc")
const categoriaSvc = require("../services/CategoriaSvc")
const GrauDeInstrucaoSvc = require("../services/GrausDeInstrucao")
const partidoSvc = require("../services/PartidoSvc")
const unidadeEleitoralSvc = require("../services/UnidateEleitoralService")
const EleicaoSvc = require("../services/EleicaoSvc")
const analisesFilterParser = require("../utils/analisesFilterParser")

const logger = require("../utils/logger")

const getFiltersForAnalyticsByRole = async (req, res) => {
    const { cargoId } = req.params

    try {
        if (!cargoId) {
            return res.status(400).json({
                success: false,
                data: {},
                message: "É necessário informar o cargo",
            })
        }
        const cargo = await cargoService.getAbragencyByCargoID(cargoId)
        if (!cargo) throw new Error("Cargo não encontrado")
        abrangenciaId = cargo.abrangencia
        const [anos, generos, racas, ocupacoes_categorizadas, intrucao, partidos, estados] = await Promise.all([
            EleicaoSvc.getAllElectionsYearsByAbragencyForFilters(abrangenciaId),
            generoSvc.getAllGenders(),
            RacaSvc.getAllRacas(),
            categoriaSvc.getAllCategorias(),
            GrauDeInstrucaoSvc.getAllGrausDeInstrucao(),
            partidoSvc.getAllPartidosComSiglaAtualizada(),
            unidadeEleitoralSvc.getFederativeUnitsByAbrangency(abrangenciaId, "onlyUF"),
        ])

        const filterObject = {
            anos,
            generos,
            racas,
            ocupacoes_categorizadas,
            intrucao,
            partidos,
            estados,
            cargo: cargoId,
            abrangencia: abrangenciaId,
        }

        const data = analisesFilterParser.parseFiltersToAnalytics(filterObject)

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

const getCargoAndAnalises = async (req, res) => {
    try {
        const cargos = await cargoService.getAllCargos()
        return res.json({
            success: true,
            data: {
                possibilities: [
                    {
                        label: "Quantidade de candidaturas",
                        value: "total_candidates",
                    },
                    {
                        label: "Sucesso eleitoral",
                        value: "elected_candidates",
                    },
                    // {
                    //     label: "Votação",
                    //     value: "votes",
                    // },
                ],
                cargos,
            },
            message: "Possibilidades encontradas com sucesso.",
        })
    } catch (error) {
        logger.error(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar as possibilidades de análises",
        })
    }
}

module.exports = {
    getFiltersForAnalyticsByRole,
    getCargoAndAnalises,
}
