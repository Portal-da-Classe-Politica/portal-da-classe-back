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
const { generateLineChartForMultipleLines } = require("../utils/chartParsers")
const { Parser } = require("json2csv") // no topo do arquivo

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
        const [anos, ocupacoes_categorizadas, intrucao, partidos, estados] = await Promise.all([
            EleicaoSvc.getAllElectionsYearsByAbragencyForFilters(abrangenciaId),
            categoriaSvc.getAllCategorias(),
            GrauDeInstrucaoSvc.getAllGrausDeInstrucao(),
            partidoSvc.getAllPartidosComSiglaAtualizada(),
            unidadeEleitoralSvc.getFederativeUnitsByAbrangency(abrangenciaId, "onlyUF"),
        ])

        const filterObject = {
            anos,
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
                    {
                        label: "Votação",
                        parameter: "dimension",
                        value: "votes",
                    },
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
        id_agrupado_partido,
        unidade_eleitoral_id,
        exportcsv,
    } = req.query

    try {
        const params = {
            dimension,
            cargoId,
            uf,
            unidade_eleitoral_id,
            initial_year,
            final_year,
            genero_id,
            raca_id,
            ocupacao_categorizada_id,
            grau_instrucao,
            id_agrupado_partido,
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
        const providedCrossParams = {
            "genero_id": "genero",
            "raca_id": "raca",
            "ocupacao_categorizada_id": "ocupacao",
            "grau_instrucao": "instrucao",
            "id_agrupado_partido": "partido",
        }

        // Filtrar e mapear os valores de providedCrossParams com base em providedCategoricalParams
        const providedCategoricalParams = Object.keys(providedCrossParams).filter((param) => params[param])
        const crossParamsValues = providedCategoricalParams.map((param) => providedCrossParams[param])

        const parsedParams = await parseFiltersToAnalytics(params)

        const dbData = await analisesSvc.getAnalyticCrossCriteria(parsedParams)
        if (exportcsv === "true") {
            if (dimension === "elected_candidates"){
                for (const curr of dbData) {
                    curr.status_eleicao = curr.status_eleicao ? "Eleito" : "Não eleito"
                }
            }
            const parser = new Parser()
            const data = parser.parse(dbData)

            console.log("Exportando CSV")
            res.header("Content-Type", "text/csv")
            res.attachment("cruzamento.csv")
            return res.send(data)
        }

        const graphData = generateLineChartForMultipleLines(dbData, parsedParams.dimension, crossParamsValues)

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

const getRolesByDimension = async (req, res) => {
    try {
        const { dimension } = req.params
        if (!dimension) {
            return res.status(400).json({
                success: false,
                data: {},
                message: "É necessário informar a dimensão",
            })
        }

        const roles = await cargoService.getAllCargos()

        const filteredRoles = dimension === "votes"
            ? roles.filter((cargo) => cargo.id !== 14 && cargo.id !== 15)
            : roles

        return res.json({
            success: true,
            data: filteredRoles,
            message: "Cargos encontrados com sucesso.",
        })
    } catch (error) {
        logger.error(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar os cargos",
        })
    }
}

module.exports = {
    getRolesByDimension,
    getFiltersForAnalyticsByRole,
    getCargoAndAnalises,
    generateGraph,
}
