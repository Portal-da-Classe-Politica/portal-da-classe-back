const nomeUrnaModel = require("../models/NomeUrna")
const candidatoModel = require("../models/Candidato")
const candidatoEleicaoModel = require("../models/CandidatoEleicao")
const { sequelize } = require("../db/sequelize-connection")

const { Op } = require("sequelize")
const { raw } = require("express")

const getCandidatesIdsByNomeUrnaOrName = async (nomeUrnaOrName, skip, limit, electoralUnitiesIds) => {
    let electoralUnitiesCondition = ""
    if (electoralUnitiesIds && electoralUnitiesIds.length > 0) {
        const electoralUnitiesIdsString = electoralUnitiesIds.map((id) => `'${id}'`).join(",")
        electoralUnitiesCondition = `AND ce.unidade_eleitoral_id IN (${electoralUnitiesIdsString})`
    }

    const query = `
    SELECT 
        c.id AS candidato_id,
        c.ultima_eleicao_id AS eleicao_id,
        nu.nome_candidato
    FROM nome_urnas nu
    JOIN candidatos c ON nu.candidato_id = c.id
    LEFT JOIN candidato_eleicaos ce ON ce.nome_urna_id = nu.id
    WHERE 
        (nu.nome_urna ILIKE :nomeUrnaOrName OR nu.nome_candidato ILIKE :nomeUrnaOrName)
        ${electoralUnitiesCondition}
    GROUP BY 
        c.id, 
        c.ultima_eleicao_id, 
        nu.nome_candidato
    ORDER BY 
        nu.nome_candidato ASC
    LIMIT :limit OFFSET :skip;
`

    const countQuery = `
        SELECT COUNT(DISTINCT c.id) AS count
        FROM nome_urnas nu
        JOIN candidatos c ON nu.candidato_id = c.id
        LEFT JOIN candidato_eleicaos ce ON ce.nome_urna_id = nu.id
        WHERE 
            (nu.nome_urna ILIKE :nomeUrnaOrName OR nu.nome_candidato ILIKE :nomeUrnaOrName)
            ${electoralUnitiesCondition}
    `

    const replacements = {
        nomeUrnaOrName: `%${nomeUrnaOrName}%`,
        limit,
        skip,
    }

    let [rows, countResult] = await Promise.all([
        sequelize.query(query, { replacements, type: sequelize.QueryTypes.SELECT }),
        sequelize.query(countQuery, { replacements, type: sequelize.QueryTypes.SELECT }),
    ])

    let count = countResult[0].count

    if (!rows || !count) return new Error("Erro ao buscar candidatos")

    if (!rows || rows.length === 0) return new Error("Nenhum candidato encontrado")

    const filteredCandidates1 = rows.map((c) => {
        return {
            candidato_id: c.candidato_id,
            eleicao_id: c.eleicao_id,
        }
    })

    const finalCandidatesElectionsIds = filteredCandidates1.map((c) => {
        return candidatoEleicaoModel.findOne({
            where: {
                candidato_id: c.candidato_id,
                eleicao_id: c.eleicao_id,
            },
            raw: true,
            attributes: ["id"],
        })
    })

    const filteredCandidatesIds = await Promise.all(finalCandidatesElectionsIds)

    return {
        ids: filteredCandidatesIds.map((c) => c.id),
        count: Number(count),
    }
}

