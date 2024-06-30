const { DataTypes, Model } = require("sequelize")

const UnidadeEleitoral = sequelize.define("unidade_eleitoral",
    {
        sigla_unidade_eleitoral: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "SG_UE - Sigla da Unidade Eleitoral em que a candidata ou o candidato concorre na eleição. A Unidade Eleitoral representa a Unidade da Federação ou o Município em que a candidata ou o candidato concorre na eleição e é relacionada à abrangência territorial desta candidatura. Em caso de abrangência Federal (cargo de Presidente e VicePresidente) a sigla é BR. Em caso de abrangência Estadual (cargos de Governador, Vice-Governador, Senador, Deputado Federal, Deputado Estadual e Deputado Distrital) a sigla é a UF da candidatura. Em caso de abrangência Municipal (cargos de Prefeito, Vice-Prefeito e Vereador) é o código TSE de identificação do município da candidatura.",
        },
        nome: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "NM_UE - nome da Unidade Eleitoral em que a candidata ou o candidato concorre na eleição. A Unidade Eleitoral representa a Unidade da Federação ou o Município em que a candidata ou o candidato concorre na eleição e é relacionada à abrangência territorial desta candidatura. Em caso de abrangência Federal (cargo de Presidente e VicePresidente) a sigla é BR. Em caso de abrangência Estadual (cargos de Governador, Vice-Governador, Senador, Deputado Federal, Deputado Estadual e Deputado Distrital) a sigla é a UF da candidatura. Em caso de abrangência Municipal (cargos de Prefeito, Vice-Prefeito e Vereador) é o código TSE de identificação do município da candidatura.",
        },
        sigla_unidade_federacao: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "SG_UF - Sigla da Unidade da Federação em que ocorreu a eleição..",
        },

    }, {
        sequelize,
        comment: "tabela das unidades eleitorais existentes.",
        timestamps: false,
        underscored: true,
    })

module.exports = UnidadeEleitoral
