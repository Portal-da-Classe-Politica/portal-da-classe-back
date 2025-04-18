const EleicaoService = require("../services/EleicaoSvc")
const { getGrausDeInstrucaoByIdsAgrupados } = require("../services/GrausDeInstrucao")
const { getPartidosByIdsAgrupados } = require("../services/PartidoSvc")
const OcupacaoService = require("../services/OcupacaoSvc")
const unidadeEleitoralSvc = require("../services/UnidateEleitoralService")

const validateParams = (params) => {
    const errors = []

    // Validate dimension
    const validDimensions = ["total_candidates", "elected_candidates", "votes"]
    if (!params.dimension || !validDimensions.includes(params.dimension)) {
        errors.push("O parâmetro 'dimension' é inválido. Valores permitidos: " + validDimensions.join(", "))
    }

    // Validate cargoId
    if (!params.cargoId || isNaN(Number(params.cargoId))) {
        errors.push("O parâmetro 'cargoId' é obrigatório e deve ser um número.")
    }

    // Validate initial_year and final_year
    const minimal_year = 1998
    const maximum_year = 2024
    if (!params.initial_year || !params.final_year) {
        errors.push("Os parâmetros 'initial_year' e 'final_year' são obrigatórios.") }

    if (parseInt(params.initial_year) > parseInt(params.final_year)) {
        errors.push("O parâmetro 'initial_year' não pode ser maior que o parâmetro 'final_year'.")
    }
    if (parseInt(params.initial_year) < minimal_year || parseInt(params.initial_year) > maximum_year) {
        errors.push("O parâmetro 'initial_year' deve estar entre " + minimal_year + " e " + maximum_year + ".")
    }
    if (parseInt(params.final_year) < minimal_year || parseInt(params.final_year) > maximum_year) {
        errors.push("O parâmetro 'final_year' deve estar entre " + minimal_year + " e " + maximum_year + ".")
    }

    // Validate uf
    if (
        params.cargoId
      && params.cargoId != 11
      && params.cargoId != 12
      && params.cargoId != 13
      && params.unidade_eleitoral_id
      && params.unidade_eleitoral_id > 28
    ) {
        errors.push(
            "Cargos de eleições gerais não podem ser filtrados por cidade",
        )
    }

    //= ==================================================================
    // variaveis categoricas
    const categoricalParams = [
        "genero_id",
        "raca_id",
        "ocupacao_categorizada_id",
        "grau_instrucao",
        "sigla_atual_partido",
        "id_agrupado_partido",
    ]
    const providedCategoricalParams = categoricalParams.filter((param) => params[param])
    if (providedCategoricalParams.length > 3) {
        errors.push(
            "Apenas 3 dos seguintes parâmetros podem ser fornecidos: "
        + categoricalParams.join(", ")
        + ". Você forneceu: "
        + providedCategoricalParams.join(", "),
        )
    }

    providedCategoricalParams.forEach((param) => {
        let values = params[param]

        // Handle repeated query params (e.g., genero_id=1&genero_id=2)
        if (Array.isArray(values)) {
            values = values.flat() // Flatten the array if needed
        } else if (typeof values === "string") {
            values = values.split(",") // Split comma-separated values
        }

        if (values.length > 2) {
            errors.push(
                `O parâmetro '${param}' pode conter no máximo 2 valores. Você forneceu: ${values.length}.`,
            )
        }
    })

    // Validate genero_id
    if (params.genero_id) {
        const validGeneroIds = [1, 2, 3, 4]
        const generoIds = Array.isArray(params.genero_id) ? params.genero_id.map(Number) : [Number(params.genero_id)]
        if (generoIds.some((id) => !validGeneroIds.includes(id))) {
            errors.push("O parâmetro 'genero_id' contém valores inválidos. Valores permitidos: " + validGeneroIds.join(", "))
        }
    }

    // Validate raca_id
    if (params.raca_id) {
        const validRacaIds = [1, 2, 3, 4, 5, 6, 7]
        const racaIds = Array.isArray(params.raca_id) ? params.raca_id.map(Number) : [Number(params.raca_id)]
        if (racaIds.some((id) => !validRacaIds.includes(id))) {
            errors.push("O parâmetro 'raca_id' contém valores inválidos. Valores permitidos: " + validRacaIds.join(", "))
        }
    }

    // Validate ocupacao_categorizada_id
    if (params.ocupacao_categorizada_id) {
        const validOcupacaoIds = [1, 2, 3, 4, 5, 6]
        const ocupacaoIds = Array.isArray(params.ocupacao_categorizada_id) ? params.ocupacao_categorizada_id.map(Number) : [Number(params.ocupacao_categorizada_id)]
        if (ocupacaoIds.some((id) => !validOcupacaoIds.includes(id))) {
            errors.push("O parâmetro 'ocupacao_categorizada_id' contém valores inválidos. Valores permitidos: " + validOcupacaoIds.join(", "))
        }
    }
    /*
    // Validate grau_instrucao
    if (params.grau_instrucao) {
        const validGraus = [
            "ANALFABETO", "ENSINO FUNDAMENTAL COMPLETO", "ENSINO FUNDAMENTAL INCOMPLETO",
            "ENSINO MÉDIO COMPLETO", "ENSINO MÉDIO INCOMPLETO", "LÊ E ESCREVE",
            "NÃO INFORMADO", "SUPERIOR COMPLETO", "SUPERIOR INCOMPLETO",
        ]
        const graus = params.grau_instrucao.split(",")
        if (graus.some((grau) => !validGraus.includes(grau))) {
            errors.push("O parâmetro 'grau_instrucao' contém valores inválidos. Valores permitidos: " + validGraus.join(", "))
        }
    }

    // Validate sigla_atual_partido
    if (params.sigla_atual_partido) {
        const validPartidos = [
            "AGIR", "AVANTE", "CIDADANIA", "DC", "DEM", "MDB", "NOVO", "PAN", "PATRIOTA", "PC do B", "PCB", "PCO", "PDT",
            "PFL", "PGT", "PHS", "PL", "PMB", "PMDB", "PMN", "PODE", "PP", "PPB", "PPL", "PPS", "PR", "PRB", "PRN", "PRONA",
            "PROS", "PRP", "PRTB", "PSB", "PSC", "PSD", "PSDB", "PSDC", "PSL", "PSN", "PSOL", "PST", "PSTU", "PT", "PT do B",
            "PTB", "PTC", "PTN", "PV", "REDE", "REPUBLICANOS", "SDD", "UNIÃO", "UP", null,
        ]
        const partidos = params.sigla_atual_partido.split(",")
        if (partidos.some((partido) => !validPartidos.includes(partido))) {
            errors.push("O parâmetro 'sigla_atual_partido' contém valores inválidos. Valores permitidos: " + validPartidos.join(", "))
        }
    } */

    return errors
}

