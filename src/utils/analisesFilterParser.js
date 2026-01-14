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
            {
                label: "Turno",
                values: [
                    { id: "all", label: "Todos" },
                    { id: 1, label: "1º Turno" },
                    { id: 2, label: "2º Turno" },
                ],
                parameter: "round",
                required: false,
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
            {
                label: "Faixa Etária",
                values: filters.age_buckets.map((age_bucket) => {
                    return {
                        label: age_bucket.label,
                        id: age_bucket.id,
                    }
                }),
                parameter: "age_bucket_id",
                required: false,
                type: "multi_select",
                max: 2,
            },
            {
                label: "Ideologia Centrão",
                values: [
                    { id: 1, label: "Sim" },
                    { id: 0, label: "Não" },
                ],
                parameter: "centrao",
                required: false,
                type: "multi_select",
                max: 2,
            },

            ],

        },
    }

    // Adicionar filtros de ideologia dinamicamente se houver valores
    if (filters.ideologia_simplificada && filters.ideologia_simplificada.length > 0) {
        new_filters.cross_criterias.possibilities.push({
            label: "Ideologia Simplificada",
            values: filters.ideologia_simplificada.map((ideologia, index) => ({
                id: ideologia,
                label: ideologia,
            })),
            parameter: "class_categ_1",
            required: false,
            type: "multi_select",
            max: 2,
        })
    }

    if (filters.ideologia_coppedge && filters.ideologia_coppedge.length > 0) {
        new_filters.cross_criterias.possibilities.push({
            label: "Ideologia Coppedge",
            values: filters.ideologia_coppedge.map((ideologia, index) => ({
                id: ideologia,
                label: ideologia,
            })),
            parameter: "class_categ_4",
            required: false,
            type: "multi_select",
            max: 2,
        })
    }

    if (filters.ideologia_survey && filters.ideologia_survey.length > 0) {
        new_filters.cross_criterias.possibilities.push({
            label: "Ideologia Survey",
            values: filters.ideologia_survey.map((ideologia, index) => ({
                id: ideologia,
                label: ideologia,
            })),
            parameter: "class_survey_esp",
            required: false,
            type: "multi_select",
            max: 2,
        })
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
