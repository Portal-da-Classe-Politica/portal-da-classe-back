/**
 * Utilitários para manipulação de arquivos CSV
 */

/**
 * Converte pontos decimais para vírgulas nos dados antes da conversão para CSV
 * @param {Array} data - Array de objetos para processar
 * @returns {Array} Array de objetos com vírgulas como separador decimal
 */
const convertDecimalSeparatorInData = (data) => {
    return data.map((item) => {
        const convertedItem = {}

        for (const [key, value] of Object.entries(item)) {
            // Se for um número decimal, converte para string com vírgula
            if (typeof value === "number" && !Number.isInteger(value)) {
                convertedItem[key] = value.toString().replace(".", ",")
            } else if (typeof value === "string" && /^\d+\.\d+$/.test(value)) {
                // Se for uma string que representa um número decimal
                convertedItem[key] = value.replace(".", ",")
            } else {
                // Mantém o valor original
                convertedItem[key] = value
            }
        }

        return convertedItem
    })
}

/**
 * Converte pontos decimais para vírgulas em strings CSV (método alternativo)
 * Mantém outros formatações intactas
 * @param {string} csvString - String CSV para processar
 * @returns {string} String CSV com vírgulas como separador decimal
 */
const convertDecimalSeparatorToComma = (csvString) => {
    // Divide o CSV em linhas
    const lines = csvString.split("\n")

    // Processa cada linha
    const processedLines = lines.map((line) => {
        // Divide a linha em colunas usando o delimitador ;
        const columns = line.split(";")

        // Processa cada coluna
        const processedColumns = columns.map((column) => {
            // Remove aspas se existirem
            const cleanColumn = column.replace(/^"(.*)"$/, "$1")

            // Verifica se é um número com ponto decimal
            if (/^\d+\.\d+$/.test(cleanColumn)) {
                // Substitui ponto por vírgula
                return `"${cleanColumn.replace(".", ",")}"`
            }

            // Se já tinha aspas, mantém; senão, verifica se precisa
            if (column.startsWith("\"") && column.endsWith("\"")) {
                return column
            }
            if (cleanColumn.includes(";") || cleanColumn.includes(",") || cleanColumn.includes("\n")) {
                return `"${cleanColumn}"`
            }

            return column
        })

        return processedColumns.join(";")
    })

    return processedLines.join("\n")
}

module.exports = {
    convertDecimalSeparatorInData,
    convertDecimalSeparatorToComma,
}
