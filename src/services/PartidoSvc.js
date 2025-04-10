const partidoModel = require("../models/Partido")

const getAllPartidos = () => {
    return partidoModel.findAll({
        order: [["nome", "ASC"]],
        raw: true,
    })
}

const getAllPartidosComSiglaAtualizada = () => {
    return partidoModel.findAll({
        attributes: ["sigla_atual"],
        group: ["sigla_atual"],
        order: [["sigla_atual", "ASC"]],
        raw: true,
    })
}

module.exports = {
    getAllPartidos,
    getAllPartidosComSiglaAtualizada,
}
