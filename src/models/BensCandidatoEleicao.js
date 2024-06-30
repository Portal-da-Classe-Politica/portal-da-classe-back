const { DataTypes, Model } = require("sequelize")

const BensCandidatoEleicao = sequelize.define(
    "bens_candidato",
    {
        valor: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            comment: "valor do bem do candidato",
        },
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
        comment: "bens do candidato por eleicao",
    },
)

module.exports = BensCandidatoEleicao
