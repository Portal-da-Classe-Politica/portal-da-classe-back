const { Op, Sequelize } = require("sequelize")
const unidadeEleitoralModel = require("../models/UnidadeEleitoral")

const getFederativeUnitsByAbrangency = (abrangency, show, UF) => {
    const filter = {
        where: {
            abrangencium_id: abrangency,
        },
        order: [["sigla_unidade_federacao", "ASC"], ["nome", "ASC"]],
        raw: true,
    }

    if (UF) {
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

const getAllElectoralUnitsByArrayOfUnidadesEleitorais = async (unidadesIds) => {
    const sqlQuery = ` 
        SELECT id FROM unidade_eleitorals 
        WHERE sigla_unidade_federacao in (
            SELECT sigla_unidade_federacao 
            FROM unidade_eleitorals 
            WHERE id IN (:unidadesIds)
        )`

    const replacements = { unidadesIds }

    const results = await sequelize.query(sqlQuery, {
        replacements, // Substitute placeholders
        type: Sequelize.QueryTypes.SELECT, // Define as SELECT
    });

    return results

}

module.exports = {
    getAllElectoralUnitsByArrayOfUFs,
    getFederativeUnitsByAbrangency,
    getAllElectoralUnitiesIdsByUF,
    getAllElectoralUnitsByArrayOfUnidadesEleitorais
}
