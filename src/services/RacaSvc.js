const RacaModel = require("../models/Raca")

const getAllRacas = async () => {
    return RacaModel.findAll({
        attributes: ["id", "nome"],
        order: [["nome", "ASC"]],
        raw: true,
    })
}

module.exports = {
    getAllRacas,
}
