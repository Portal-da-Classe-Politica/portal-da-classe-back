const CategoriaSvc = require("../services/CategoriaSvc")

const availableYearsByOrigin = {
    "candidates": { initialYear: 1998, finalYear: 2022 },
    "donations": { initialYear: 2002, finalYear: 2022 },
    "elections": { initialYear: 1998, finalYear: 2022 },

}

const validateParams = async (query, origin) => {
    let {
        dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, categoriasOcupacoes, cargosIds,
    } = query
    let ocupacoesIds = undefined

    if (!initialYear || !finalYear) {
        throw new Error("ERRO: initialYear e finalYear são obrigatórios.")
    }

    await validateFinalAndInitialYearsByOrigin(origin, initialYear, finalYear)

    if (!dimension) {
        dimension = 0
    }

    if (unidadesEleitoraisIds) {
        unidadesEleitoraisIds = unidadesEleitoraisIds.split(",").map(Number)
    }

    if (round && round == "0"){
        round = "all"
    } else if (round && (round == "1" || round == "2")){
        round = parseInt(round)
    }

    if (partidos) {
        partidos = partidos.split(",").map(Number)
    }

    if (cargosIds) {
        cargosIds = cargosIds.split(",").map(Number)
    }

    if (categoriasOcupacoes) {
        categoriasOcupacoes = categoriasOcupacoes.split(",").map(Number)
        const ocupacoes = await CategoriaSvc.getOcubacoesByCategories(categoriasOcupacoes)
        ocupacoesIds = ocupacoes.map((i) => i.id)
    }

    return {
        dimension: parseInt(dimension), initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds,
    }
}

const validateFinalAndInitialYearsByOrigin = async (origin, initialYear, finalYear) => {
    const yearsPossibilitiesForOrigin = availableYearsByOrigin[origin]

    if (initialYear > finalYear) {
        throw new Error("ERRO: initialYear não pode ser maior que finalYear.")
    }

    if (!yearsPossibilitiesForOrigin) {
        throw new Error("ERRO: Cruzamento de consulta não encontrado.")
    }

    if (parseInt(initialYear) < yearsPossibilitiesForOrigin.initialYear || parseInt(finalYear) > yearsPossibilitiesForOrigin.finalYear) {
        throw new Error(`ERRO: Ano deve estar entre ${yearsPossibilitiesForOrigin.initialYear} e ${yearsPossibilitiesForOrigin.finalYear} no cruzamento selecionado.`)
    }
}

const validateDimensionByOrigin = async (origin, dimension) => {
    if (origin === "candidates") {
        if (dimension < 0 || dimension > 3) {
            throw new Error(`ERRO: Dimension ${origin} deve ser entre 0 e 3.`)
        }
    } else if (origin === "donations") {
        if (dimension < 0 || dimension > 4) {
            throw new Error(`ERRO: Dimension ${origin} deve ser entre 0 e 4.`)
        }
    } else if (origin === "elections") {
        if (dimension < 0 || dimension > 4) {
            throw new Error(`ERRO: Dimension ${origin} deve ser entre 0 ou 1.`)
        }
    }
}

const validateParams2 = async (query, origin) => {
    try {
        let {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, categoriasOcupacoes, cargosIds, UF,
        } = query
        let ocupacoesIds = undefined

        if (!initialYear || !finalYear) {
            throw new Error("ERRO: initialYear e finalYear são obrigatórios.")
        }

        await validateFinalAndInitialYearsByOrigin(origin, initialYear, finalYear)

        if (!dimension) {
            dimension = 0
        }
        dimension = parseInt(dimension)

        await validateDimensionByOrigin(origin, dimension)

        if (unidadesEleitoraisIds) {
            if (Array.isArray(unidadesEleitoraisIds)){
                unidadesEleitoraisIds = unidadesEleitoraisIds.map(Number)
            } else {
                unidadesEleitoraisIds = [Number(unidadesEleitoraisIds)]
            }
        }

        if (round && round == "0"){
            round = "all"
        } else if (round && (round == "1" || round == "2")){
            round = parseInt(round)
        }

        if (partidos) {
            if (Array.isArray(partidos)){
                partidos = partidos.map(Number)
            } else {
                partidos = [Number(partidos)]
            }
        }

        if (cargosIds) {
            if (Array.isArray(cargosIds)){
                cargosIds = cargosIds.map(Number)
            } else {
                cargosIds = [Number(cargosIds)]
            }
        }

        if (categoriasOcupacoes) {
            if (Array.isArray(categoriasOcupacoes)){
                categoriasOcupacoes = categoriasOcupacoes.map(Number)
            } else {
                categoriasOcupacoes = [Number(categoriasOcupacoes)]
            }
            const ocupacoes = await CategoriaSvc.getOcubacoesByCategories(categoriasOcupacoes)
            ocupacoesIds = ocupacoes.map((i) => i.id)
        }

        if (UF) {
            if (Array.isArray(UF)){
                UF = UF.map((u) => u.toUpperCase())
            } else {
                UF = [UF.toUpperCase()]
            }
        }

        return {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, UF,
        }
    } catch (error) {
        throw error
    }
}

module.exports = {
    validateParams,
    validateParams2,
}
