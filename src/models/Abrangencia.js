const { DataTypes, Model } = require("sequelize")

const Abrangencia = sequelize.define("abrangencia",
    {
        nome: {
            type: DataTypes.STRING,
            comment: "TP_ABRANGENCIA",
            allowNull: false,
        },

    }, {
        sequelize,
        timestamps: false,
        underscored: true,

    })

module.exports = Abrangencia
