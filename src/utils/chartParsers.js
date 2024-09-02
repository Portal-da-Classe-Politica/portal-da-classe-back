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

function parseDataToLineChart(data, seriesName, xAxisLabel, yAxisLabel, title, dataType = "integer", xAxisKey = "ano", yAxisKey = "total") {
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
            } else if (dataType === "float") {
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

function parseDataToBarChart(data, title, seriesName, itemKey = "categoria_ocupacao", totalKey = "total", topX = 100) {
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

module.exports = {
    parseFinanceDataToBarChart,
    parseDataToDonutChart,
    parseDataToLineChart,
    parseDataToBarChart,
}
