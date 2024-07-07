const nomeUrnaModel = require("../models/NomeUrna")
const candidatoModel = require("../models/Candidato")

const { Op } = require("sequelize")
const { raw } = require("express")

const getCandidatesIdsByNomeUrnaOrName = async (nomeUrnaOrName) => {
    const candidates = await nomeUrnaModel.findAll({
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
        group: ["candidato_id",
            [sequelize.col("candidato.ultima_eleicao_id")],
            [sequelize.col("candidato.id")],
        ],
        raw: true,
        attributes: ["candidato_id",
            [sequelize.col("candidato.ultima_eleicao_id"), "eleicao_id"],
        ],

    })

    if (!candidates || candidates.length === 0) return new Error("Nenhum candidato encontrado")

    const filteredCandidates = candidates.map((c) => {
        return {
            candidato_id: c.candidato_id,
            eleicao_id: c.eleicao_id,
        }
    })

    return filteredCandidates
}

module.exports = {
    getCandidatesIdsByNomeUrnaOrName,
}
