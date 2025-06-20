const cargoService = require("../services/CargoService")
const generoSvc = require("../services/GeneroService")
const categoriaSvc = require("../services/CategoriaSvc")
const partidoSvc = require("../services/PartidoSvc")
const unidadeEleitoralSvc = require("../services/UnidateEleitoralService")
const EleicaoSvc = require("../services/EleicaoSvc")
const { filterElectionYearByOrigin } = require("./validators")

const cargosGlossary = {
    "deputado_estadual": {
        name: "DEPUTADO ESTADUAL",
        id: 1,
        agregacao_regional: ["UF"],
        filter_by: "UF",
        abrangencia: 1,
    },
    "deputado_federal": {
        name: "DEPUTADO FEDERAL",
        id: 2,
        agregacao_regional: ["UF", "BR"],
        filter_by: "UF",
        abrangencia: 1,
    },
    "senador": {
        name: "SENADOR",
        id: 4,
        agregacao_regional: ["BR"],
        filter_by: null,
        abrangencia: 1,
    },
    "governador": {
        name: "GOVERNADOR",
        id: 8,
        agregacao_regional: ["UF"],
        filter_by: null,
        abrangencia: 1,
    },
    "presidente": {
        name: "PRESIDENTE",
        id: 9,
        agregacao_regional: ["BR"],
        filter_by: null,
        abrangencia: 1,
    },
    "vereador": {
        name: "VEREADOR",
        id: 11,
        agregacao_regional: ["MUNICIPIO"],
        filter_by: "MUNICIPIO",
        abrangencia: 2,
    },
    "prefeito": {
        name: "PREFEITO",
        id: 12,
        agregacao_regional: ["UF", "BR"],
        filter_by: "MUNICIPIO",
        abrangencia: 2,
    },
}

