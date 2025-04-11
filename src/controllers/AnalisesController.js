const cargoService = require("../services/CargoService")
const generoSvc = require("../services/GeneroService")
const RacaSvc = require("../services/RacaSvc")
const categoriaSvc = require("../services/CategoriaSvc")
const GrauDeInstrucaoSvc = require("../services/GrausDeInstrucao")
const partidoSvc = require("../services/PartidoSvc")
const unidadeEleitoralSvc = require("../services/UnidateEleitoralService")
const EleicaoSvc = require("../services/EleicaoSvc")
const analisesFilterParser = require("../utils/analisesFilterParser")
const { validateParams, parseFiltersToAnalytics } = require("../utils/validateAnalises")
const analisesSvc = require("../services/AnalisesSvc")

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
                        parameter: "dimension",
                        value: "total_candidates",
                    },
                    {
                        label: "Sucesso eleitoral",
                        parameter: "dimension",
                        value: "elected_candidates",
                    },
                    // {
                    //     label: "Votação",
                    //parameter: "dimension",
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

const generateGraph = async (req, res) => {
    const {
        dimension,
        cargoId,
        uf,
        initial_year,
        final_year,
        genero_id,
        raca_id,
        ocupacao_categorizada_id,
        grau_instrucao,
        sigla_atual_partido,
    } = req.query

    try {
        const params = {
            dimension,
            cargoId,
            uf,
            initial_year,
            final_year,
            genero_id,
            raca_id,
            ocupacao_categorizada_id,
            grau_instrucao,
            sigla_atual_partido,
        }
        const validationErrors = validateParams(params)

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                data: {},
                message: "Parâmetros inválidos",
                errors: validationErrors,
            })
        }
        const parsedParams = await parseFiltersToAnalytics(params)

        const graphData = await analisesSvc.getAnalyticCrossCriteria(parsedParams)

        // Simulate graph generation logic (replace with actual implementation)

        return res.json({
            success: true,
            data: graphData,
            message: "Gráfico gerado com sucesso.",
        })
    } catch (error) {
        logger.error(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao gerar o gráfico",
        })
    }
}

module.exports = {
    getFiltersForAnalyticsByRole,
    getCargoAndAnalises,
    generateGraph,
}
