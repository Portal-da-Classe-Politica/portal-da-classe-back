const EleicaoService = require("../services/EleicaoSvc")

const validateParams = (params) => {
    const errors = []

    // Validate dimension
    const validDimensions = ["total_candidates", "elected_candidates"]
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

    // Validate genero_id
    /*    if (params.genero_id) {
        const validGeneroIds = [1, 2, 3, 4]
        const generoIds = params.genero_id.split(",").map(Number)
        if (generoIds.some((id) => !validGeneroIds.includes(id))) {
            errors.push("O parâmetro 'genero_id' contém valores inválidos. Valores permitidos: " + validGeneroIds.join(", "))
        }
    }

    // Validate raca_id
    if (params.raca_id) {
        const validRacaIds = [1, 2, 3, 4, 5, 6, 7]
        const racaIds = params.raca_id.split(",").map(Number)
        if (racaIds.some((id) => !validRacaIds.includes(id))) {
            errors.push("O parâmetro 'raca_id' contém valores inválidos. Valores permitidos: " + validRacaIds.join(", "))
        }
    }

    // Validate ocupacao_categorizada_id
    if (params.ocupacao_categorizada_id) {
        const validOcupacaoIds = [1, 2, 3, 4, 5, 6]
        const ocupacaoIds = params.ocupacao_categorizada_id.split(",").map(Number)
        if (ocupacaoIds.some((id) => !validOcupacaoIds.includes(id))) {
            errors.push("O parâmetro 'ocupacao_categorizada_id' contém valores inválidos. Valores permitidos: " + validOcupacaoIds.join(", "))
        }
    }

    // Validate uf
    const validUFs = [
        "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ",
        "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
    ]
    if (params.uf && !validUFs.includes(params.uf)) {
        errors.push("O parâmetro 'uf' é inválido. Valores permitidos: " + validUFs.join(", "))
    }

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
    const elections = await EleicaoService.getElectionsByYearInterval(filters.initial_year, filters.final_year, "all")
    const electionsIds = elections.map((i) => i.id)

    return {
        dimension: filters.dimension,
        electionsIds,
        cargoId: filters.cargoId,

    }
}

module.exports = {
    validateParams,
    parseFiltersToAnalytics,
}
