const unidadeEleitoralModel = require("../models/UnidadeEleitoral")

const getFederativeUnitsByAbrangency = (abrangency, show, UF) => {
    const filter = {
        where: {
            abrangencium_id: abrangency,
        },
        order: [["sigla_unidade_federacao", "ASC"], ["nome", "ASC"]],
        raw: true,
    }

    if (UF) {
        filter.where.sigla_unidade_federacao = UF
    }

    if (show === "onlyUF") {
        filter.attributes = ["sigla_unidade_federacao"]
        if (abrangency == 2){
            filter.order = ["sigla_unidade_federacao"]
            filter.group = ["sigla_unidade_federacao"]
        }
    }

    if (show === "ufAndId") {
        filter.attributes = ["sigla_unidade_federacao", "id", "nome"]
    }

    return unidadeEleitoralModel.findAll(filter)
}

const getAllElectoralUnitiesIdsByUF = (UF) => {
    return unidadeEleitoralModel.findAll({
        where: {
            sigla_unidade_federacao: UF,
        },
        attributes: ["id"],
        raw: true,
    })
}

const getElectoralUnitByUFandAbrangency = (UF, abrangency) => {
    return unidadeEleitoralModel.findOne({
        where: {
            sigla_unidade_federacao: UF,
            abrangencium_id: abrangency,
        },
        attributes: ["id"],
        raw: true,
    })
}

const getElectoralUnitsByUFandAbrangency = (UF, abrangency) => {
    return unidadeEleitoralModel.findAll({
        where: {
            sigla_unidade_federacao: UF,
            abrangencium_id: abrangency,
        },
        attributes: ["id"],
        raw: true,
    })
}

module.exports = {
    getFederativeUnitsByAbrangency,
    getAllElectoralUnitiesIdsByUF,
    getElectoralUnitByUFandAbrangency,
    getElectoralUnitsByUFandAbrangency,
}
