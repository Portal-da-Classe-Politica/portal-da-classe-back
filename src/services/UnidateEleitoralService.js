const unidadeEleitoralModel = require("../models/UnidadeEleitoral")

const getFederativeUnitsByAbrangency = (abrangency) => {
    return unidadeEleitoralModel.findAll({
        where: {
            abrangencium_id: abrangency,
        },
        attributes: ["sigla_unidade_federacao"],
        order: [["sigla_unidade_federacao", "ASC"]],
        raw: true,
    })
}

module.exports = {
    getFederativeUnitsByAbrangency,
}
