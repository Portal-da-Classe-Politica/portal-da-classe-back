const ipcaUtil = require("./ipca")
const { indicatorsDetails } = require("./indicatorsDetails")
const { partidos } = require("./corespartidos")

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
    if (indicator_detail == 2 || indicator_detail == 7 || indicator_detail == 13 || indicator_detail == 15){
        // teria que remover o primeiro valor de seriesData.data e de xAxisValues se seriesData.data[0] for zero
        if (xAxisValues[0] == 1998 && seriesData.data[0] && seriesData.data[0] == 0){
            seriesData.data.shift()
            xAxisValues.shift()
        }
        // se todos seriesData.data forem 0, remover a serie
        console.log(seriesData)
        if (seriesData.data.every((value) => value == 0)){
            seriesData.data = []
        }
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
    const series = Object.keys(mapper).map((key) => {
        const partido = partidos.find((p) => p.sigla_atual === key)
        return {
            name: `${key}`,
            data: mapper[key],
            color: (indicator_detail === 4 || indicator_detail === 12) && partido ? `rgb${partido.cor}` : undefined,
        }
    })

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
    data.sort((a, b) => parseInt(b[itemKey]) - parseInt(a[itemKey]))

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
        const partido = partidos.find((p) => p.sigla_atual === category)
        return {
            name: category,
            data: xAxisValues.map((xValue) => groupedByCategory[category][xValue] || 0), // Preencher valores faltantes com 0
            color: (indicator_detail === 13) && partido ? `rgb${partido.cor}` : undefined,
        }
    })

    if (indicator_detail == 13){
        // se xAxisValues[0] for = 1998 e todos os valores de seriesData.data forem 0 ou negativos,
        //  entao remove todos os primeiros valores de seriesData.data e de xAxisValues
        if (xAxisValues[0] == 1998 && seriesData.every((item) => item.data[0] == 0 || item.data[0] < 0)){
            seriesData.forEach((item) => item.data.shift())
            xAxisValues.shift()
        }
        // se todos seriesData.data(partido) forem 0, remover a serie
        seriesData.forEach((item) => {
            if (item.data.every((value) => value == 0)){
                seriesData.splice(seriesData.indexOf(item), 1)
            }
        })
    }

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
            name: "Valor Total do Patrimônio em milhares de reais",
            data: xAxisValues.map((xValue) => {
                const item = data.find((d) => d[xField] === xValue)
                return item ? (item.total_patrimonio/10000).toFixed(2) : 0
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

const generateLineChartForMultipleLines = (data, dimension, crossCriteria = []) => {
    if (!Array.isArray(data)) {
        throw new Error("Input data must be an array")
    }

    // Ordenar os dados pelo eixo X (ano) em ordem crescente
    const xAxisValues = [...new Set(data.map((item) => item.ano))].sort((a, b) => a - b)

    // Agrupar os dados pelas combinações dos critérios de cruzamento
    const groupedData = data.reduce((acc, curr) => {
        // Criar uma chave única para cada combinação de critérios
        const criteriaKey = crossCriteria
            .map((criterion) => curr[criterion] || "Não especificado")
            .join(" - ")
        const statusKey = dimension === "elected_candidates"
            ? ` - ${curr.status_eleicao ? "Eleito" : "Não eleito"}`
            : ""
        const lineKey = criteriaKey + statusKey

        if (!acc[lineKey]) {
            acc[lineKey] = {
                name: lineKey,
                data: Array(xAxisValues.length).fill(0),
            }
        }

        // Preencher os valores no eixo Y (total) para o eixo X correspondente (ano)
        const xIndex = xAxisValues.indexOf(curr.ano)
        acc[lineKey].data[xIndex] = curr.total

        return acc
    }, {})

    // Criar as séries de dados para o gráfico
    const series = Object.values(groupedData).map((line) => ({
        name: line.name, // Apenas os valores, sem os nomes dos campos
        data: line.data,
    }))

    // Criar uma descrição geral dos critérios usados para as linhas
    const criteriaTranslations = {
        genero: "Gênero",
        raca: "Raça",
        ocupacao: "Ocupação",
        instrucao: "Instrução",
        partido: "Partido",
    }

    const translatedCriteria = crossCriteria
        .map((criterion) => criteriaTranslations[criterion] || criterion)
        .join(", ")

    const generalLegend = `As linhas representam combinações dos seguintes critérios: ${translatedCriteria}${
        dimension === "elected_candidates" ? ", incluindo o status eleitoral (Eleito/Não eleito)" : ""
    }.`

    // Estrutura final do gráfico
    return {
        type: "line",
        title: "Gráfico de Múltiplas Linhas",
        xAxis: xAxisValues,
        series,
        extraData: {
            xAxisLabel: "Ano",
            yAxisLabel: "Total",
            generalLegend, // Adiciona a explicação geral dos parâmetros das linhas
        },
    }
}

module.exports = {
    generateLineChartForMultipleLines,
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
