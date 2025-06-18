const {
    Sequelize,
} = require("sequelize")
const EleicaoModel = require("../../models/Eleicao")

const getElectionsByYearInterval = async (initialYear, finalYear, round = 1) => {
    try {
        const election = await EleicaoModel.findAll({
            where: {
                ano_eleicao: {
                    [Sequelize.Op.gte]: initialYear,
                    [Sequelize.Op.lte]: finalYear,
                },
                turno: round,
            },
            attributes: ["id"],
            raw: true,
        })
        return election
    } catch (error) {
        console.error("Error fetching election:", error)
        throw error
    }
}

const getNEPP = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds) => {
    const elections = await getElectionsByYearInterval(initialYear, finalYear)
    const electionsIds = elections.map((e) => e.id)

    let select = `
    SELECT 
        subquery.ano_eleicao,
        subquery.partido_id,
        p.sigla,
        subquery.count
`

    let subquerySelect = `
    SELECT 
        e.ano_eleicao,
        ce.partido_id,
        COUNT (ce.id)
    `

    let subqueryFrom = `FROM public.candidato_eleicaos ce
        JOIN situacao_turnos st ON st.id = ce.situacao_turno_id
        JOIN eleicaos e ON e.id = ce.eleicao_id
    `

    let subqueryWhere = ` WHERE ce.eleicao_id IN (:electionsIds) 
        AND ce.cargo_id = :cargoId 
        AND st.foi_eleito = TRUE
    `
    let subqueryGroupBy = " GROUP BY  e.ano_eleicao, ce.partido_id"

    const replacements = { electionsIds, cargoId }

    // Filtros adicionais dinâmicos
    if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
        subqueryWhere += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"
        replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
    }

    let subquery = subquerySelect + subqueryFrom + subqueryWhere + subqueryGroupBy
    let sqlQuery = select + ` FROM (${subquery}) AS subquery
    JOIN partidos p on subquery.partido_id = p.id `

    // Executa a consulta
    const data = await sequelize.query(sqlQuery, {
        replacements, // Substitui os placeholders
        type: Sequelize.QueryTypes.SELECT, // Define como SELECT
    })

    // Step 1: Group data by year and calculate total count per year
    const totalPerYear = data.reduce((acc, entry) => {
        acc[entry.ano_eleicao] = (acc[entry.ano_eleicao] || 0) + Number(entry.count)
        return acc
    }, {})

    // Step 2: Calculate percentages and format the result
    const result = data.map((entry) => ({
        year: entry.ano_eleicao,
        party: entry.sigla,
        count: (Number(entry.count) / totalPerYear[entry.ano_eleicao]).toFixed(2), // Decimal percentage
    }))

    return computeSum(result)
}

const getVolatilidadeEleitoral = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds) => {
    try {
        const elections = await getElectionsByYearInterval(initialYear, finalYear)
        const electionIds = elections.map((e) => e.id)

        const replacements = { electionIds, cargoId }

        let query = `
            SELECT
                ce.partido_id,
                e.ano_eleicao,
                SUM(vcm.quantidade_votos) * 100.0 / SUM(SUM(vcm.quantidade_votos)) OVER (PARTITION BY e.ano_eleicao) AS percentual_votos
            FROM candidato_eleicaos ce
            JOIN votacao_candidato_municipios vcm ON ce.candidato_id = vcm.candidato_eleicao_id
            JOIN eleicaos e ON e.id = ce.eleicao_id
            WHERE ce.eleicao_id IN (:electionIds) AND ce.cargo_id = :cargoId
        `
        // Filtros adicionais dinâmicos
        if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
            query += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"
            replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
        }

        query += `
            GROUP BY ce.partido_id, e.ano_eleicao
            ORDER BY ce.partido_id, e.ano_eleicao
        `

        const results = await sequelize.query(query, {
            replacements,
            type: Sequelize.QueryTypes.SELECT,
        })

        // Step 3: Calculate electoral volatility
        const partyPercentages = new Map()

        // Store election percentages by party and year
        results.forEach((result) => {
            if (!partyPercentages.has(result.partido_id)) {
                partyPercentages.set(result.partido_id, [])
            }
            partyPercentages.get(result.partido_id).push({
                year: result.ano_eleicao,
                percentage: result.percentual_votos,
            })
        })

        // Initialize volatility results
        const volatilityResults = Array.from(new Set(results.map((r) => r.ano_eleicao))).map((year) => ({
            year,
            sum: 0,
        }))

        // Calculate volatility based on the formula
        for (const [partyId, percentages] of partyPercentages) {
            // Ensure percentages are sorted by year
            percentages.sort((a, b) => a.year - b.year)

            if (percentages.length > 1) {
                for (let i = 1; i < percentages.length; i++) {
                    const P_current = percentages[i].percentage
                    const P_previous = percentages[i - 1].percentage

                    const currentYear = percentages[i].year
                    const previousYear = percentages[i - 1].year

                    // Update volatility sum for the current year
                    const currentVolatilityEntry = volatilityResults.find((v) => v.year === currentYear)
                    if (currentVolatilityEntry) {
                        currentVolatilityEntry.sum += Math.abs(P_current - P_previous) / 2
                    }
                }
            }
        }

        // Convert the result into the desired format
        return volatilityResults.map((v) => ({
            ano: v.year,
            volatilidade: v.sum,
        }))
    } catch (error) {
        console.error("Error in getVolatilidadeEleitoral:", error)
        throw error
    }
}

