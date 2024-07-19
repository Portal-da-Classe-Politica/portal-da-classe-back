const partidoModel = require("../models/Partido")

const getAllPartidos = () => {
    return partidoModel.findAll({
        order: [["nome", "ASC"]],
        raw: true,
    })
}

module.exports = {
    getAllPartidos,
}
