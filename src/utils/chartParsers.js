const ipcaUtil = require("./ipca")

const indicatorsDetails = {
    1: {
        title: "Número Efetivo de Partidos",
        indicator_purpose: "Calcula a dispersão e concentração do sistema partidário com base na distribuição das cadeiras no Legislativo. É um indicador importante para avaliar a saúde da democracia, pois um sistema partidário muito fragmentado pode dificultar a governabilidade e a formação de consensos. Permite comparações entre diferentes legislaturas.",
        how_to_interpretate: "O gráfico mostra a evolução do Número Efetivo de Partidos (NEPP) ao longo dos anos. Eixo X (horizontal): Representa os anos das eleições legislativas.\nEixo Y (vertical): Indica o NEPP, ou seja, quantos partidos, na prática, têm influência no Legislativo.",
        unit: "Número efetivo de partidos",
        party_indicator: false,
        "indicator_t1": false,
        xAxisLabel: "Ano",
        yAxisLabel: "NEPP",
    },
    2: {
        title: "Índice de Volatilidade Eleitoral",
        indicator_purpose: "Mede a instabilidade do sistema eleitoral, indicando o grau de fidelidade dos eleitores aos partidos. O índice reflete as mudanças na proporção de votos de cada partido entre eleições, considerando tanto ganhos quanto perdas.",
        how_to_interpretate: "Valores mais altos indicam maior instabilidade no apoio aos partidos; valores mais baixos sugerem fidelidade eleitoral. Eixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Índice de volatilidade eleitoral.",
        unit: "Volatilidade eleitoral",
        party_indicator: false,
        "indicator_t1": true,
        xAxisLabel: "Ano",
        yAxisLabel: "Índice de Volatilidade Eleitoral",
    },
    3: {
        title: "Quociente Eleitoral",
        indicator_purpose: "Representa o número de vagas conquistadas por um partido ou coligação sem considerar as cadeiras distribuídas por média. Esse indicador permite avaliar o desempenho eleitoral dos partidos e comparar sua eficiência ao longo do tempo.",
        how_to_interpretate: "A variação do quociente eleitoral ao longo do tempo pode indicar mudanças na representatividade e no peso do voto.\n\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Quociente eleitoral.",
        unit: "Votos",
        party_indicator: false,
        "indicator_t1": false,
        xAxisLabel: "Ano",
        yAxisLabel: "Quociente Eleitoral",
    },
    4: {
        title: "Quociente Partidário",
        indicator_purpose: "Representa o número de vagas conquistadas por um partido ou coligação sem considerar as cadeiras distribuídas por média. Esse indicador permite avaliar o desempenho eleitoral dos partidos e comparar sua eficiência ao longo do tempo.",
        how_to_interpretate: "A evolução do quociente partidário revela quais partidos conquistam mais vagas diretamente e quais dependem da distribuição por média.\n\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Quociente partidário.",
        unit: "Quociente partidário",
        party_indicator: true,
        "indicator_t1": false,
        xAxisLabel: "Ano",
        yAxisLabel: "Quociente Partidário",
    },
    5: {
        title: "Taxa de Renovação Líquida",
        indicator_purpose: "Mede a renovação do corpo legislativo ao longo do tempo. O índice considera todos os candidatos que tentaram a reeleição, destacando tanto os que foram reeleitos quanto os que não obtiveram sucesso.",
        how_to_interpretate: "Valores mais altos indicam maior renovação no Legislativo, enquanto valores mais baixos sugerem continuidade dos mesmos parlamentares.\n\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (horizontal): Taxa de renovação líquida (%).",
        unit: "Porcentagem",
        party_indicator: false,
        "indicator_t1": false,
        xAxisLabel: "Ano",
        yAxisLabel: "Taxa de Renovação Líquida(%)",
    },
    6: {
        title: "Taxa de Reeleição",
        indicator_purpose: "Mede a proporção de parlamentares que conseguem se reeleger para o mandato seguinte. Esse indicador é útil para analisar a profissionalização da política e os efeitos de reformas eleitorais.",
        how_to_interpretate: "Taxas mais altas indicam maior permanência de políticos no cargo, enquanto taxas mais baixas sugerem maior renovação legislativa.\n\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Taxa de reeleição (%).",
        unit: "Porcentagem",
        party_indicator: false,
        "indicator_t1": false,
        xAxisLabel: "Ano",
        yAxisLabel: "Taxa de Reeleição(%)",
    },
    7: {
        title: "Taxa de Migração Partidária",
        indicator_purpose: "Mede a média com que políticos mudam de partido ao longo de suas carreiras. Esse indicador reflete a fidelidade partidária e ajuda a entender o impacto de reformas eleitorais na estabilidade dos partidos e carreiras parlamentares.",
        how_to_interpretate: "Valores mais altos indicam maior troca de partidos entre os políticos, enquanto valores mais baixos sugerem maior fidelidade partidária.\n\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Taxa de migração partidária (média de mudanças por político).",
        unit: "Média de migrações partidárias",
        party_indicator: false,
        "indicator_t1": true,
        xAxisLabel: "Ano",
        yAxisLabel: "Taxa de Migração Partidária",
    },
    8: {
        title: "Índice de Paridade Eleitoral de Gênero",
        indicator_purpose: "Mede a desigualdade de gênero na política ao comparar a proporção de candidatas e eleitas em cada eleição. Esse indicador permite avaliar o avanço da representatividade feminina e comparar diferentes cargos, regiões e esferas de governo.",
        how_to_interpretate: "Valores mais próximos de 1 indicam maior equilíbrio entre mulheres eleitas e candidatas, enquanto valores mais baixos mostram maior desigualdade de gênero.\n\nEixo Y: Índice de Paridade Eleitoral de Gênero (IPEG).\nBarras: Cada barra representa uma eleição.",
        unit: "IPEG",
        party_indicator: false,
        "indicator_t1": false,
        xAxisLabel: "Ano",
        yAxisLabel: "IPEG",
    },
    9: {
        title: "Distribuição de Votos por Região",
        indicator_purpose: "Mede as diferenças regionais nas preferências políticas e eleitorais com base na concentração de votos em cada região. Esse indicador ajuda a entender desigualdades regionais e a influência de fatores locais nas eleições.",
        how_to_interpretate: "Valores mais altos indicam maior concentração de votos em uma região específica. Valores mais baixos sugerem uma distribuição mais equilibrada dos votos entre regiões. A evolução ao longo do tempo pode mostrar mudanças nas bases eleitorais dos partidos e candidatos.\n\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Índice de Concentração Regional do Voto (%).\nLinhas: Cada linha representa uma região.",
        unit: "Porcentagem",
        party_indicator: false,
        "indicator_t1": false,
        xAxisLabel: "Ano",
        yAxisLabel: "Distribuição de Votos por Região (%)",
    },
    10: {
        title: "Índice de Concentração Regional do Voto",
        indicator_purpose: "Mede a concentração de votos em determinadas regiões, identificando áreas com maior hegemonia de um partido ou candidato. Esse indicador permite comparações regionais e ao longo do tempo.",
        how_to_interpretate: "Valores mais altos indicam maior concentração de votos em poucos partidos ou candidatos. Valores mais baixos sugerem uma distribuição mais equilibrada dos votos entre diferentes opções políticas. A evolução do índice pode revelar tendências de fortalecimento ou enfraquecimento de partidos em regiões específicas.\n\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Índice de Concentração Regional do Voto (HHI).\nLinhas: Cada linha representa uma região (Estado, Município).",
        unit: "Índice de Herfindahl-Hirschman (HHI)",
        party_indicator: false,
        "indicator_t1": false,
        xAxisLabel: "Ano",
        yAxisLabel: "Índice de Concentração Regional do Voto",
    },
    11: {
        title: "Índice de Dispersão do Voto",
        indicator_purpose: "Mede como os votos de partidos ou candidatos estão distribuídos geograficamente dentro de uma área eleitoral. Esse indicador ajuda a identificar concentrações ou dispersões de votos, revelando possíveis desigualdades regionais e padrões eleitorais.",
        how_to_interpretate: "\nPode ajudar a identificar efeitos de fatores como gerrymandering e clientelismo na distribuição eleitoral. Valores mais altos indicam uma distribuição mais equilibrada dos votos entre diferentes regiões. Valores mais baixos sugerem que os votos estão concentrados em áreas específicas.\n\n\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Índice de Dispersão Regional do Voto.\nLinhas: Cada linha representa uma região.",
        unit: "Coeficiente de variação",
        party_indicator: false,
        "indicator_t1": false,
        xAxisLabel: "Ano",
        yAxisLabel: "Índice de Dispersão do Voto",
    },
    12: {
        title: "Índice de Eficiência do Voto",
        indicator_purpose: "Avalia a capacidade dos partidos de converter votos em cadeiras no Legislativo. Esse indicador permite identificar quais partidos são mais eficientes na mobilização do eleitorado e como fatores como fragmentação partidária e sistema eleitoral influenciam essa conversão.",
        how_to_interpretate: "\nA evolução do índice ao longo do tempo pode revelar mudanças na estratégia eleitoral dos partidos.Valores mais altos indicam maior eficiência na conversão de votos em cadeiras.\nValores mais baixos sugerem que um partido recebe muitos votos, mas conquista poucas cadeiras.\n\n\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Índice de Eficiência do Voto (IEV).\nLinhas: Cada linha representa um partido ou coligação/federação.",
        unit: "IEV",
        party_indicator: true,
        "indicator_t1": false,
        xAxisLabel: "Ano",
        yAxisLabel: "Índice de Eficiência do Voto",
    },
    13: {
        title: "Taxa de Custo por Voto",
        indicator_purpose: "Mede a eficiência do financiamento de campanha ao calcular quanto um partido gastou, em média, para cada voto recebido. Esse indicador permite avaliar a transparência, equidade e impacto dos recursos financeiros na competitividade eleitoral.",
        how_to_interpretate: "A evolução do índice pode refletir mudanças nas regras de financiamento, estratégias de campanha ou influência do financiamento privado. Valores mais baixos indicam maior eficiência na conversão de recursos financeiros em votos. Valores mais altos sugerem que um partido ou candidato gastou mais para conquistar cada voto.\n\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Taxa de Custo por Voto.\nLinhas: Cada linha representa um candidato ou partido.",
        unit: "Custo médio do voto em real",
        party_indicator: true,
        "indicator_t1": true,
        xAxisLabel: "Ano",
        yAxisLabel: "Taxa de Custo por Voto",
    },
    14: {
        title: "Índice de Igualdade de Acesso a Recursos",
        indicator_purpose: "Mede o grau de equidade no acesso a recursos financeiros entre candidatos em um sistema eleitoral. Esse indicador ajuda a identificar desigualdades que podem impactar a competitividade eleitoral e o equilíbrio do processo democrático.",
        how_to_interpretate: "A evolução do índice pode refletir mudanças nas regras de financiamento de campanhas e na distribuição de recursos públicos e privados. Valores mais altos indicam maior equidade na distribuição de recursos entre candidatos. Valores mais baixos sugerem maior concentração de recursos em poucos candidatos.\n\nEixo X: Tempo (anos ou eleições).\nEixo Y: Índice de Igualdade de Acesso a Recursos (IEAR).",
        unit: "IEAR",
        party_indicator: false,
        "indicator_t1": false,
        xAxisLabel: "Ano",
        yAxisLabel: "Índice de Igualdade de Acesso a Recursos",
    },
    15: {
        title: "Índice de Diversidade Econômica entre Candidatos",
        indicator_purpose: "Mede a variedade no perfil econômico dos candidatos em uma eleição. Esse indicador ajuda a identificar se há predominância de candidatos de classes mais altas ou se há uma distribuição mais equilibrada de diferentes origens econômicas na política.",
        how_to_interpretate: "A evolução do índice pode refletir mudanças em políticas de inclusão e barreiras econômicas para a participação política. Valores mais altos indicam maior diversidade econômica entre os candidatos. Valores mais baixos sugerem que a maioria dos candidatos pertence a um mesmo grupo econômico.\n\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Índice de Diversidade Econômica entre Candidatos (IDEC).",
        unit: "IDEC",
        party_indicator: false,
        "indicator_t1": true,
        xAxisLabel: "Ano",
        yAxisLabel: "Índice de Diversidade Econômica entre Candidatos",
    },
    16: {
        title: "Média e Mediana de Patrimônio da Classe Política",
        indicator_purpose: "Mede a evolução do patrimônio declarado dos políticos ao longo do tempo, ajudando a identificar padrões de concentração de riqueza na classe política. Esse indicador permite comparar a situação econômica dos políticos com a da população em geral e avaliar desigualdades.",
        how_to_interpretate: "Comparações com a renda média da população ajudam a avaliar o quão representativa a classe política é economicamente. Se a média for muito maior que a mediana, significa que há poucos políticos extremamente ricos elevando a média. Se ambas crescerem significativamente, pode indicar um aumento geral da riqueza da classe política.",
        unit: "Valor em real",
        party_indicator: false,
        "indicator_t1": false,
        xAxisLabel: "Ano",
        yAxisLabel: "Valor em real",
    },
}