const searchCandidatesByNomeUrnaOrNamePaginated = async (nomeUrnaOrName, skip = 0, limit = 10) => {
    try {
        // Query otimizada com melhor performance
        const query = `
            SELECT 
                c.id AS candidato_id,
                c.ultima_eleicao_id AS eleicao_id,
                MIN(nu.nome_candidato) AS nome_candidato,
                MIN(nu.nome_urna) AS nome_urna,
                e.ano_eleicao,
                ce.id AS candidato_eleicao_id,
                p.sigla AS partido_sigla,
                sc.nome AS situacao_candidatura,
                car.nome_cargo AS cargo
            FROM candidatos c
            INNER JOIN nome_urnas nu ON nu.candidato_id = c.id
            LEFT JOIN eleicaos e ON e.id = c.ultima_eleicao_id
            LEFT JOIN candidato_eleicaos ce ON ce.candidato_id = c.id 
                AND ce.eleicao_id = c.ultima_eleicao_id
            LEFT JOIN partidos p ON p.id = ce.partido_id
            LEFT JOIN situacao_candidaturas sc ON sc.id = ce.situacao_candidatura_id
            LEFT JOIN cargos car ON car.id = ce.cargo_id
            WHERE 
                (nu.nome_urna ILIKE $1 OR nu.nome_candidato ILIKE $1)
            GROUP BY 
                c.id, c.ultima_eleicao_id, e.ano_eleicao, ce.id, 
                p.sigla, sc.nome, car.nome_cargo
            ORDER BY 
                MIN(nu.nome_candidato) ASC
            LIMIT $2 OFFSET $3;
        `

        // Query de count otimizada (sem joins desnecessários)
        const countQuery = `
            SELECT COUNT(DISTINCT nu.candidato_id) AS count
            FROM nome_urnas nu                
            WHERE 
                (nu.nome_urna ILIKE $1 OR nu.nome_candidato ILIKE $1)
        `

        const searchParam = `%${nomeUrnaOrName}%`

        const [rows, countResult] = await Promise.all([
            sequelize.query(query, {
                bind: [searchParam, limit, skip],
                type: sequelize.QueryTypes.SELECT,
            }),
            sequelize.query(countQuery, {
                bind: [searchParam],
                type: sequelize.QueryTypes.SELECT,
            }),
        ])

        const totalCount = Number(countResult[0].count)
        const currentPage = Math.floor(skip / limit) + 1
        const totalPages = Math.ceil(totalCount / limit)

        const results = rows.map((row) => ({
            lastCandidatoEleicaoId: row.candidato_eleicao_id,
            partido: row.partido_sigla,
            nomeCandidato: row.nome_candidato,
            candidatoId: row.candidato_id,
            ultimaEleicao: row.ano_eleicao,
            situacao: row.situacao_candidatura,
            cargo: row.cargo,
            nomeUrna: row.nome_urna,
        }))

        return {
            totalResults: totalCount,
            currentPage,
            totalPages,
            results,
        }
    } catch (error) {
        throw new Error(`Erro ao buscar candidatos: ${error.message}`)
    }
}