const indicatorsPossibilities = {
    "1": {
        "id": "1",
        "nome": "Número Efetivo de Partidos (Legislativo)",
        "grupo": "eleitoral",
        "cargos": [{
            ...cargosGlossary.vereador,
            required_steps: ["UF", "city"],
        }, {
            ...cargosGlossary.deputado_estadual,
            required_steps: ["UF"],
        }, {
            ...cargosGlossary.deputado_federal,
            required_steps: ["UF"],
        }, {
            ...cargosGlossary.senador,
            required_steps: [],
        }],
    },
    "2": {
        "id": "2",
        "nome": "Índice de Volatilidade Eleitoral (Pedersen)",
        "grupo": "eleitoral",
        "cargos": [{
            ...cargosGlossary.vereador,
            required_steps: ["UF", "city"],
        },
        {
            ...cargosGlossary.deputado_estadual,
            required_steps: ["UF"],
        },
        {
            ...cargosGlossary.deputado_federal,
            required_steps: ["UF"],
        },
        {
            ...cargosGlossary.senador,
            required_steps: [],
        },
        {
            ...cargosGlossary.prefeito,
            required_steps: ["UF"],
        },
        {
            ...cargosGlossary.governador,
            required_steps: ["UF"],
        },
        {
            ...cargosGlossary.presidente,
            required_steps: [],
        },
        ],

    },
    "3": {
        "id": "3",
        "nome": "Quociente Eleitoral",
        "grupo": "eleitoral",
        "cargos": [{
            ...cargosGlossary.vereador,
            required_steps: ["UF", "city"],
        }, {
            ...cargosGlossary.deputado_estadual,
            required_steps: ["UF"],
        }, {
            ...cargosGlossary.deputado_federal,
            required_steps: ["UF"],

        }],
    },
    "4": {
        "id": "4",
        "nome": "Quociente Partidário",
        "grupo": "eleitoral",
        "cargos": [{
            ...cargosGlossary.vereador,
            required_steps: ["UF", "city"],
        }, {
            ...cargosGlossary.deputado_estadual,
            required_steps: ["UF"],
        }, {
            ...cargosGlossary.deputado_federal,
            required_steps: ["UF"],
        }],
    },
    "5": {
        "id": "5",
        "nome": "Taxa de Renovação Líquida",
        "grupo": "partidário",
        "cargos": [
            { ...cargosGlossary.vereador, required_steps: ["UF", "city"] },
            { ...cargosGlossary.deputado_estadual, required_steps: ["UF"] },
            { ...cargosGlossary.deputado_federal, required_steps: ["UF"] },
            { ...cargosGlossary.senador },
            { ...cargosGlossary.prefeito, required_steps: ["UF", "city"] },
            { ...cargosGlossary.governador, required_steps: ["UF"] },
        ],
    },
    "6": {
        "id": "6",
        "nome": "Taxa de Reeleição",
        "grupo": "partidário",
        "cargos": [
            { ...cargosGlossary.vereador, required_steps: ["UF", "city"] },
            { ...cargosGlossary.prefeito, required_steps: ["UF", "city"] },
            { ...cargosGlossary.deputado_estadual, required_steps: ["UF"] },
            { ...cargosGlossary.deputado_federal, required_steps: ["UF"] },
            { ...cargosGlossary.governador, required_steps: ["UF"] },
            { ...cargosGlossary.senador },
        ],
    },
    // "7": {
    //     "id": "7",
    //     "nome": "Taxa de Migração Partidária",
    //     "grupo": "partidário",
    //     "cargos": [
    //         { ...cargosGlossary.vereador, required_steps: ["UF", "city"] },
    //         { ...cargosGlossary.deputado_estadual, required_steps: ["UF"] },
    //         { ...cargosGlossary.deputado_federal, required_steps: ["UF"] },
    //         { ...cargosGlossary.senador, required_steps: [] },
    //         { ...cargosGlossary.prefeito, required_steps: ["UF", "city"] },
    //         { ...cargosGlossary.governador, required_steps: ["UF"] },
    //         { ...cargosGlossary.presidente, required_steps: [] },
    //     ],
    // },
    "8": {
        "id": "8",
        "nome": "Índice de Eficiência Eleitoral de Gênero",
        "grupo": "partidário",
        "cargos": [
            { ...cargosGlossary.vereador, required_steps: ["UF", "city"] },
            { ...cargosGlossary.deputado_estadual, required_steps: ["UF"] },
            { ...cargosGlossary.deputado_federal, required_steps: ["UF"] },
            { ...cargosGlossary.senador, required_steps: [] },
        ],
    },
    // "9": {
    //     "id": "9",
    //     "nome": "Distribuição de Votos por Região",
    //     "grupo": "geográfico",
    //     "cargos": [
    //         { ...cargosGlossary.deputado_estadual, required_steps: ["UF", "city"] },
    //         { ...cargosGlossary.deputado_federal, required_steps: ["UF", "city"] },
    //         { ...cargosGlossary.senador, required_steps: ["UF", "city"] },
    //         { ...cargosGlossary.governador, required_steps: ["UF", "city"] },
    //         { ...cargosGlossary.presidente, required_steps: ["UF"], optional_steps: ["city"] },
    //     ],
    // },
    "10": {
        "id": "10",
        "nome": "Índice de Concentração Regional do Voto",
        "grupo": "geográfico",
        "cargos": [
            { ...cargosGlossary.deputado_estadual, required_steps: ["UF", "city", "party"] },
            { ...cargosGlossary.deputado_federal, required_steps: ["UF", "city", "party"] },
            { ...cargosGlossary.senador, required_steps: ["UF", "city", "party"] },
            { ...cargosGlossary.governador, required_steps: ["UF", "city", "party"] },
            { ...cargosGlossary.presidente, required_steps: ["UF", "party"], optional_steps: ["city"] },
        ],
    },
    "11": {
        "id": "11",
        "nome": "Índice de Dispersão do Voto",
        "grupo": "geográfico",
        "cargos": [
            { ...cargosGlossary.vereador, required_steps: ["UF", "city"] },
            { ...cargosGlossary.deputado_estadual, required_steps: ["UF"] },
            { ...cargosGlossary.deputado_federal, required_steps: ["UF"] },
            { ...cargosGlossary.senador, required_steps: ["UF"] },
            { ...cargosGlossary.prefeito, required_steps: ["UF", "city"] },
            { ...cargosGlossary.governador, required_steps: ["UF"] },
            { ...cargosGlossary.presidente, required_steps: ["UF"] },
        ],
    },
    "12": {
        "id": "12",
        "nome": "Índice de Eficiência do Voto",
        "grupo": "geográfico",
        "cargos": [
            { ...cargosGlossary.vereador, required_steps: ["UF", "city"] },
            { ...cargosGlossary.deputado_estadual, required_steps: ["UF"] },
            { ...cargosGlossary.deputado_federal, required_steps: ["UF"] },
            // { ...cargosGlossary.senador, required_steps: ["UF"] },
            // { ...cargosGlossary.prefeito, required_steps: ["UF", "city"] },
            // { ...cargosGlossary.governador, required_steps: ["UF"] },
            // { ...cargosGlossary.presidente, required_steps: ["UF"] },
        ],
    },
    "13": {
        "id": "13",
        "nome": "Taxa de Custo por Voto",
        "grupo": "financeiro",
        "cargos": [
            { ...cargosGlossary.vereador, required_steps: ["UF", "city"] },
            { ...cargosGlossary.deputado_estadual, required_steps: ["UF"] },
            { ...cargosGlossary.deputado_federal, required_steps: ["UF"] },
            { ...cargosGlossary.senador, required_steps: ["UF"] },
            { ...cargosGlossary.prefeito, required_steps: ["UF", "city"] },
            { ...cargosGlossary.governador, required_steps: ["UF"] },
            { ...cargosGlossary.presidente, required_steps: ["UF"] },
        ],
    },
    "14": {
        "id": "14",
        "nome": "Índice de Igualdade de Acesso a Recursos",
        "grupo": "financeiro",
        "cargos": [
            { ...cargosGlossary.vereador, required_steps: ["UF", "city"] },
            { ...cargosGlossary.deputado_estadual, required_steps: ["UF"] },
            { ...cargosGlossary.deputado_federal, required_steps: ["UF"] },
            { ...cargosGlossary.senador, required_steps: ["UF"] },
            { ...cargosGlossary.prefeito, required_steps: ["UF", "city"] },
            { ...cargosGlossary.governador, required_steps: ["UF"] },
            { ...cargosGlossary.presidente, required_steps: ["UF"] },
        ],
    },
    "15": {
        "id": "15",
        "nome": "Índice de Diversidade Econômica entre Candidatos",
        "grupo": "financeiro",
        "cargos": [
            { ...cargosGlossary.vereador, required_steps: ["UF", "city"] },
            { ...cargosGlossary.deputado_estadual, required_steps: ["UF"] },
            { ...cargosGlossary.deputado_federal, required_steps: ["UF"] },
            { ...cargosGlossary.senador, required_steps: ["UF"] },
            { ...cargosGlossary.prefeito, required_steps: ["UF", "city"] },
            { ...cargosGlossary.governador, required_steps: ["UF"] },
            { ...cargosGlossary.presidente, required_steps: ["UF"] },
        ],
    },
    "16": {
        "id": "16",
        "nome": "Média e Mediana de Patrimônio da Classe Política",
        "grupo": "financeiro",
        "cargos": [
            { ...cargosGlossary.vereador, required_steps: ["UF", "city"] },
            { ...cargosGlossary.deputado_estadual, required_steps: ["UF"] },
            { ...cargosGlossary.deputado_federal, required_steps: ["UF"] },
            { ...cargosGlossary.senador, required_steps: ["UF"] },
            { ...cargosGlossary.prefeito, required_steps: ["UF", "city"] },
            { ...cargosGlossary.governador, required_steps: ["UF"] },
            { ...cargosGlossary.presidente, required_steps: ["UF"] },
        ],
    },
}

