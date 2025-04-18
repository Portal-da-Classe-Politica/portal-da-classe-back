const OcupacaoModel = require("../models/Ocupacao")
const Sequelize = require("sequelize")

const getOcupationsIDsByCategory = (categoryId) => {
    return OcupacaoModel.findAll({
        where: {
            categoria_id: { [Sequelize.Op.in]: categoryId },
        },
        raw: true,
        attributes: [
            "id",
        ],
    })
}

module.exports = {
    getOcupationsIDsByCategory,

}
