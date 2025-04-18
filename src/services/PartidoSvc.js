const partidoModel = require("../models/Partido")
const Sequelize = require("sequelize")

const getAllPartidos = () => {
    return partidoModel.findAll({
        order: [["nome", "ASC"]],
        raw: true,
    })
}

const getAllPartidosComSiglaAtualizada = () => {
    return partidoModel.findAll({
        attributes: ["nome_atual", "id_agrupado"],
        group: ["nome_atual", "id_agrupado"],
        order: [["id_agrupado", "ASC"]],
        raw: true,
    })
}

const getPartidosByIdsAgrupados = (ids) => {
    return partidoModel.findAll({
        where: {
            id_agrupado: {
                [Sequelize.Op.in]: ids,
            },
        },
        attributes: ["id"],
        raw: true,
    })
}

module.exports = {
    getAllPartidos,
    getAllPartidosComSiglaAtualizada,
    getPartidosByIdsAgrupados,
}
