const generoModel = require("../models/Genero")

const getAllGenders = () => {
    return generoModel.findAll({
        order: [["nome_genero", "ASC"]],
        raw: true,
    })
}

module.exports = {
    getAllGenders,
}
