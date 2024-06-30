const { DataTypes, Model } = require("sequelize")

const Raca = sequelize.define("raca", {
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "DS_COR_RACA - raça do candidato",
    },
}, {
    sequelize,
    timestamps: false,
    underscored: true,

})

module.exports = Raca
