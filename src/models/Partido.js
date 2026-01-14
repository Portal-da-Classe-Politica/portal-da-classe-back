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
        comment: "classificacao segundo Ideologia_Simplificada",
    },
    class_categ_4: {
        type: DataTypes.STRING,
        comment: "classificacao segundo Ideologia_Coppedge",
    },
    class_survey_esp: {
        type: DataTypes.STRING,
        comment: "classificacao segundo Ideologia_Coppedge",
    },
    cor: {
        type: DataTypes.STRING,
        comment: "Cor do partido",
    },
    sigla_atual: {
        type: DataTypes.STRING,
        comment: "Sigla atual do partido",
    },
    id_agrupado: {
        type: DataTypes.INTEGER,
        comment: "id do partido agrupado de acordo com a sigla atual",
    },
    centrao: {
        type: DataTypes.BOOLEAN,
        comment: "Indica se o partido faz parte do centrão",
    },
}, {
    sequelize,
    underscored: true,
    timestamps: false,
})

module.exports = Partido
