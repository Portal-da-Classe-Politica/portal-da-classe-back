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
        const abrangenciaId = cargo.abrangencia
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

        // Preencher dados faltantes com zero para categorias sem resultados
        const completeData = await fillMissingCategoriesWithZero(dbData, providedCategoricalParams, parsedParams, params)

        if (exportcsv === "true") {
            if (dimension === "elected_candidates"){
                for (const curr of completeData) {
                    curr.status_eleicao = curr.status_eleicao ? "Eleito" : "Não eleito"
                }
            }
            const parser = new Parser({
                delimiter: ";",
            })
            let data = parser.parse(completeData)
            data += "\nFonte: Portal da Classe Política - INCT ReDem (2025)"

            console.log("Exportando CSV")
            res.header("Content-Type", "text/csv")
            res.attachment("cruzamento.csv")
            return res.send(data)
        }

        const graphData = generateLineChartForMultipleLines(completeData, parsedParams.dimension, crossParamsValues)

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

// Função auxiliar para preencher dados faltantes com zero
const fillMissingCategoriesWithZero = async (dbData, providedCategoricalParams, parsedParams, params) => {
    if (providedCategoricalParams.length === 0) {
        return dbData
    }

    try {
        // Obter as combinações específicas selecionadas pelo usuário
        const selectedCombinations = await getSelectedCombinations(providedCategoricalParams, params)

        // Obter todos os anos - dos dados existentes OU dos parâmetros enviados
        const allYears = getAvailableYears(dbData, params)

        return fillDataForSelectedCombinations(dbData, allYears, selectedCombinations, parsedParams)
    } catch (error) {
        logger.error("Erro ao preencher dados faltantes:", error)
        // Em caso de erro, retorna os dados originais
        return dbData
    }
}

// Função auxiliar para obter todos os anos disponíveis
const getAvailableYears = (dbData, params) => {
    const yearsFromData = [...new Set(dbData.map((item) => item.ano))]
    const yearsFromParams = getYearsFromParams(params)

    // Combinar anos dos dados com anos dos parâmetros, removendo duplicatas
    const allYears = [...new Set([...yearsFromData, ...yearsFromParams])]

    return allYears.sort((a, b) => a - b)
}

// Função auxiliar para extrair anos dos parâmetros
const getYearsFromParams = (params) => {
    const years = []

    const initialYear = parseInt(params.initial_year)
    const finalYear = parseInt(params.final_year)

    if (initialYear && finalYear && initialYear <= finalYear) {
        years.push(...generateElectionYears(initialYear, finalYear))
    } else if (initialYear) {
        years.push(initialYear)
    } else if (finalYear) {
        years.push(finalYear)
    }

    return years
}

// Função auxiliar para gerar anos eleitorais
const generateElectionYears = (initialYear, finalYear) => {
    const years = []
    const yearSpan = finalYear - initialYear

    // Para intervalos pequenos, incluir todos os anos pares
    if (yearSpan <= 8) {
        for (let year = initialYear; year <= finalYear; year++) {
            if (year % 2 === 0) {
                years.push(year)
            }
        }
    } else {
        // Para intervalos maiores, incluir apenas anos eleitorais principais
        for (let year = initialYear; year <= finalYear; year++) {
            if (year % 4 === 0 || year % 4 === 2) {
                years.push(year)
            }
        }
    }

    return years
}

// Função auxiliar para obter as combinações específicas selecionadas pelo usuário
const getSelectedCombinations = async (providedCategoricalParams, params) => {
    if (providedCategoricalParams.length === 0) {
        return []
    }

    // Buscar os dados das categorias selecionadas para mapear IDs para nomes
    const categoryMappings = await getCategoryMappings(providedCategoricalParams)

    // Obter os valores específicos selecionados pelo usuário
    const selectedValues = {}

    for (const param of providedCategoricalParams) {
        const userValues = params[param]

        if (!userValues) {
            // eslint-disable-next-line no-continue
            continue
        }

        // Normalizar para array
        const valueArray = Array.isArray(userValues) ? userValues : [userValues]

        // Mapear IDs para nomes usando os mapeamentos
        const categoryKey = getCategoryKey(param)
        const mapping = categoryMappings[categoryKey]

        if (mapping) {
            selectedValues[categoryKey] = valueArray.map((id) => {
                const found = mapping.find((item) => item.id.toString() === id.toString())
                return found ? found.name : `ID ${id}`
            })
        }
    }

    // Gerar combinações apenas dos valores selecionados
    return generateSelectedCombinations(selectedValues)
}

