const { DataTypes, Model } = require("sequelize")

const Partido = sequelize.define("partido", {
    sigla: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "SG_PARTIDO - sigla do partido",
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "NM_PARTIDO - Nome do partido",
    },
    nome_atual: {
        type: DataTypes.STRING,
        comment: "Nome atual do partido",
    },
    class_categ_1: {
        type: DataTypes.STRING,
        comment: "classificacao segundo categoria 1",
    },
    class_categ_4: {
        type: DataTypes.STRING,
        comment: "classificacao segundo class_categ_4",
    },
    class_survey_esp: {
        type: DataTypes.STRING,
        comment: "classificacao segundo class_survey_esp",
    },
    cor: {
        type: DataTypes.STRING,
        comment: "Cor do partido",
    },
    sigla_atual: {
        type: DataTypes.STRING,
        comment: "Sigla atual do partido",
    },
}, {
    sequelize,
    underscored: true,
    timestamps: false,
})

module.exports = Partido
