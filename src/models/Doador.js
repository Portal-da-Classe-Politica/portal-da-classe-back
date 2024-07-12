const { DataTypes, Model } = require("sequelize")

const Doador = sequelize.define(
    "doadore",
    {
        nome: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "",
        },
        cpf_cnpj: {
            type: DataTypes.STRING,
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

module.exports = Doador
