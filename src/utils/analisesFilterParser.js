const parseFiltersToAnalytics = (filters) => {
    const new_filters = {
        filters: [
            {
                label: "Estados",
                values: filters.estados.map((estado) => {
                    if (estado.sigla_unidade_federacao != "BR"){
                        return estado.sigla_unidade_federacao }
                }).filter((result) => result != undefined),
                could_chose_city: false,
                type: "select",
                required: false,
                parameter: "uf",
            },
            {
                label: "Ano Inicial da Eleição",
                values: filters.anos.map((ano) => {
                    return ano.ano_eleicao
                }),
                parameter: "initial_year",
                required: true,
                type: "select",
            },
            {
                label: "Ano Final da Eleição",
                values: filters.anos.map((ano) => {
                    return ano.ano_eleicao
                }),
                parameter: "final_year",
                required: true,
                type: "select",
            },
        ],
        cross_criterias: {
            max: 3,
            required: false,
            possibilities: [{
                label: "Gênero",
                values: [
                    { id: 1, label: "Masculino" },
                    { id: 2, label: "Feminino" },
                    { id: 3, label: "Não Divulgável ou não informada" },
                ],
                parameter: "genero_id",
                required: false,
                type: "multi_select",
                max: 2,
            },
            {
                label: "Raça",
                values: [
                    { id: 1, label: "Não Divulgável ou não informada" },
                    { id: 2, label: "Parda" },
                    { id: 3, label: "Branca" },
                    { id: 4, label: "Amarela" },
                    { id: 5, label: "Preta" },
                    { id: 6, label: "Indígena" },
                ],
                parameter: "raca_id",
                required: false,
                type: "multi_select",
                max: 2,
            },
            {
                label: "Ocupação",
                values: filters.ocupacoes_categorizadas.map((ocupacao) => {
                    return {
                        label: ocupacao.nome,
                        id: ocupacao.id,
                    }
                }),
                parameter: "ocupacao_categorizada_id",
                required: false,
                type: "multi_select",
                max: 2,
            },
            {
                label: "Grau de instrução",
                values: filters.intrucao.map((intrucao) => {
                    return {
                        label: intrucao.nome_agrupado,
                        id: intrucao.id_agrupado,
                    }
                }),
                required: false,
                parameter: "grau_instrucao",
                type: "multi_select",
                max: 2,
            },
            {
                label: "Partido",
                values: filters.partidos.map((partido) => {
                    return {
                        label: partido.nome_atual,
                        id: partido.id_agrupado,
                    }
                }),
                parameter: "id_agrupado_partido",
                required: false,
                type: "multi_select",
                max: 2,
            },

            ],

        },
    }

    if (filters.abrangencia == 1 && parseInt(filters.cargo) == 9){
        new_filters.filters[0].values = ["BR"]
    }
    else if (filters.abrangencia == 2){
        new_filters.filters[0].could_chose_city = true
    }

    return new_filters
}

module.exports = {
    parseFiltersToAnalytics,
}