function parseDataToDonutChart(data, nameKey, valueKey, title) {
    if (!Array.isArray(data)) {
        throw new Error("Input data must be an array")
    }

    const seriesData = data.map((item) => ({
        name: item[nameKey],
        value: Number(item[valueKey]) || 0,
    }))

    // Sort data in descending order
    seriesData.sort((a, b) => b.value - a.value)

    // Calculate total value
    const totalValue = seriesData.reduce((sum, item) => sum + item.value, 0)

    // Extra data calculations
    const largestSegment = seriesData[0]
    const smallestSegment = seriesData[seriesData.length - 1]
    // const top3Segments = seriesData.slice(0, 3).map(item => ({
    //     name: item.name,
    //     value: item.value,
    //     percentage: ((item.value / totalValue) * 100).toFixed(1) + '%'
    // }));
    // const otherSegmentsTotal = seriesData.slice(3).reduce((sum, item) => sum + item.value, 0);
    // const averageValue = (totalValue / seriesData.length).toFixed(2);

    const largestSegmentValue = ((largestSegment.value / totalValue) * 100)?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const smallestSegmentValue = ((smallestSegment.value / totalValue) * 100)?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return {
        type: "donut",
        title: title || "",
        series: seriesData,
        extraData: [
            `Total: ${totalValue?.toLocaleString("pt-BR")}`,
            `Maior segmento: ${largestSegment.name} (${largestSegmentValue}%)`,
            `Menor segmento: ${smallestSegment.name} (${smallestSegmentValue}%)`,
        ],
    }
}

