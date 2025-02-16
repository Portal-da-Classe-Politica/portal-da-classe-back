const cargoModel = require("../models/Cargo")

const getAllCargos = () => {
    return cargoModel.findAll({
        order: [["nome_cargo", "ASC"]],
        raw: true,
    })
}

const getAbragencyByCargoID = (id) => {
    return cargoModel.findOne({
        where: {
            id,
        },
        attributes: [["abrangencium_id", "abrangencia"]],
        raw: true,
    })
}

module.exports = {
    getAllCargos,
    getAbragencyByCargoID,
}
