const partidoModel = require("../models/Partido")
const Sequelize = require("sequelize")

const getAllPartidos = () => {
    return partidoModel.findAll({
        order: [["nome", "ASC"]],
        raw: true,
    })
}

const getAllPartidosComSiglaAtualizada = () => {
    return partidoModel.findAll({
        attributes: ["nome_atual", "id_agrupado"],
        group: ["nome_atual", "id_agrupado"],
        order: [["id_agrupado", "ASC"]],
        raw: true,
    })
}

const getPartidosByIdsAgrupados = (ids) => {
    return partidoModel.findAll({
        where: {
            id_agrupado: {
                [Sequelize.Op.in]: ids,
            },
        },
        attributes: ["id"],
        raw: true,
    })
}

const getDistinctIdeologiaSimplificada = async () => {
    const results = await partidoModel.findAll({
        attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("class_categ_1")), "class_categ_1"]],
        where: {
            class_categ_1: {
                [Sequelize.Op.ne]: null,
            },
        },
        order: [["class_categ_1", "ASC"]],
        raw: true,
    })
    return results.map((r) => r.class_categ_1).filter((v) => v)
}

const getDistinctIdeologiaCoppedge = async () => {
    const results = await partidoModel.findAll({
        attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("class_categ_4")), "class_categ_4"]],
        where: {
            class_categ_4: {
                [Sequelize.Op.ne]: null,
            },
        },
        order: [["class_categ_4", "ASC"]],
        raw: true,
    })
    return results.map((r) => r.class_categ_4).filter((v) => v)
}

const getDistinctIdeologiaSurvey = async () => {
    const results = await partidoModel.findAll({
        attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("class_survey_esp")), "class_survey_esp"]],
        where: {
            class_survey_esp: {
                [Sequelize.Op.ne]: null,
            },
        },
        order: [["class_survey_esp", "ASC"]],
        raw: true,
    })
    return results.map((r) => r.class_survey_esp).filter((v) => v)
}

module.exports = {
    getAllPartidos,
    getAllPartidosComSiglaAtualizada,
    getPartidosByIdsAgrupados,
    getDistinctIdeologiaSimplificada,
    getDistinctIdeologiaCoppedge,
    getDistinctIdeologiaSurvey,
}
