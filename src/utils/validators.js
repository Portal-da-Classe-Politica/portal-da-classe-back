const validateParams = async (query) => {
    let {
        dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, categoriasOcupacoes, cargosIds,
    } = query
    let ocupacoesIds = undefined

    if (!initialYear || !finalYear) {
        throw new Error("ERRO: initialYear e finalYear são obrigatórios.")
    }

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
        dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds,
    }
}

module.exports = {
    validateParams,
}