const fuzzySearchCandidatesByName = async (searchTerm, skip = 0, limit = 10) => {
    try {
        // Split search term into words for better matching
        const searchWords = searchTerm.trim().toLowerCase().split(/\s+/)
        const searchPattern = `%${searchTerm.toLowerCase()}%`

        // Criar condições AND para garantir que todas as palavras estejam presentes
        let wordConditions = ""
        let countWordConditions = ""
        let queryBindParams = [searchPattern, limit, skip]
        let countBindParams = [searchPattern]

        if (searchWords.length > 1) {
            // Para múltiplas palavras, criar condições AND para cada palavra
            const wordConditionsArray = searchWords.map((word, index) => {
                const paramIndex = index + 4
                return `(unaccent(LOWER(nu.nome_urna)) ILIKE unaccent($${paramIndex}) OR unaccent(LOWER(nu.nome_candidato)) ILIKE unaccent($${paramIndex}))`
            })
            wordConditions = `OR (${wordConditionsArray.join(" AND ")})`

            // Para count query
            const countWordConditionsArray = searchWords.map((word, index) => {
                const paramIndex = index + 2
                return `(unaccent(LOWER(nu.nome_urna)) ILIKE unaccent($${paramIndex}) OR unaccent(LOWER(nu.nome_candidato)) ILIKE unaccent($${paramIndex}))`
            })
            countWordConditions = `OR (${countWordConditionsArray.join(" AND ")})`

            // Adicionar parâmetros das palavras
            const wordParams = searchWords.map((word) => `%${word}%`)
            queryBindParams.push(...wordParams)
            countBindParams.push(...wordParams)
        }

        const query = `
            SELECT DISTINCT
                main.candidato_id,
                main.eleicao_id,
                main.nome_candidato,
                main.nome_urna,
                main.ano_eleicao,
                main.candidato_eleicao_id,
                main.partido_sigla,
                main.situacao_candidatura,
                main.cargo,
                main.score
            FROM (
                SELECT 
                    c.id AS candidato_id,
                    c.ultima_eleicao_id AS eleicao_id,
                    nu.nome_candidato,
                    nu.nome_urna,
                    e.ano_eleicao,
                    ce.id AS candidato_eleicao_id,
                    p.sigla AS partido_sigla,
                    sc.nome AS situacao_candidatura,
                    car.nome_cargo AS cargo,
                    CASE 
                        WHEN unaccent(LOWER(nu.nome_candidato)) ILIKE unaccent($1) THEN 100
                        WHEN unaccent(LOWER(nu.nome_urna)) ILIKE unaccent($1) THEN 95
                        ELSE 75
                    END AS score,
                    ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY ce.id DESC) as rn
                FROM candidatos c
                INNER JOIN nome_urnas nu ON nu.candidato_id = c.id
                LEFT JOIN eleicaos e ON e.id = c.ultima_eleicao_id
                LEFT JOIN candidato_eleicaos ce ON ce.candidato_id = c.id 
                    AND ce.eleicao_id = c.ultima_eleicao_id
                LEFT JOIN partidos p ON p.id = ce.partido_id
                LEFT JOIN situacao_candidaturas sc ON sc.id = ce.situacao_candidatura_id
                LEFT JOIN cargos car ON car.id = ce.cargo_id
                WHERE 
                    (unaccent(LOWER(nu.nome_urna)) ILIKE unaccent($1) 
                     OR unaccent(LOWER(nu.nome_candidato)) ILIKE unaccent($1)
                     ${wordConditions})
            ) main
            WHERE main.rn = 1
            ORDER BY 
                main.score DESC,
                main.nome_candidato ASC
            LIMIT $2 OFFSET $3;
        `

        const countQuery = `
            SELECT COUNT(DISTINCT c.id) AS count
            FROM candidatos c
            INNER JOIN nome_urnas nu ON nu.candidato_id = c.id
            WHERE 
                (unaccent(LOWER(nu.nome_urna)) ILIKE unaccent($1) 
                 OR unaccent(LOWER(nu.nome_candidato)) ILIKE unaccent($1)
                 ${countWordConditions})
        `

        // console.log("Query:", query)
        // console.log("Query Bind Params:", queryBindParams)
        // console.log("Count Query:", countQuery)
        // console.log("Count Bind Params:", countBindParams)

        const [rows, countResult] = await Promise.all([
            sequelize.query(query, {
                bind: queryBindParams,
                type: sequelize.QueryTypes.SELECT,
            }),
            sequelize.query(countQuery, {
                bind: countBindParams,
                type: sequelize.QueryTypes.SELECT,
            }),
        ])

        const totalCount = Number(countResult[0].count)
        const currentPage = Math.floor(skip / limit) + 1
        const totalPages = Math.ceil(totalCount / limit)

        const results = rows.map((row) => ({
            lastCandidatoEleicaoId: row.candidato_eleicao_id,
            partido: row.partido_sigla,
            nomeCandidato: row.nome_candidato,
            candidatoId: row.candidato_id,
            ultimaEleicao: row.ano_eleicao,
            situacao: row.situacao_candidatura,
            cargo: row.cargo,
            nomeUrna: row.nome_urna,
            score: row.score,
        }))

        return {
            totalResults: totalCount,
            currentPage,
            totalPages,
            results,
        }
    } catch (error) {
        throw new Error(`Erro ao buscar candidatos com busca difusa: ${error.message}`)
    }
}

module.exports = {
    getCandidatesIdsByNomeUrnaOrName,
    searchCandidatesByNomeUrnaOrNamePaginated,
    fuzzySearchCandidatesByName,
}
