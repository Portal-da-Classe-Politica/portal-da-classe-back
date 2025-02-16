const cargoModel = require("../models/Cargo")

const getAllCargos = () => {
    return cargoModel.findAll({
        order: [["nome_cargo", "ASC"]],
        raw: true,
    })
}

const getAbragencyByCargoID = (ids) => {
    return cargoModel.findOne({
        where: {
            // in
            id: {
                [Op.in]: ids,
            },
        },
        attributes: ["abrangencia"],
        raw: true,
    })
}

module.exports = {
    getAllCargos,
    getAbragencyByCargoID,
}
