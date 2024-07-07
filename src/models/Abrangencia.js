const { DataTypes, Model } = require("sequelize")

const Abrangencia = sequelize.define("abrangencia",
    {
        nome: {
            type: DataTypes.STRING,
            comment: "TP_ABRANGENCIA",
            allowNull: false,
        },
        descricao: {
            type: DataTypes.STRING,
            comment: "descricao da abrangencia",
            allowNull: false,
        },

    }, {
        sequelize,
        timestamps: false,
        underscored: true,

    })

module.exports = Abrangencia
