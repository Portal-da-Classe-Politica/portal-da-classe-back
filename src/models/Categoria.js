const { DataTypes, Model } = require("sequelize")

const Categoria = sequelize.define("categoria",
    {
        nome: {
            type: DataTypes.STRING,
            comment: "categoria da profissao do candidato",
        },
    }, {
        sequelize,
        // tableName:"categoria",
        timestamps: false,
        comment: "categoria da profissao do candidato, Categ_3_BD_DEPFED_7",
        underscored: true,
    })

module.exports = Categoria
