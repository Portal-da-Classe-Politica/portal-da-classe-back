const cargoService = require("../services/CargoService")
const generoSvc = require("../services/GeneroService")
const categoriaSvc = require("../services/CategoriaSvc")
const partidoSvc = require("../services/PartidoSvc")
const unidadeEleitoralSvc = require("../services/UnidateEleitoralService")
const EleicaoSvc = require("../services/EleicaoSvc")

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
        "cargos": [cargosGlossary.vereador, cargosGlossary.deputado_estadual, cargosGlossary.deputado_federal, cargosGlossary.senador],
        // vereador, deputado estadual, deputado federal, senador
    },
    "2": {
        "id": "2",
        "nome": "Índice de Volatilidade Eleitoral (Pedersen)",
        "grupo": "eleitoral",
        "cargos": [cargosGlossary.vereador, cargosGlossary.deputado_estadual, cargosGlossary.deputado_federal, cargosGlossary.senador, cargosGlossary.prefeito, cargosGlossary.governador, cargosGlossary.presidente],
        // vereador	deputado estadual	deputado federal	senador	prefeito	governador	presidente

    },
    "3": {
        "id": "3",
        "nome": "Quociente Eleitoral",
        "grupo": "eleitoral",
        "cargos": [cargosGlossary.vereador, cargosGlossary.deputado_estadual, cargosGlossary.deputado_federal],
        // vereador	deputado estadual	deputado federal
    },
    "4": {
        "id": "4",
        "nome": "Quociente Partidário",
        "grupo": "eleitoral",
        "cargos": [cargosGlossary.vereador, cargosGlossary.deputado_estadual, cargosGlossary.deputado_federal],
        // vereador	deputado estadual	deputado federal
    },
    "5": {
        "id": "5",
        "nome": "Taxa de Renovação Líquida",
        "grupo": "partidário",
        "cargos": [cargosGlossary.vereador, cargosGlossary.deputado_estadual, cargosGlossary.deputado_federal,
        cargosGlossary.senador, cargosGlossary.prefeito, cargosGlossary.governador],
        // vereador	deputado estadual	deputado federal	senador	prefeito	governador
    },
    "6": {
        "id": "6",
        "nome": "Taxa de Reeleição",
        "grupo": "partidário",
        "cargos": [cargosGlossary.vereador, cargosGlossary.deputado_estadual, cargosGlossary.deputado_federal,
        cargosGlossary.senador, cargosGlossary.prefeito, cargosGlossary.governador],
    },
    "7": {
        "id": "7",
        "nome": "Taxa de Migração Partidária",
        "grupo": "partidário",
        "cargos": [
            cargosGlossary.vereador, cargosGlossary.deputado_estadual, cargosGlossary.deputado_federal,
            cargosGlossary.senador, cargosGlossary.prefeito, cargosGlossary.governador, cargosGlossary.presidente,
        ],
        // vereador	deputado estadual	deputado federal	senador	prefeito	governador	presidente
    },
    "8": {
        "id": "8",
        "nome": "Índice de Paridade Eleitoral de Gênero",
        "grupo": "partidário",
        "cargos": [cargosGlossary.vereador, cargosGlossary.deputado_estadual, cargosGlossary.deputado_federal, cargosGlossary.senador],
        // vereador	deputado estadual	deputado federal	senador
    },
    "9": {
        "id": "9",
        "nome": "Distribuição de Votos por Região",
        "grupo": "geográfico",
        "cargos":
            [
                cargosGlossary.vereador, cargosGlossary.deputado_estadual, cargosGlossary.deputado_federal,
                cargosGlossary.senador, cargosGlossary.prefeito, cargosGlossary.governador, cargosGlossary.presidente,
            ],
        // vereador	deputado estadual	deputado federal	senador	prefeito	governador	presidente
    },
    "10": {
        "id": "10",
        "nome": "Índice de Concentração Regional do Voto",
        "grupo": "geográfico",
        "cargos":
            [
                cargosGlossary.vereador, cargosGlossary.deputado_estadual, cargosGlossary.deputado_federal,
                cargosGlossary.senador, cargosGlossary.prefeito, cargosGlossary.governador, cargosGlossary.presidente,
            ],
        // vereador	deputado estadual	deputado federal	senador	prefeito	governador	presidente
    },
    "11": {
        "id": "11",
        "nome": "Índice de Dispersão do Voto",
        "grupo": "geográfico",
        "cargos":
            [
                cargosGlossary.vereador, cargosGlossary.deputado_estadual, cargosGlossary.deputado_federal,
                cargosGlossary.senador, cargosGlossary.prefeito, cargosGlossary.governador, cargosGlossary.presidente,
            ],
        // vereador	deputado estadual	deputado federal	senador	prefeito	governador	presidente
    },
    "12": {
        "id": "12",
        "nome": "Índice de Eficiência do Voto",
        "grupo": "geográfico",
        "cargos":
            [
                cargosGlossary.vereador, cargosGlossary.deputado_estadual, cargosGlossary.deputado_federal,
                cargosGlossary.senador, cargosGlossary.prefeito, cargosGlossary.governador, cargosGlossary.presidente,
            ],
        // vereador	deputado estadual	deputado federal	senador	prefeito	governador	presidente
    },
    "13": {
        "id": "13",
        "nome": "Taxa de Custo por Voto",
        "grupo": "financeiro",
        "cargos":
            [
                cargosGlossary.vereador, cargosGlossary.deputado_estadual, cargosGlossary.deputado_federal,
                cargosGlossary.senador, cargosGlossary.prefeito, cargosGlossary.governador, cargosGlossary.presidente,
            ],
        // vereador	deputado estadual	deputado federal	senador	prefeito	governador	presidente
    },
    "14": {
        "id": "14",
        "nome": "Índice de Igualdade de Acesso a Recursos",
        "grupo": "financeiro",
        "cargos":
            [
                cargosGlossary.vereador, cargosGlossary.deputado_estadual, cargosGlossary.deputado_federal,
                cargosGlossary.senador, cargosGlossary.prefeito, cargosGlossary.governador, cargosGlossary.presidente,
            ],
        // vereador	deputado estadual	deputado federal	senador	prefeito	governador	presidente
    },
    "15": {
        "id": "15",
        "nome": "Índice de Diversidade Econômica entre Candidatos",
        "grupo": "financeiro",
        "cargos":
            [
                cargosGlossary.vereador, cargosGlossary.deputado_estadual, cargosGlossary.deputado_federal,
                cargosGlossary.senador, cargosGlossary.prefeito, cargosGlossary.governador, cargosGlossary.presidente,
            ],
        // vereador	deputado estadual	deputado federal	senador	prefeito	governador	presidente
    },
    "16": {
        "id": "16",
        "nome": "Média e Mediana de Patrimônio da Classe Política",
        "grupo": "financeiro",
        "cargos":
            [
                cargosGlossary.vereador, cargosGlossary.deputado_estadual, cargosGlossary.deputado_federal,
                cargosGlossary.senador, cargosGlossary.prefeito, cargosGlossary.governador, cargosGlossary.presidente,
            ],
        // vereador	deputado estadual	deputado federal	senador	prefeito	governador	presidente
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
    indicatorsGroupsGlossary,
    getFiltersForSearchesByOrigin,
    verifyIfIndicatorIsInGroup,
    getIndicatorByID,
    getCargoFilterByID,
    verifyIfCargoIsAllowedForIndicator,
}
