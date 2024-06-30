const { DataTypes, Model } = require("sequelize")

const FonteReceitas = sequelize.define(
    "fonte_receitas",
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

module.exports = FonteReceitas
