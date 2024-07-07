const { DataTypes, Model } = require("sequelize")

const MunicipiosVotacao = sequelize.define(
    "municipios_votacao",
    {
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        codigo_municipio: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        nome: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        codigo_ibge: {
            type: DataTypes.STRING,
        },
    },
    {
        sequelize,
        timestamps: false,
        underscored: true,
    },
)

module.exports = MunicipiosVotacao