const getIndicatorByID = (id) => {
    const indicator = indicatorsPossibilities[id]
    if (!indicator) return false
    return indicator
}

const getCargoFilterByID = (id) => {
    const cargos = Object.values(cargosGlossary)
    return cargos.find((cargo) => cargo.id === id)
}

const verifyIfCargoIsAllowedForIndicator = (indicatorID, cargoID) => {
    const indicator = indicatorsPossibilities[indicatorID]
    if (!indicator) return false
    return indicator.cargos.some((cargo) => cargo.id === cargoID)
}

const indicatorsGroupsGlossary = {
    "eleitorais": {
        "nome": "Eleitoral",
        indicators: [
            indicatorsPossibilities["1"], indicatorsPossibilities["2"], indicatorsPossibilities["3"], indicatorsPossibilities["4"],
        ],
    },
    "partidarios": {
        "nome": "Partidário",
        indicators: [
            indicatorsPossibilities["5"], indicatorsPossibilities["6"], indicatorsPossibilities["7"], indicatorsPossibilities["8"],
        ],
    },
    "geograficos": {
        "nome": "Geográfico",
        indicators: [
            indicatorsPossibilities["9"], indicatorsPossibilities["10"], indicatorsPossibilities["11"], indicatorsPossibilities["12"],
        ],
    },
    "financeiros": {
        "nome": "Financeiro",
        indicators: [
            indicatorsPossibilities["13"], indicatorsPossibilities["14"], indicatorsPossibilities["15"], indicatorsPossibilities["16"],
        ],
    },
}

