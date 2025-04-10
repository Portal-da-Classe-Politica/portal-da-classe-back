const { raw } = require("express")
const GrauDeInstrucaoModel = require("../models/GrauDeInstrucao")

const getAllGrausDeInstrucao = async () => {
    return GrauDeInstrucaoModel.findAll({
        attributes: ["nome_agrupado"],
        group: ["nome_agrupado"],
        raw: true,
        order: [["nome_agrupado", "ASC"]],
    })
}

module.exports = {
    getAllGrausDeInstrucao,
}
