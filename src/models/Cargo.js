const { DataTypes, Model } = require("sequelize")

const Cargo = sequelize.define("cargo",
    {
        nome_cargo: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "DS_CARGO - Descrição do cargo",
        },
    }, {
        sequelize,
        timestamps: false,
        underscored: true,
    })

module.exports = Cargo
