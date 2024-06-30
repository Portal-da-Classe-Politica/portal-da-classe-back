const { DataTypes, Model } = require("sequelize")

const Genero = sequelize.define("genero",
    {
        nome_genero: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "DS_GENERO - genero do candidato",
        },
    }, {
        sequelize,
        comment: "tabela generos existentes.",
        timestamps: false,
        underscored: true,

    })

module.exports = Genero
