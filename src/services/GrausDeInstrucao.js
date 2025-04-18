const GrauDeInstrucaoModel = require("../models/GrauDeInstrucao")
const Sequelize = require("sequelize")

const getAllGrausDeInstrucao = async () => {
    return GrauDeInstrucaoModel.findAll({
        attributes: ["nome_agrupado", "id_agrupado"],
        group: ["nome_agrupado", "id_agrupado"],
        raw: true,
        order: [["id_agrupado", "ASC"]],
    })
}

const getGrausDeInstrucaoByIdsAgrupados = async (ids) => {
    return GrauDeInstrucaoModel.findAll({
        where: {
            id_agrupado: {
                [Sequelize.Op.in]: ids,
            },
        },
        raw: true,
        attributes: ["id"],
    })
}

module.exports = {
    getAllGrausDeInstrucao,
    getGrausDeInstrucaoByIdsAgrupados,
}