// Função auxiliar para obter mapeamentos de ID para nome
const getCategoryMappings = async (providedCategoricalParams) => {
    const mappings = {}

    const categoryPromises = providedCategoricalParams.map(async (param) => {
        switch (param) {
        case "genero_id": {
            const generos = await generoSvc.getAllGenders()
            return { key: "genero", mapping: generos.map((g) => ({ id: g.id, name: g.nome_genero })) }
        }
        case "raca_id": {
            const racas = await RacaSvc.getAllRacas()
            return { key: "raca", mapping: racas.map((r) => ({ id: r.id, name: r.nome })) }
        }
        case "ocupacao_categorizada_id": {
            const ocupacoes = await categoriaSvc.getAllCategorias()
            return { key: "ocupacao", mapping: ocupacoes.map((o) => ({ id: o.id, name: o.nome })) }
        }
        case "grau_instrucao": {
            const instrucoes = await GrauDeInstrucaoSvc.getAllGrausDeInstrucao()
            return { key: "instrucao", mapping: instrucoes.map((i) => ({ id: i.id_agrupado, name: i.nome_agrupado })) }
        }
        case "id_agrupado_partido": {
            const partidos = await partidoSvc.getAllPartidosComSiglaAtualizada()
            return { key: "partido", mapping: partidos.map((p) => ({ id: p.id_agrupado, name: p.nome_atual })) }
        }
        default:
            return null
        }
    })

    const results = await Promise.all(categoryPromises)

    results.forEach((result) => {
        if (result) {
            mappings[result.key] = result.mapping
        }
    })

    return mappings
}

// Função auxiliar para obter a chave da categoria
const getCategoryKey = (param) => {
    const mapping = {
        "genero_id": "genero",
        "raca_id": "raca",
        "ocupacao_categorizada_id": "ocupacao",
        "grau_instrucao": "instrucao",
        "id_agrupado_partido": "partido",
    }
    return mapping[param] || param
}

// Função auxiliar para gerar combinações dos valores selecionados
const generateSelectedCombinations = (selectedValues) => {
    const keys = Object.keys(selectedValues)
    if (keys.length === 0) return []

    const combinations = []

    function generateCombinations(currentCombination, remainingKeys) {
        if (remainingKeys.length === 0) {
            combinations.push({ ...currentCombination })
            return
        }

        const currentKey = remainingKeys[0]
        const values = selectedValues[currentKey] || []

        for (const value of values) {
            currentCombination[currentKey] = value
            generateCombinations(currentCombination, remainingKeys.slice(1))
        }
    }

    generateCombinations({}, keys)
    return combinations
}

// Função auxiliar para preencher dados para as combinações selecionadas
const fillDataForSelectedCombinations = (dbData, allYears, selectedCombinations, parsedParams) => {
    const filledData = []

    // Se não há anos disponíveis, não há nada para preencher
    if (allYears.length === 0) {
        return dbData
    }

    // Se não há combinações selecionadas, retorna os dados originais
    if (selectedCombinations.length === 0) {
        return dbData
    }

    for (const year of allYears) {
        for (const combination of selectedCombinations) {
            // Verificar se há um registro existente para esta combinação e ano
            const existingData = findExistingData(dbData, year, combination)

            if (existingData) {
                filledData.push(existingData)
            } else {
                // Criar registro com zero para esta combinação
                const zeroRecords = createZeroRecords(year, combination, parsedParams)
                filledData.push(...zeroRecords)
            }
        }
    }

    return filledData
}

// Função auxiliar para encontrar dados existentes
const findExistingData = (dbData, year, combination) => {
    return dbData.find((item) => {
        if (item.ano !== year) return false

        for (const [key, value] of Object.entries(combination)) {
            if (item[key] !== value) return false
        }

        return true
    })
}

// Função auxiliar para criar registros com zero
const createZeroRecords = (year, combination, parsedParams) => {
    const baseRecord = {
        ano: year,
        total: 0,
        ...combination,
    }

    // Para sucesso eleitoral, adicionar ambos os status
    if (parsedParams.dimension === "elected_candidates") {
        return [
            { ...baseRecord, status_eleicao: true },
            { ...baseRecord, status_eleicao: false },
        ]
    }

    return [baseRecord]
}

module.exports = {
    getRolesByDimension,
    getFiltersForAnalyticsByRole,
    getCargoAndAnalises,
    generateGraph,
}
