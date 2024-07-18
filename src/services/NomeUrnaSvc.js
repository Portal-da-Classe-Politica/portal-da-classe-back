const nomeUrnaModel = require("../models/NomeUrna")
const candidatoModel = require("../models/Candidato")
const candidatoEleicaoModel = require("../models/CandidatoEleicao")

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

module.exports = {
    getCandidatesIdsByNomeUrnaOrName,
}