const possibilitiesByOrigin = {
    "candidates": {
        type: "select",
        values: [
            { id: 0, label: "Quantidade" },
            { id: 1, label: "Votos" },
            { id: 2, label: "Bens Declarados" },
        ],
    },
    "elections": {
        type: "select",
        values: [
            { id: 0, label: "Quantidade de candidatos" },
            { id: 1, label: "Quantidade de votos" },
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

const verifyIfIndicatorIsInGroup = (indicatorID, groupName) => {
    const group = indicatorsGroupsGlossary[groupName]
    return group.indicators.some((indicator) => indicator.id === indicatorID)
}

const getFiltersForSearchesByOrigin = async (origin, abrangenciaId) => {
    const [cargos, generos, estados, categorias, partidos, anos] = await Promise.all(
        [
            cargoService.getAllCargos(),
            generoSvc.getAllGenders(),
            unidadeEleitoralSvc.getFederativeUnitsByAbrangency(1),
            categoriaSvc.getAllCategorias(),
            partidoSvc.getAllPartidos(),
            !abrangenciaId ? EleicaoSvc.getAllElectionsYears(): EleicaoSvc.getAllElectionsYearsByAbragencyForFilters(abrangenciaId),

        ],
    )
    const years = anos
        .filter((i) => filterElectionYearByOrigin(origin, i.ano_eleicao))
        .map((i) => i.ano_eleicao)

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
            values: years,
        },
        turnos: {
            type: "select",
            values: [
                { id: 0, label: "Ambos" },
                { id: 1, label: "1º Turno" },
                { id: 2, label: "2º Turno" },
            ],
        },
        racas: {
            type: "select",
            values: [
                { id: 0, label: "Todas" },
                { id: 1, label: "Não Divulgável ou não informada" },
                { id: 2, label: "Parda" },
                { id: 3, label: "Branca" },
                { id: 4, label: "Amarela" },
                { id: 5, label: "Preta" },
                { id: 6, label: "Indígena" },
            ],
        },
    }

    return data
}

module.exports = {
    possibilitiesByOrigin,
    indicatorsGroupsGlossary,
    getFiltersForSearchesByOrigin,
    verifyIfIndicatorIsInGroup,
    getIndicatorByID,
    getCargoFilterByID,
    verifyIfCargoIsAllowedForIndicator,
}
