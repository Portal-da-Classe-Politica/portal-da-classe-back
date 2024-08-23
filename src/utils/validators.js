const availableYearsByOrigin = {
    "candidates": { initialYear: 1998, finalYear: 2022 },
    "donations": { initialYear: 2002, finalYear: 2022 },

}

const validateParams = async (query, origin) => {
    let {
        dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, categoriasOcupacoes, cargosIds,
    } = query
    let ocupacoesIds = undefined

    if (!initialYear || !finalYear) {
        throw new Error("ERRO: initialYear e finalYear são obrigatórios.")
    }

    validateFinalAndInitialYearsByOrigin(origin, initialYear, finalYear)

    if (!dimension) {
        dimension = 0
    }

    if (unidadesEleitoraisIds) {
        unidadesEleitoraisIds = unidadesEleitoraisIds.split(",").map(Number)
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

module.exports = {
    validateParams,
}
