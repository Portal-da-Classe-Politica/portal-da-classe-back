const { DataTypes, Model } = require("sequelize")

const CandidatoEleicao = sequelize.define("candidato_eleicao",
    {
        idade_data_da_posse: {
            type: DataTypes.INTEGER,
            comment: "NR_IDADE_DATA_POSSE - Idade da candidata ou candidato na data da posse. A idade é calculada com base na data da posse da referida candidata ou candidato para o cargo e unidade eleitoral constantes no arquivo de vagas.",
        },
        coligacao: {
            type: DataTypes.STRING,
            comment: "DS_COMPOSICAO_COLIGACAO - Composição da coligação da qual a candidata ou candidato pertence. Observação: Coligação é a união de dois ou mais partidos a fim de disputarem eleições. A informação da coligação no arquivo está composta pela concatenação das siglas dos partidos intercarladas com o símbolo /",
        },
        despesa_campanha: {
            type: DataTypes.DOUBLE,
            comment: "VR_DESPESA_MAX_CAMPANHA - Valor máximo, em reais, de despesas de campanha declarada pelo partido para aquele candidato.",
        },
        numero_sequencial: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "SQ_CANDIDATO - Número sequencial da candidata ou candidato, gerado internamente pelos sistemas eleitorais para cada eleição. Observações: 1) Este sequencial pode ser utilizado como chave para o cruzamento de dados. 2) Não é o número de campanha da candidata ou candidato",
        },
    }, {
        sequelize,
        comment: "tabela utilizada para relacionar as características do candidato em cada eleicao",
        timestamps: false,
        underscored: true,
    })

module.exports = CandidatoEleicao
