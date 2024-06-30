const { DataTypes, Model } = require("sequelize")

const Candidato = sequelize.define("candidato",
    {
        nome: {
            type: DataTypes.STRING,
            comment: "NM_CANDIDATO",
        },
        cpf: {
            type: DataTypes.STRING,
            comment: "NR_CPF_CANDIDATO",
        },
        titulo_eleitoral: {
            type: DataTypes.STRING,
            comment: "NR_TITULO_ELEITORAL_CANDIDATO",
        },
        municipio_nascimento: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "NM_MUNICIPIO_NASCIMENTO",
        },
        estado_nascimento: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "SG_UF_NASCIMENTO",
        },
        data_nascimento: {
            type: DataTypes.DATE,
            comment: "DT_NASCIMENTO",
        },
    },
    {
        sequelize,
        timestamps: false,
        underscored: true,
    })

module.exports = Candidato
