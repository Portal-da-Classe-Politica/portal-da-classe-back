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

module.exports = {
    getCandidatesIdsByNomeUrnaOrName,
    searchCandidatesByNomeUrnaOrNamePaginated,
}