function parseDataToLineChart(
    data,
    seriesName,
    xAxisLabel,
    yAxisLabel,
    title,
    dataType = "integer",
    xAxisKey = "ano",
    yAxisKey = "total",
    indicator_detail = null,
) {
    if (!Array.isArray(data)) {
        throw new Error("Input data must be an array")
    }

    const xAxisValues = data.map((item) => item[xAxisKey])

    const seriesData = {
        name: seriesName || "Total", // Use provided name or default to 'Total'
        data: data.map((item) => {
            const anoDoacao = item[xAxisKey]
            const valorOriginal = parseFloat(item[yAxisKey])
            const valorAtualizado = ipcaUtil.atualizarValor(valorOriginal, anoDoacao)
            if (dataType === "integer") {
                return parseInt(item[yAxisKey])
            } if (dataType === "float") {
                return Number(item[yAxisKey]).toFixed(2)
            }
            return Number(valorAtualizado.toFixed(2))
        }),
    }

    return {
        type: "line",
        title: title || "", // Use provided title or default to empty string
        xAxis: xAxisValues,
        series: [seriesData],
        extraData: {
            xAxisLabel,
            yAxisLabel,
        },
        indicator_detail: indicator_detail ? indicatorsDetails[indicator_detail] : null,
    }
}

