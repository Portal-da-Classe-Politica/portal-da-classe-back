const { DataTypes, Model } = require("sequelize")

const SituacaoReeleicao = sequelize.define("situacao_reeleicao",
    {

        situacao_reeleicao: {
            type: DataTypes.STRING,
            comment: "ST_REELEICAO - Indica se a candidata ou candidato está concorrendo ou não à reeleição. Pode assumir os valores: S - Sim e N - Não.  Informação autodeclarada pela candidata ou candidato. Observação: Reeleição é a renovação do mandato para o mesmo cargo eletivo, por mais um período, na mesma circunscrição eleitoral na qual a representante ou o representante, no pleito imediatamente anterior, se elegeu. Pelo sistema eleitoral brasileiro, o presidente da República, os governadores de estado e os prefeitos podem ser reeleitos para um único período subsequente, o que se aplica também ao vice-presidente da República, aos vice-governadores e aos vice-prefeitos. Já os parlamentares (senadores, deputados federais e estaduais/distritais e vereadores) podem se reeleger ilimitadas vezes. A possibilidade da reeleição compreende algumas regras mais específicas detalhadas no sistema eleitoral brasileiro",
        },
    }, {
        sequelize,
        timestamps: false,
        underscored: true,

    })

module.exports = SituacaoReeleicao
