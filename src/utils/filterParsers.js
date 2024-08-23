const cargoService = require("../services/CargoService")
const generoSvc = require("../services/GeneroService")
const categoriaSvc = require("../services/CategoriaSvc")
const partidoSvc = require("../services/PartidoSvc")
const unidadeEleitoralSvc = require("../services/UnidateEleitoralService")
const EleicaoSvc = require("../services/EleicaoSvc")

const possibilitiesByOrigin = {
    "candidates": {
        type: "select",
        values: [
            { id: 0, label: "Quantidade" },
            { id: 1, label: "Votos" },
            { id: 2, label: "Bens Declarados" },
        ],
    },
    "donations": {
        type: "select",
        values: [
            { id: 0, label: "Volume total de financiamento" },
            { id: 1, label: "Quantidade doações" },
            { id: 2, label: "Volume fundo eleitoral" },
            { id: 3, label: "Volume fundo partidário" },
            { id: 4, label: "Volume financiamento privado" },
        ],
    },
}

const getFiltersForSearchesByOrigin = async (origin) => {
    const [cargos, generos, estados, categorias, partidos, anos] = await Promise.all(
        [
            cargoService.getAllCargos(),
            generoSvc.getAllGenders(),
            unidadeEleitoralSvc.getFederativeUnitsByAbrangency(1),
            categoriaSvc.getAllCategorias(),
            partidoSvc.getAllPartidos(),
            EleicaoSvc.getAllElectionsYears(),

        ],
    )
    const data = {
        cargo: {
            values: cargos,
            type: "multiselect",
        },
        foiEleito: {
            type: "select",
            values: [
                { id: 0, label: "Ambos" },
                { id: 1, label: "Sim" },
                { id: 2, label: "Não" },
            ],
        },
        genero: {
            type: "multiselect",
            values: generos,
        },
        estado: {
            type: "select",
            values: estados,
        },
        "categorias": {
            type: "multiselect",
            values: categorias,
        },
        "partidos": {
            type: "multiselect",
            values: partidos,
        },
        possibilities: possibilitiesByOrigin[origin],
        "anos": {
            type: "select",
            values: anos.map((i) => i.ano_eleicao),

        },
    }

    return data
}

module.exports = {
    getFiltersForSearchesByOrigin,
}
