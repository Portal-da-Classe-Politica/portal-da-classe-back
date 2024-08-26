const { Op } = require("sequelize")
const unidadeEleitoralModel = require("../models/UnidadeEleitoral")

const getFederativeUnitsByAbrangency = (abrangency, show, UF) => {
    const filter = {
        where: {
            abrangencium_id: abrangency,
        },
        order: [["sigla_unidade_federacao", "ASC"], ["nome", "ASC"]],
        raw: true,
    }

    if (UF){
        filter.where.sigla_unidade_federacao = UF
    }

    if (show === "onlyUF") {
        filter.attributes = ["sigla_unidade_federacao"]
    }

    if (show === "ufAndId") {
        filter.attributes = ["sigla_unidade_federacao", "id", "nome"]
    }

    return unidadeEleitoralModel.findAll(filter)
}

const getAllElectoralUnitiesIdsByUF = (UF) => {
    return unidadeEleitoralModel.findAll({
        where: {
            sigla_unidade_federacao: UF,
        },
        attributes: ["id"],
        raw: true,
    })
}

const getAllElectoralUnitsByArrayOfUFs = (UFs) => {
    return unidadeEleitoralModel.findAll({
        where: {
            sigla_unidade_federacao: {
                [Op.in]: UFs,
            },
            id: {
                [Op.gte]: 29, // 29 is the first electoral unit id by municipality
            },
        },
        attributes: ["id"],
        raw: true,
    })
}

module.exports = {
    getAllElectoralUnitsByArrayOfUFs,
    getFederativeUnitsByAbrangency,
    getAllElectoralUnitiesIdsByUF,
}
