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
        const whereCondition = {
            [Op.or]: [
                { nome_urna: { [Op.iLike]: `%${nomeUrnaOrName}%` } },
                { nome_candidato: { [Op.iLike]: `%${nomeUrnaOrName}%` } },
            ],
        }

        const { count, rows } = await nomeUrnaModel.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: candidatoModel,
                    attributes: ["id", "ultima_eleicao_id", "nome"],
                    required: true,
                    include: [
                        {
                            model: require("../models/Eleicao"),
                            attributes: ["ano_eleicao"],
                        },
                    ],
                },
            ],
            attributes: ["nome_candidato", "nome_urna", "id"],
            order: [["nome_candidato", "ASC"]],
            limit,
            offset: skip,
            distinct: true,
            col: "candidato.id",
        })

        // Buscar informações da última eleição para cada candidato
        const candidateElectionsPromises = rows.map(async (row) => {
            const candidatoEleicao = await candidatoEleicaoModel.findOne({
                where: {
                    candidato_id: row.candidato.id,
                    eleicao_id: row.candidato.ultima_eleicao_id,
                },
                include: [
                    {
                        model: require("../models/Partido"),
                        attributes: ["sigla", "nome"],
                    },
                    {
                        model: require("../models/SituacaoCandidatura"),
                        attributes: ["nome"],
                    },
                    {
                        model: require("../models/Cargo"),
                        attributes: ["nome_cargo"],
                    },
                ],
                attributes: ["id"],
                raw: false,
            })

            return {
                candidato_id: row.candidato.id,
                candidato_eleicao_id: candidatoEleicao?.id || null,
                eleicao_id: row.candidato.ultima_eleicao_id,
                nome_candidato: row.nome_candidato,
                nome_urna: row.nome_urna,
                ano_eleicao: row.candidato?.eleicao?.ano_eleicao || null,
                partido_sigla: candidatoEleicao?.partido?.sigla || null,
                partido_nome: candidatoEleicao?.partido?.nome || null,
                situacao_candidatura: candidatoEleicao?.situacao_candidatura?.nome || null,
                cargo: candidatoEleicao?.cargo?.nome_cargo || null,
            }
        })

        const results = await Promise.all(candidateElectionsPromises)

        return {
            data: results,
            count,
            skip,
            limit,
            hasMore: count > skip + limit,
        }
    } catch (error) {
        throw new Error(`Erro ao buscar candidatos: ${error.message}`)
    }
}

module.exports = {
    getCandidatesIdsByNomeUrnaOrName,
    searchCandidatesByNomeUrnaOrNamePaginated,
}
