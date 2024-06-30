const cargoModel = require("../models/Cargo")

const getAllCargos = () => {
    return cargoModel.findAll({
        order: [["nome_cargo", "ASC"]],
        raw: true,
    })
}

module.exports = {
    getAllCargos,
}
