const { DataTypes, Model } = require("sequelize")

const CategoriaBensCandidato = sequelize.define(
    "categoria_bem",
    {
        descricao: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "descrição do bem do candidato",
        },
    },
    {
        sequelize,
        timestamps: false,
        underscored: true,
        comment: "Classificação dos bens dos candidatos",
    },
)

module.exports = CategoriaBensCandidato
