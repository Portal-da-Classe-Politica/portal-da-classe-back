const categoriaModel = require("../models/Categoria")
const ocupacaoModel = require("../models/Ocupacao")

const Sequelize = require("sequelize")

const getAllCategorias = () => {
    return categoriaModel.findAll({
        order: [["nome", "ASC"]],
        raw: true,
    })
}

const getOcubacoesByCategories = (categoriesIds) => {
    return ocupacaoModel.findAll(
        {
            where: { categoria_id: { [Sequelize.Op.in]: categoriesIds } },
            attributes: ["id"],
            raw: true,
        },
    )
}
module.exports = {
    getAllCategorias,
    getOcubacoesByCategories,
}
