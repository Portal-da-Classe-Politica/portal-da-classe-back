const categoriaModel = require("../models/Categoria")

const getAllCategorias = () => {
    return categoriaModel.findAll({
        order: [["nome", "ASC"]],
        raw: true,
    })
}

module.exports = {
    getAllCategorias,
}
