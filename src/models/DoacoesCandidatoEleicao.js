const { DataTypes, Model } = require("sequelize")

const DoacoesCandidatoEleicao = sequelize.define(
    "doacoes_candidato_eleicoes",
    {
        valor: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            comment: "",
        },
        descricao: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "",
        },
        doador_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "Chave estrangeira referenciando o ID do doador",
            references: {
                model: "doadores",
                key: "id",
            },
        },
    },
    {
        sequelize,
        timestamps: false,
        underscored: true,
        comment: "",
    },
)

module.exports = DoacoesCandidatoEleicao