function parseDataToMultipleSeriesLineChart(
    data,
    seriesName,
    xAxisLabel,
    yAxisLabel,
    title,
    dataType = "integer",
    xAxisKey = "ano",
    yAxisKey = "total",
    seriesKey = "partido_id",
    indicator_detail = null,
) {
    if (!Array.isArray(data)) {
        throw new Error("Input data must be an array")
    }

    // Step 1: Extract unique xAxis values
    const xAxis = [...new Set(data.map((item) => item[xAxisKey]))].sort((a, b) => a - b)

    // Step 2: Group data by seriesKey
    const mapper = {}
    data.forEach((item) => {
        const sk = item[seriesKey]
        if (!mapper[sk]) {
            mapper[sk] = Array(xAxis.length).fill("0.0") // Initialize with "0.0" or 0.0
        }
        const xIndex = xAxis.indexOf(item[xAxisKey])
        const value = dataType === "integer" ? parseFloat(item[yAxisKey]) : item[yAxisKey]
        mapper[sk][xIndex] = value
    })

    // Step 3: Create series array
    const series = Object.keys(mapper).map((key) => ({
        name: `${key}`,
        data: mapper[key],
    }))

    // Step 4: Construct the final result object
    const result = {
        type: "line",
        title,
        xAxis,
        series,
        extraData: {
            xAxisLabel,
            yAxisLabel,
        },
        indicator_detail: indicator_detail ? indicatorsDetails[indicator_detail] : null,
    }
    return result
}

