const { DataTypes, Model } = require("sequelize")

const SituacaoTurno = sequelize.define("situacao_turno",
    {

        nome: {
            type: DataTypes.STRING,
            allowNull: false,

            comment: "DS_SIT_TOT_TURNO - Situação de totalização do candidato, naquele turno da eleição, após a totalização dos votos.",
        },

        foi_eleito: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            comment: "Se o candidato foi eleito ou não.",
        },
    }, {
        sequelize,
        comment: "tabela das situacoes de turno existentes.",
        timestamps: false,
        underscored: true,

    })

module.exports = SituacaoTurno
