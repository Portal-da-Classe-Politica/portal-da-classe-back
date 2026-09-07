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
module.exports = {
    convertDecimalSeparatorInData,
}
