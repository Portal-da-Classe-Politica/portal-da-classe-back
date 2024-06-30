const { DataTypes, Model } = require("sequelize")

const SituacaoCandidatura = sequelize.define("situacao_candidatura", {
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "DS_SITUACAO_CANDIDATURA - Descrição da situação do registro da candidatura da candidata ou candidato. Pode assumir os valores: Apto (candidata ou candidato apto para ir para urna), Inapto (candidata ou candidato o inapto para ir para urna) e Cadastrado (registro de candidatura realizado, mas ainda não julgado)",
    },
    corrigida: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "nome da situacao corrigido",
    },
    dicotomica: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "nome da situacao dicotomico",
    },
    detalhada: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "nome da situacao detalhado",
    },
}, {
    sequelize,
    comment: "tabela das situacoes de candidatura existentes.",
    timestamps: false,
    underscored: true,
})

module.exports = SituacaoCandidatura
