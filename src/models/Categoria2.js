const { DataTypes, Model } = require("sequelize")

const Categoria = sequelize.define("categoria_2",
    {
        nome: {
            type: DataTypes.STRING,
            comment: "categoria da profissao do candidato",
        },
    }, {
        sequelize,
        timestamps: false,
        comment: "categoria da profissao do candidato, Categ_1_BD_Candidatos 98-14",
        underscored: true,
    })

module.exports = Categoria
