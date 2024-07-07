const abrangenciaModel = require("../models/Abrangencia")

const getAllAbrancies = () => {
    return abrangenciaModel.findAll({ raw: true })
}

module.exports = {
    getAllAbrancies,
}
