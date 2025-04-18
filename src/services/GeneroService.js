const generoModel = require("../models/Genero")
const Sequelize = require("sequelize")

const getAllGenders = () => {
    return generoModel.findAll({
        order: [["nome_genero", "ASC"]],
        raw: true,
    })
}

const getGendersByIds = (ids) => {
    return generoModel.findAll({
        where: {
            id: {
                [Sequelize.Op.in]: ids,
            },
        },
        raw: true,
        attributes: [
            "id",
        ],
    })
}

module.exports = {
    getAllGenders,
    getGendersByIds,
}
