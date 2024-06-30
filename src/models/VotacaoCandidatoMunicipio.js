const { DataTypes, Model } = require("sequelize")

const VotacaoCandidatoMunicipio = sequelize.define(
    "votacao_candidato_municipio",
    {
        quantidade_votos: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
    },
    {
        sequelize,
        timestamps: false,
        underscored: true,
    },
)

module.exports = VotacaoCandidatoMunicipio
