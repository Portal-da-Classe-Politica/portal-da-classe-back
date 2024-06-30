const { DataTypes, Model } = require("sequelize")

const OrigemReceitas = sequelize.define(
    "origem_receitas",
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

module.exports = OrigemReceitas
