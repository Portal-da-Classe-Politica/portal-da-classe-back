const nomeUrnaModel = require("../models/NomeUrna")
const candidatoModel = require("../models/Candidato")
const candidatoEleicaoModel = require("../models/CandidatoEleicao")

const { Op } = require("sequelize")
const { raw } = require("express")

const getCandidatesIdsByNomeUrnaOrName = async (nomeUrnaOrName, skip, limit, electoralUnitiesIds) => {
    const finder = {
        where: {
            [Op.or]: [
                { nome_urna: { [Op.iLike]: `%${nomeUrnaOrName}%` } },
                { nome_candidato: { [Op.iLike]: `%${nomeUrnaOrName}%` } },
            ],
        },
        include: [
            {
                model: candidatoModel,
                attributes: ["ultima_eleicao_id"],
            },
        ],
        group: [
            [sequelize.col("candidato.ultima_eleicao_id")],
            [sequelize.col("candidato.id")],
        ],

        attributes: [[sequelize.col("candidato.id"), "candidato_id"],
            [sequelize.col("candidato.ultima_eleicao_id"), "eleicao_id"],
        ],
        limit,
        raw: true,
        offset: skip,
    }

    if (electoralUnitiesIds && electoralUnitiesIds.length > 0) {
        const include = {
            model: candidatoEleicaoModel,
            required: true,
            where: {
                unidade_eleitoral_id: {
                    [Op.in]: electoralUnitiesIds,
                },
            },
        }
        finder.include.push(include)
    }

    let { rows, count } = await nomeUrnaModel.findAndCountAll(finder)

    // console.log(rows)
    // console.log(count)

    if (count.length === 1) {
        const object = {
            eleicao_id: count[0].ultima_eleicao_id,
            candidato_id: count[0].id,
        }
        rows = [object]
    }

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
        count: count.length,
    }
}

module.exports = {
    getCandidatesIdsByNomeUrnaOrName,
}