const getQuocienteEleitoral = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds) => {
    try {
        const elections = await getElectionsByYearInterval(initialYear, finalYear)
        const electionIds = elections.map((e) => e.id)

        const replacements = { electionIds, cargoId }

        let query = `
            SELECT
                ce.cargo_id,
                e.ano_eleicao,
              SUM(vcm.quantidade_votos) 
              / COUNT(DISTINCT CASE WHEN ce.situacao_turno_id IN (2, 7, 11, 13)
              THEN ce.candidato_id END) AS quociente_eleitoral
            FROM candidato_eleicaos ce
            JOIN votacao_candidato_municipios vcm ON ce.id = vcm.candidato_eleicao_id
            JOIN eleicaos e ON e.id = ce.eleicao_id
            WHERE ce.eleicao_id IN (:electionIds) AND ce.cargo_id = :cargoId
        `
        // Filtros adicionais dinâmicos
        if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
            query += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"
            replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
        }

        query += `
            GROUP BY ce.cargo_id, e.ano_eleicao
            ORDER BY ce.cargo_id, e.ano_eleicao
        `

        const results = await sequelize.query(query, {
            replacements,
            type: Sequelize.QueryTypes.SELECT,
        })

        // Convert the result into the desired format
        return results.map((v) => ({
            ano: v.ano_eleicao,
            quociente_eleitoral: parseInt(v.quociente_eleitoral),
        }))
    } catch (error) {
        console.error("Error in getVolatilidadeEleitoral:", error)
        throw error
    }
}

const getQuocientePartidario = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds) => {
    try {
        const elections = await getElectionsByYearInterval(initialYear, finalYear)
        const electionIds = elections.map((e) => e.id)

        const replacements = { electionIds, cargoId }

        const quociente_eleitoral = await getQuocienteEleitoral(cargoId, initialYear, finalYear, unidadesEleitoraisIds)

        let query = `
            SELECT
                p.sigla_atual,
                e.ano_eleicao,
                SUM(vcm.quantidade_votos) total_votos
            FROM candidato_eleicaos ce
            JOIN votacao_candidato_municipios vcm ON ce.id = vcm.candidato_eleicao_id
            JOIN eleicaos e ON e.id = ce.eleicao_id
            JOIN partidos p ON p.id = ce.partido_id
            WHERE  ce.eleicao_id IN (:electionIds) AND ce.cargo_id = :cargoId
        `

        // Filtros adicionais dinâmicos
        if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
            query += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"
            replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
        }

        query += `
            GROUP BY p.sigla_atual, e.ano_eleicao
            ORDER BY p.sigla_atual, e.ano_eleicao
        `

        const results = await sequelize.query(query, {
            replacements,
            type: Sequelize.QueryTypes.SELECT,
        })

        const data = quociente_eleitoral

        const mergedData = results.map((result) => {
            // Find the corresponding entry in 'data' with the same 'ano_eleicao'
            const quocienteEntry = data.find((d) => d.ano === result.ano_eleicao)

            // Calculate the 'quociente_partidario' if the matching year is found
            const quociente_partidario = quocienteEntry
                ? parseFloat(result.total_votos) / quocienteEntry.quociente_eleitoral
                : null

            // Return the new object
            return {
                ano: result.ano_eleicao,
                sigla: result.sigla_atual,
                quociente_partidario: quociente_partidario ? quociente_partidario.toFixed(2) : null, // rounding to 2 decimals
            }
        })

        return mergedData
    } catch (error) {
        console.error("Error in getVolatilidadeEleitoral:", error)
        throw error
    }
}

// Function to compute sum of 1/s_i^2 for each year
function computeSum(data) {
    const sumsByYear = {}

    // Group data by year and compute the sum for each year
    data.forEach(({ year, count }) => {
        if (!sumsByYear[year]) {
            sumsByYear[year] = 0
        }
        sumsByYear[year] += Math.pow(count, 2)
    })

    // Convert result to an array of objects
    return Object.keys(sumsByYear).map((year) => ({
        ano: parseInt(year),
        nepp: 1 / sumsByYear[year],
    }))
}

module.exports = {
    getNEPP,
    getVolatilidadeEleitoral,
    getQuocienteEleitoral,
    getQuocientePartidario,
}
