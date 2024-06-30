const { DataTypes, Model } = require("sequelize")

const NaturezaReceita = sequelize.define(
    "natureza_receitas",
    {
        nome: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "",
        },
    },
    {
        sequelize,
        timestamps: false,
        underscored: true,
        comment: "",
    },
)

module.exports = NaturezaReceita
