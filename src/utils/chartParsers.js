const ipcaUtil = require("./ipca")

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

    return {
        type: "donut",
        title: title || "",
        series: seriesData,
        extraData: [
            `Total: ${totalValue}`,
            `Maior segmento: ${largestSegment.name} (${((largestSegment.value / totalValue) * 100).toFixed(1)}%)`,
            `Menor segmento: ${smallestSegment.name} (${((smallestSegment.value / totalValue) * 100).toFixed(1)}%)`,
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
    seriesKey = "partido_id"
) {
    if (!Array.isArray(data)) {
        throw new Error("Input data must be an array");
    }

    // Step 1: Extract unique xAxis values
    const xAxis = [...new Set(data.map(item => item[xAxisKey]))].sort((a, b) => a - b);

    // Step 2: Group data by seriesKey
    const mapper = {};
    data.forEach(item => {
        const sk = item[seriesKey];
        if (!mapper[sk]) {
            mapper[sk] = Array(xAxis.length).fill("0.0"); // Initialize with "0.0" or 0.0
        }
        const xIndex = xAxis.indexOf(item[xAxisKey]);
        const value = dataType === "integer" ? parseFloat(item[yAxisKey]) : item[yAxisKey];
        mapper[sk][xIndex] = value;
    });

    // Step 3: Create series array
    const series = Object.keys(mapper).map(key => ({
        name: `${key}`,
        data: mapper[key],
    }));

    // Step 4: Construct the final result object
    const result = {
        type: "line",
        title: title,
        xAxis: xAxis,
        series: series,
        extraData: {
            xAxisLabel: xAxisLabel,
            yAxisLabel: yAxisLabel
        }
    };
    return result;
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
                { value: `+${percentageIncrease.toFixed(0)}%`, label: "Aumento percentual do primeiro para o segundo" },
                { value: `${top20PercentPercentage.toFixed(0)}%`, label: "Total dos top 20%" }, // Add top 20% big number
            ],
        }
    } else if (title == "Candidatos mais votados") {
        output.extraData = {
            bigNumbers: [
                { value: `+${percentageIncrease.toFixed(0)}%`, label: "Aumento percentual do primeiro para o segundo" },
                { value: `${top20PercentPercentage.toFixed(0)}%`, label: "Total dos top 20%" }, // Add top 20% big number
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
) {
    // Parse totals to numbers and sort descending
    data.sort((a, b) => parseInt(b[totalKey]) - parseInt(a[totalKey]))

    // Format the output for the chart
    const output = {
        type: "bar",
        title,
        seriesName,
        series: data.map((item) => ({ name: item[itemKey], value: item[totalKey] })),

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
    parseDataToMultipleSeriesLineChart
}
