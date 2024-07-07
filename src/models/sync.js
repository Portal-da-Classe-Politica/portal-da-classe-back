const Genero = require("./Genero")
const Raca = require("./Raca")
const Abrangencia = require("./Abrangencia")
const UnidadeEleitoral = require("./UnidadeEleitoral")
const Eleicao = require("./Eleicao")
const Cargo = require("./Cargo")
const Candidato = require("./Candidato")
const NomeUrna = require("./NomeUrna")
const CandidatoEleicao = require("./CandidatoEleicao")
const Ocupacao = require("./Ocupacao")
const GrauDeInstrucao = require("./GrauDeInstrucao")
const SituacaoTurno = require("./SituacaoTurno")
const SituacaoCandidatura = require("./SituacaoCandidatura")
const SituacaoReeleicao = require("./SituacaoReeleicao")
const Partido = require("./Partido")
const MunicipiosVotacao = require("./MunicipiosVotacao")
const VotacaoCandidatoMunicipio = require("./VotacaoCandidatoMunicipio")
const CategoriaBensCandidato = require("./CategoriaBens")
const BensCandidatoEleicao = require("./BensCandidatoEleicao")
const DoacoesCandidatoEleicao = require("./DoacoesCandidatoEleicao")
const Doador = require("./Doador")
const FonteReceitas = require("./FonteReceitas")
const NaturezaReceita = require("./NaturezaReceita")
const OrigemReceitas = require("./OrigemReceitas")
const Categoria = require("./Categoria")
const Categoria2 = require("./Categoria2")

const syncModels = async () => {
    Candidato.belongsTo(Genero)
    Candidato.belongsTo(Raca)
    Candidato.belongsTo(Ocupacao, { targetKey: "id", foreignKey: "ultima_ocupacao_id" })
    Candidato.belongsTo(Eleicao, { targetKey: "id", foreignKey: "ultima_eleicao_id" })
    Genero.hasMany(Candidato)
    Raca.hasMany(Candidato)

    Ocupacao.belongsTo(Categoria, { targetKey: "id", foreignKey: "categoria_id" })
    Categoria.hasMany(Ocupacao)

    Ocupacao.belongsTo(Categoria2, { targetKey: "id", foreignKey: "categoria_2_id" })
    Categoria2.hasMany(Ocupacao)

    Abrangencia.hasMany(UnidadeEleitoral)
    UnidadeEleitoral.belongsTo(Abrangencia)

    Abrangencia.hasMany(Eleicao)
    Eleicao.belongsTo(Abrangencia)

    Cargo.belongsTo(Abrangencia)
    Abrangencia.hasMany(Cargo)

    Candidato.hasMany(NomeUrna)
    NomeUrna.belongsTo(Candidato, { targetKey: "id", foreignKey: "candidato_id" })

    Eleicao.hasMany(CandidatoEleicao, { targetKey: "id", foreignKey: "eleicao_id" })
    CandidatoEleicao.belongsTo(Eleicao)

    CandidatoEleicao.belongsTo(Ocupacao, { targetKey: "id", foreignKey: "ocupacao_id" })
    Ocupacao.hasMany(CandidatoEleicao)

    CandidatoEleicao.belongsTo(Cargo, { targetKey: "id", foreignKey: "cargo_id" })
    Cargo.hasMany(CandidatoEleicao)

    CandidatoEleicao.belongsTo(GrauDeInstrucao, { targetKey: "id", foreignKey: "grau_de_instrucao_id" })
    GrauDeInstrucao.hasMany(CandidatoEleicao)

    CandidatoEleicao.belongsTo(SituacaoTurno, { targetKey: "id", foreignKey: "situacao_turno_id" })
    SituacaoTurno.hasMany(CandidatoEleicao)

    CandidatoEleicao.belongsTo(UnidadeEleitoral, { targetKey: "id", foreignKey: "unidade_eleitoral_id" })
    UnidadeEleitoral.hasMany(CandidatoEleicao)

    CandidatoEleicao.belongsTo(SituacaoCandidatura, { targetKey: "id", foreignKey: "situacao_candidatura_id" })
    SituacaoCandidatura.hasMany(CandidatoEleicao)

    CandidatoEleicao.belongsTo(Partido, { targetKey: "id", foreignKey: "partido_id" })
    Partido.hasMany(CandidatoEleicao)

    CandidatoEleicao.belongsTo(Candidato, { targetKey: "id", foreignKey: "candidato_id" })
    Candidato.hasMany(CandidatoEleicao)

    CandidatoEleicao.belongsTo(NomeUrna, { targetKey: "id", foreignKey: "nome_urna_id" })
    NomeUrna.hasMany(CandidatoEleicao)

    CandidatoEleicao.belongsTo(SituacaoReeleicao, { targetKey: "id", foreignKey: "situacao_reeleicao_id" })
    SituacaoReeleicao.hasMany(CandidatoEleicao)

    VotacaoCandidatoMunicipio.belongsTo(CandidatoEleicao)
    CandidatoEleicao.hasMany(VotacaoCandidatoMunicipio)

    VotacaoCandidatoMunicipio.belongsTo(MunicipiosVotacao)
    MunicipiosVotacao.hasMany(VotacaoCandidatoMunicipio)

    BensCandidatoEleicao.belongsTo(CandidatoEleicao, { targetKey: "id", foreignKey: "candidato_eleicao_id" })
    CandidatoEleicao.hasMany(BensCandidatoEleicao)

    BensCandidatoEleicao.belongsTo(CategoriaBensCandidato, { targetKey: "id", foreignKey: "categoria_bem_id" })
    CategoriaBensCandidato.hasMany(BensCandidatoEleicao)

    DoacoesCandidatoEleicao.belongsTo(Doador, { as: "doadores", targetKey: "id", foreignKey: "doador_id" })
    Doador.hasMany(DoacoesCandidatoEleicao, { targetKey: "id", foreignKey: "doador_id" })

    DoacoesCandidatoEleicao.belongsTo(CandidatoEleicao, { targetKey: "id", foreignKey: "candidato_eleicao_id" })
    CandidatoEleicao.hasMany(DoacoesCandidatoEleicao)

    DoacoesCandidatoEleicao.belongsTo(NaturezaReceita, { targetKey: "id", foreignKey: "natureza_receita_id" })
    NaturezaReceita.hasMany(DoacoesCandidatoEleicao)

    DoacoesCandidatoEleicao.belongsTo(FonteReceitas, { targetKey: "id", foreignKey: "fonte_receita_id" })
    FonteReceitas.hasMany(DoacoesCandidatoEleicao)

    DoacoesCandidatoEleicao.belongsTo(OrigemReceitas, { targetKey: "id", foreignKey: "origem_receita_id" })
    OrigemReceitas.hasMany(DoacoesCandidatoEleicao)

    console.log("Sync Models fim")
}

syncModels().then(() => {
    console.log("Sync Models Associations")
})
