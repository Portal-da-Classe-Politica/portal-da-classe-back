const unidadeEleitoralModel = require("../models/UnidadeEleitoral")

const getFederativeUnitsByAbrangency = (abrangency, show, UF) => {
    const filter = {
        where: {
            abrangencium_id: abrangency,
        },
        order: [["sigla_unidade_federacao", "ASC"], ["nome", "ASC"]],
        raw: true,
    }

    if (UF){
        filter.where.sigla_unidade_federacao = UF
    }

    if (show === "onlyUF") {
        filter.attributes = ["sigla_unidade_federacao"]
    }

    if (show === "ufAndId") {
        filter.attributes = ["sigla_unidade_federacao", "id", "nome"]
    }

    return unidadeEleitoralModel.findAll(filter)
}

module.exports = {
    getFederativeUnitsByAbrangency,
}