function parseDataToBarChart(
    data,
    title,
    seriesName,
    itemKey = "categoria_ocupacao",
    totalKey = "total",
    topX = 100,
) {
    // Parse totals to numbers and sort descending
    data.sort((a, b) => parseInt(b[totalKey]) - parseInt(a[totalKey]))

    // Calculate total votes
    const totalVotes = data.reduce((sum, item) => sum + parseInt(item[totalKey]), 0)

    // Calculate top 20%
    const top20PercentIndex = Math.ceil(data.length * 0.2) // Get the index for top 20%
    const top20PercentTotal = data.slice(0, top20PercentIndex).reduce((sum, item) => sum + parseInt(item[totalKey]), 0)

    // Calculate the percentage of total votes represented by the top 20%
    const top20PercentPercentage = (top20PercentTotal / totalVotes) * 100

    // Extract top 100 categories and combine the rest into "Outros"
    const top100 = data.slice(0, topX)
    console.log({ top100 })
    // const outrosTotal = data.slice(100).reduce((sum, item) => sum + parseInt(item.total), 0);
    const finalData = [...top100,
        // { categoria_ocupacao: "Outras ocupações", total: outrosTotal }
    ]

    // Calculate percentage increase (first to second)
    const percentageIncrease = ((data[0][totalKey] - data[1][totalKey]) / data[1][totalKey]) * 100

    // Format the output for the chart
    const output = {
        type: "bar",
        title,
        seriesName,
        series: finalData.map((item) => ({ name: item[itemKey], value: item[totalKey] })),

    }

    if (title == "Distribuição do total por categoria de ocupação") {
        output.extraData = {
            bigNumbers: [
                { value: `+${percentageIncrease?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`, label: "Aumento percentual do primeiro para o segundo" },
                { value: `${top20PercentPercentage?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`, label: "Total dos top 20%" }, // Add top 20% big number
            ],
        }
    } else if (title == "Candidatos mais votados") {
        output.extraData = {
            bigNumbers: [
                { value: `+${percentageIncrease?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`, label: "Aumento percentual do primeiro para o segundo" },
                { value: `${top20PercentPercentage?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`, label: "Total dos top 20%" }, // Add top 20% big number
            ],
        }
    }

    return output
}

const parseFinanceDataToBarChart = (data, title, seriesName) => {
    // Parse totals to numbers and sort descending
    data.sort((a, b) => parseInt(b.mediana) - parseInt(a.mediana))

    const output = {
        type: "bar",
        title,
        seriesName,
        series: data.map((item) => ({ name: item.partido, value: item.mediana })),

    }

    return output
}

function parseDataToBarChart2(
    data,
    title,
    seriesName,
    itemKey = "categoria_ocupacao",
    totalKey = "total",
    indicator_detail = null,
) {
    // Parse totals to numbers and sort descending
    data.sort((a, b) => parseInt(b[totalKey]) - parseInt(a[totalKey]))

    // Format the output for the chart
    const output = {
        type: "bar",
        title,
        seriesName,
        series: data.map((item) => ({ name: item[itemKey], value: item[totalKey] })),
        indicator_detail: indicator_detail ? indicatorsDetails[indicator_detail] : null,

    }

    return output
}

