const { DataTypes, Model } = require("sequelize")

const Ocupacao= sequelize.define("ocupacao",
    {
        nome_ocupacao: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "DS_OCUPACAO - descricao da ocupacao do candidato",
        },
    },
    {
        sequelize,
        timestamps: false,
        underscored: true,

    })

module.exports = Ocupacao
