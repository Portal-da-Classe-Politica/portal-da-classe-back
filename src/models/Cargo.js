const { DataTypes, Model } = require("sequelize")

const Cargo = sequelize.define("cargo",
    {
        nome_cargo: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "DS_CARGO - Descrição do cargo",
        },
        non_vote: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            comment: "Indica se o cargo é de voto ou não",
        },
        has_second_round: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            comment: "Indica se o cargo possui segundo turno",
        },
    }, {
        sequelize,
        timestamps: false,
        underscored: true,
    })

module.exports = Cargo