/**
 * Gera um grafico de linhas onde podemos agrupamos conjuntos de dados em categorias
 * @example agrupa resultados de partidos em anos diferentes para uma linha
 * @param {*} data
 * @param {*} xField
 * @param {*} yField
 * @param {*} categoryField
 * @param {*} title
 * @param {*} xAxisLabel
 * @param {*} yAxisLabel
 * @param {*} type
 * @returns
 */
const generateLineChartData = (
    data,
    xField,
    yField,
    categoryField,
    title,
    xAxisLabel,
    yAxisLabel,
    type = "integer",
    indicator_detail = null,
) => {
    // Extraindo valores únicos do eixo X (Exemplo: anos)
    const xAxisValues = [...new Set(data.map((item) => item[xField]))]

    // Organizando os dados por categoria (Exemplo: partido)
    const groupedByCategory = data.reduce((acc, curr) => {
        if (!acc[curr[categoryField]]) {
            acc[curr[categoryField]] = {}
        }
        acc[curr[categoryField]][curr[xField]] = curr[yField]
        return acc
    }, {})

    // Criando as séries de dados
    const seriesData = Object.keys(groupedByCategory).map((category) => {
        return {
            name: category,
            data: xAxisValues.map((xValue) => groupedByCategory[category][xValue] || 0), // Preencher valores faltantes com 0
        }
    })

    // Estrutura do gráfico a ser retornada
    return {
        type: "line",
        title: title || "", // Título fornecido ou vazio
        xAxis: xAxisValues, // Valores do eixo X (exemplo: anos)
        series: seriesData, // Dados da série
        extraData: {
            xAxisLabel: xAxisLabel || "", // Rótulo do eixo X
            yAxisLabel: yAxisLabel || "", // Rótulo do eixo Y
        },
        indicator_detail: indicator_detail ? indicatorsDetails[indicator_detail]
            : null,
    }
}

/**
 *
 * @param {*} data
 * @param {*} xField
 * @param {*} yField
 * @param {*} categoryField
 * @param {*} title
 * @param {*} xAxisLabel
 * @param {*} yAxisLabel
 * @param {*} type
 * @returns
 */
const generateLineChartDataForMultipleLines = (
    data,
    xField,
    title,
    xAxisLabel,
    yAxisLabel,
    type = "integer",
    indicator_detail = null,
) => {
    // Extraindo valores únicos do eixo X (Exemplo: anos)
    const xAxisValues = [...new Set(data.map((item) => item[xField]))]

    // Organizando os dados por categoria (Exemplo: Média, Mediana, Tendência, Total Patrimônio)
    const seriesData = [
        {
            name: "Média do Patrimônio",
            data: xAxisValues.map((xValue) => {
                const item = data.find((d) => d[xField] === xValue)
                return item ? item.media : 0
            }),
        },
        {
            name: "Mediana do Patrimônio",
            data: xAxisValues.map((xValue) => {
                const item = data.find((d) => d[xField] === xValue)
                return item ? item.mediana : 0
            }),
        },
        {
            name: "Linha de Tendência",
            data: xAxisValues.map((xValue) => {
                const item = data.find((d) => d[xField] === xValue)
                return item ? item.tendencia : 0
            }),
        },
        {
            name: "Valor Total do Patrimônio",
            data: xAxisValues.map((xValue) => {
                const item = data.find((d) => d[xField] === xValue)
                return item ? item.total_patrimonio : 0
            }),
        },
    ]

    // Estrutura do gráfico a ser retornada
    return {
        type: "line",
        title: title || "", // Título fornecido ou vazio
        xAxis: xAxisValues, // Valores do eixo X (exemplo: anos)
        series: seriesData, // Dados da série
        extraData: {
            xAxisLabel: xAxisLabel || "", // Rótulo do eixo X
            yAxisLabel: yAxisLabel || "", // Rótulo do eixo Y
        },
        indicator_detail: indicator_detail ? indicatorsDetails[indicator_detail]
            : null,
    }
}

module.exports = {
    parseFinanceDataToBarChart,
    parseDataToDonutChart,
    parseDataToLineChart,
    parseDataToBarChart,
    parseDataToBarChart2,
    generateLineChartData,
    generateLineChartDataForMultipleLines,
    parseDataToMultipleSeriesLineChart,
    indicatorsDetails,
}
