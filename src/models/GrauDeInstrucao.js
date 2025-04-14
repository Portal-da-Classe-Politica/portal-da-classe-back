const { DataTypes, Model } = require("sequelize")

const GrauDeInstrucao = sequelize.define("grau_de_instrucao",

    {
        nome_instrucao: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "DS_GRAU_INSTRUCAO - Grau de instrução da candidata ou candidato na eleicao.",
        },
        nome_agrupado: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "agrupamento para a classificacao atualizada",
        },
        id_agrupado: {
            type: DataTypes.INTEGER,
            comment: "id do grau de instrucao de acordo com o nome agrupado",
        },
    }, {
        sequelize,
        comment: "tabela graus de instrucao existentes.",
        timestamps: false,
        underscored: true,
    })

module.exports = GrauDeInstrucao
