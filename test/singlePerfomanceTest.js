const axios = require("axios")
const fs = require("fs")
const path = require("path")

//const baseURL = "http://localhost:7000" // Ajuste conforme necessário

const baseURL = "http://redem.c3sl.ufpr.br/api"

// Parâmetros possíveis
const initialYear = 2002
const finalYear = 2022
const cargos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]

// Dimensões específicas para cada tipo de cruzamento
const candidateDimensions = ["0", "1", "2"]
const financeDimensions = ["0", "1", "2", "3", "4"]
const electionDimensions = ["0", "1"]

// Lista para armazenar os resultados
const results = []

async function testEndpoint() {
    const endpoints = [
        { url: "/noauth/cruzamentos/candidates-profile/by-year", dimensions: candidateDimensions },
        { url: "/noauth/cruzamentos/candidates-profile/by-gender", dimensions: candidateDimensions },
        { url: "/noauth/cruzamentos/candidates-profile/by-occupation", dimensions: candidateDimensions },
        { url: "/noauth/cruzamentos/candidates-profile/kpis", dimensions: candidateDimensions },
        { url: "/noauth/cruzamentos/finance/kpis", dimensions: financeDimensions },
        { url: "/noauth/cruzamentos/finance/by-year", dimensions: financeDimensions },
        { url: "/noauth/cruzamentos/finance/by-party", dimensions: financeDimensions },
        { url: "/noauth/cruzamentos/finance/by-location", dimensions: financeDimensions },
        { url: "/noauth/cruzamentos/elections/kpis", dimensions: electionDimensions },
        { url: "/noauth/cruzamentos/elections/competition-by-year", dimensions: electionDimensions },
        { url: "/noauth/cruzamentos/elections/top-candidates", dimensions: electionDimensions },
        { url: "/noauth/cruzamentos/elections/by-location", dimensions: electionDimensions },
    ]

    for (const endpoint of endpoints) {
        for (const cargo of cargos) {
            for (const dimension of endpoint.dimensions) {
                const url = `${baseURL}${endpoint.url}?initialYear=${initialYear}&finalYear=${finalYear}&cargosIds=${cargo}&dimension=${dimension}`

                const start = Date.now()
                try {
                    const response = await axios.get(url)
                    const duration = Date.now() - start

                    console.log(`[✅] ${url} - Tempo de resposta: ${duration}ms`)

                    // Salvar no resumo
                    results.push({
                        endpoint: endpoint.url, cargo, dimension, status: "Sucesso", timeMs: duration,
                    })
                } catch (error) {
                    console.log(`[❌] Erro em ${url}:`, error.message)

                    // Salvar no resumo com erro
                    results.push({
                        endpoint: endpoint.url, cargo, dimension, status: "Erro", timeMs: null,
                    })
                }

                // Pequeno delay para evitar sobrecarga no servidor
                await new Promise((resolve) => setTimeout(resolve, 100))
            }
        }
    }

    // Após todas as requisições, salvar os resultados
    saveResults()
}

function saveResults() {
    const csvHeader = "Endpoint,Cargo,Dimension,Status,Tempo(ms)\n"
    const csvData = results.map((r) => `${r.endpoint},${r.cargo},${r.dimension},${r.status},${r.timeMs ?? "Erro"}`).join("\n")
    const csvContent = csvHeader + csvData

    const filePath = path.join(__dirname, "summaryAPI.csv")
    fs.writeFileSync(filePath, csvContent, "utf8")

    console.log(`\n📂 Resumo salvo em: ${filePath}`)
}

// Executar o teste
testEndpoint()