const parseFiltersToAnalytics = async (filters) => {
    let shouldFindCity = false
    let abrangencia = 1
    if (filters.ocupacao_categorizada_id){
        if (!Array.isArray(filters.ocupacao_categorizada_id)) {
            filters.ocupacao_categorizada_id = [filters.ocupacao_categorizada_id]
        }
    }
    if (filters.grau_instrucao){
        if (!Array.isArray(filters.grau_instrucao)) {
            filters.grau_instrucao = [filters.grau_instrucao]
        }
    }
    // getPartidosByIdsAgrupados

    if (filters.id_agrupado_partido){
        if (!Array.isArray(filters.id_agrupado_partido)) {
            filters.id_agrupado_partido = [filters.id_agrupado_partido]
        }
    }

    if (
        filters.cargoId == 11 // vereador
      || filters.cargoId == 12 // prefeito
      || filters.cargoId == 13 // vice-prefeito
    ) {
        abrangencia = 2
        if (!filters.unidade_eleitoral_id && filters.uf) {
            shouldFindCity = true
        }
    }

    const [elections, ocupations, instructionsDegrees, parties, electoralUnities] = await Promise.all([
        EleicaoService.getElectionsByYearInterval(filters.initial_year, filters.final_year, "all"),
        filters.ocupacao_categorizada_id?.length ? OcupacaoService.getOcupationsIDsByCategory(filters.ocupacao_categorizada_id) : [],
        filters.grau_instrucao?.length ? getGrausDeInstrucaoByIdsAgrupados(filters.grau_instrucao) : [],
        filters.id_agrupado_partido?.length ? getPartidosByIdsAgrupados(filters.id_agrupado_partido) : [],
        shouldFindCity ? unidadeEleitoralSvc.getAllElectoralUnitiesIdsByUF(filters.uf)
            : filters.uf ? unidadeEleitoralSvc.getElectoralUnitsByUFandAbrangency(filters.uf, abrangencia)
                : [],
    ])

    const ocupationsIds = ocupations.map((i) => i.id)
    const electionsIds = elections.map((i) => i.id)
    const instructionsDegreesIds = instructionsDegrees.map((i) => i.id)
    const partidosIds = parties.map((i) => i.id)
    const electoralUnitiesIds = electoralUnities.map((i) => i.id)

    if (filters.genero_id){
        if (!Array.isArray(filters.genero_id)) {
            filters.genero_id = [filters.genero_id]
        }
        if (filters.genero_id.includes("3")){
            filters.genero_id.push("4")
        }
    }

    if (filters.raca_id){
        if (!Array.isArray(filters.raca_id)) {
            filters.raca_id = [filters.raca_id]
        }
        if (filters.raca_id.includes("1")){
            filters.raca_id.push("7")
        }
    }

    if (filters.grau_instrucao){
        if (!Array.isArray(filters.grau_instrucao)) {
            filters.grau_instrucao = [filters.grau_instrucao]
        }
    }

    return {
        dimension: filters.dimension,
        electionsIds,
        cargoId: filters.cargoId,
        partidosIds,
        ocupationsIds,
        gendersIds: filters.genero_id,
        racesIds: filters.raca_id,
        instructionsDegreesIds,
        electoralUnitiesIds,
    }
}

module.exports = {
    validateParams,
    parseFiltersToAnalytics,
}
