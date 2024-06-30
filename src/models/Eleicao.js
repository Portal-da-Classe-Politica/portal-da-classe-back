const { DataTypes, Model } = require("sequelize")

const Eleicao = sequelize.define("eleicao",
    {
        ano_eleicao: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "ANO_ELEICAO",
        },
        turno: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "NR_TURNO",
        },
    }, {
        sequelize,
        timestamps: false,
        underscored: true,
    })

module.exports = Eleicao
