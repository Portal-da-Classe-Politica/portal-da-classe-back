const { DataTypes, Model } = require("sequelize")

const NomeUrna = sequelize.define("nome_urna",
    {
        nome_urna: {
            type: DataTypes.STRING,
            allowNull: false,

            comment: "NM_URNA_CANDIDATO",
        }
        ,
    }, {
        sequelize,
        timestamps: false,
        underscored: true,

    })

module.exports = NomeUrna
