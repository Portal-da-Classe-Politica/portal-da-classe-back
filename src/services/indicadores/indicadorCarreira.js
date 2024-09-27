const {
    Op, where, QueryTypes, Sequelize,
} = require("sequelize")
const CandidatoEleicaoModel = require("../../models/CandidatoEleicao")
const EleicaoModel = require("../../models/Eleicao")
const CandidatoModel = require("../../models/Candidato")
const PartidoModel = require("../../models/Partido")
const SituacaoCandidatoModel = require("../../models/SituacaoCandidatura")
const CargoModel = require("../../models/Cargo")
const nomeUrnaModel = require("../../models/NomeUrna")
const votacaoCandidatoMunicipioModel = require("../../models/VotacaoCandidatoMunicipio")
const municipiosVotacaoModel = require("../../models/MunicipiosVotacao")
const BensCandidatoEleicao = require("../../models/BensCandidatoEleicao")
const GeneroModel = require("../../models/Genero")
const SituacaoTurnoModel = require("../../models/SituacaoTurno")
const ocupacaoModel = require("../../models/Ocupacao")
const categoriaModel = require("../../models/Categoria")
const categoria2Model = require("../../models/Categoria2")
const doacoesCandidatoEleicaoModel = require("../../models/DoacoesCandidatoEleicao")
const unidadeEleitoralSvc = require("../UnidateEleitoralService")
const { fatoresDeCorreção } = require("../../utils/ipca")

const getElectionsByYearInterval = async (initialYear, finalYear, round = 1) => {
    try {
        const election = await EleicaoModel.findAll({
            where: {
                ano_eleicao: {
                    [Sequelize.Op.gte]: initialYear,
                    [Sequelize.Op.lte]: finalYear,
                },
                turno: round,
            },
            attributes: ["id", "ano_eleicao"],
            raw: true,
        })
        return election
    } catch (error) {
        console.error("Error fetching election:", error)
        throw error
    }
}
/**
 * @name Taxa de Renovação Líquida
 * @description TRL = (D / (D + R)) * 100 - D = é o número de membros que tentaram a reeleição e foram derrotados - R = é o número de membros que tentaram a reeleição e foram reeleitos
 * @param {*} cargoId
 * @param {*} initialYear
 * @param {*} finalYear
 * @param {*} unidadesEleitorais
 * @returns
 */
const getTaxaDeRenovacaoLiquida = async (cargoId, initialYear, finalYear, unidadesEleitorais) => {
    const [elections, electedSituacaoTurnos, notElectedSituacaoTurnos] = await Promise.all([
        getElectionsByYearInterval(initialYear, finalYear),
        SituacaoTurnoModel.findAll({ where: { foi_eleito: true } }),
        SituacaoTurnoModel.findAll({ where: { foi_eleito: false } }),
    ])
    const electionsIds = elections.map((election) => election.id)

    let filterUnities
    if (unidadesEleitorais && unidadesEleitorais.length > 0) {
        filterUnities = {
            [Op.in]: unidadesEleitorais,
        }
    }

    const [totalElectedCandidatesReelected, failedReelectedCandidates] = await Promise.all([
        CandidatoEleicaoModel.findAll({
            attributes: [
                "eleicao_id",
                [Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("candidato_eleicao.candidato_id"))), "total"],
            ],
            where: {
                eleicao_id: { [Op.in]: electionsIds },
                cargo_id: cargoId,
                situacao_turno_id: { [Op.in]: electedSituacaoTurnos.map((situacaoTurno) => situacaoTurno.id) },
                situacao_reeleicao_id: 3,
                situacao_candidatura_id: { [Op.in]: [1, 16] },
                ...(filterUnities && { unidade_eleitoral_id: filterUnities }),
            },
            group: ["eleicao_id"],
            raw: true,
        }),
        CandidatoEleicaoModel.findAll({
            attributes: [
                "eleicao_id",
                [Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("candidato_eleicao.candidato_id"))), "total"],
            ],
            where: {
                eleicao_id: { [Op.in]: electionsIds },
                cargo_id: cargoId,
                situacao_turno_id: { [Op.in]: notElectedSituacaoTurnos.map((situacaoTurno) => situacaoTurno.id) },
                situacao_reeleicao_id: 3,
                situacao_candidatura_id: { [Op.in]: [1, 16] },
                ...(filterUnities && { unidade_eleitoral_id: filterUnities }),
            },
            group: ["eleicao_id"],
            raw: true,
        }),
    ])

    // TRL DEVE SER CALCULADO POR ANO
    // TRL = (D / (D + R)) * 100
    // D = é o número de membros que tentaram a reeleição e foram derrotados
    // R = é o número de membros que tentaram a reeleição e foram reeleitos
    const TRLByYear = elections.map((election) => {
        const electedCandidatesByElection = totalElectedCandidatesReelected.find((electedCandidate) => electedCandidate.eleicao_id === election.id)?.total || 0
        const notElectedCandidatesByElection = failedReelectedCandidates.find((notElectedCandidate) => notElectedCandidate.eleicao_id === election.id)?.total || 0
        // console.log({ electedCandidatesByElection, notElectedCandidatesByElection })
        if (electedCandidatesByElection && notElectedCandidatesByElection) {
            const TRL = (parseInt(notElectedCandidatesByElection) / (parseInt(electedCandidatesByElection) + parseInt(notElectedCandidatesByElection))) * 100

            const object = {
                election_id: election.id,
                ano: election.ano_eleicao,
                total: TRL,
            }
            return object
        }
    }).filter((item) => item)

    return TRLByYear
}

/**
 * @name Taxa de Reeleição
 * @description TR = REELEITOS / TOTAL DE CANDIDATOS QUE TENTARAM REELEIÇÃO
 * @param {*} cargoId
 * @param {*} initialYear
 * @param {*} finalYear
 * @param {*} unidadesEleitorais
 * @returns
 */
const getTaxaReeleicao = async (cargoId, initialYear, finalYear, unidadesEleitorais) => {
    const [elections, electedSituacaoTurnos] = await Promise.all([
        getElectionsByYearInterval(initialYear, finalYear),
        SituacaoTurnoModel.findAll({ where: { foi_eleito: true } }),
    ])
    const electionsIds = elections.map((election) => election.id)

    let filterUnities
    if (unidadesEleitorais && unidadesEleitorais.length > 0) {
        filterUnities = {
            [Op.in]: unidadesEleitorais,
        }
    }

    const [totalElectedCandidatesReelected, totalCandidatesTryingReelection] = await Promise.all([
        CandidatoEleicaoModel.findAll({
            attributes: [
                "eleicao_id",
                [Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("candidato_eleicao.candidato_id"))), "total"],
            ],
            where: {
                eleicao_id: { [Op.in]: electionsIds },
                cargo_id: cargoId,
                situacao_turno_id: { [Op.in]: electedSituacaoTurnos.map((situacaoTurno) => situacaoTurno.id) },
                situacao_candidatura_id: { [Op.in]: [1, 16] },//candidaturas validas
                situacao_reeleicao_id: 3, // tentou reeleição
                ...(filterUnities && { unidade_eleitoral_id: filterUnities }),
            },
            group: ["eleicao_id"],
            raw: true,
        }),
        CandidatoEleicaoModel.findAll({
            attributes: [
                "eleicao_id",
                [Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("candidato_eleicao.candidato_id"))), "total"],
            ],
            where: {
                eleicao_id: { [Op.in]: electionsIds },
                cargo_id: cargoId,
                situacao_candidatura_id: { [Op.in]: [1, 16] },
                situacao_reeleicao_id: 3, // tentou reeleição
                ...(filterUnities && { unidade_eleitoral_id: filterUnities }),
            },
            group: ["eleicao_id"],
            raw: true,
        }),
    ])

    // TR DEVE SER CALCULADO POR ANO
    // TR = REELEITOS / TOTAL DE CANDIDATOS QUE TENTARAM REELEIÇÃO
    const TRByYear = elections.map((election) => {
        const electedCandidatesByElection = totalElectedCandidatesReelected.find((electedCandidate) => electedCandidate.eleicao_id === election.id)?.total || 0
        const totalCandidatesTryingReelectionByElection = totalCandidatesTryingReelection.find((candidate) => candidate.eleicao_id === election.id)?.total || 0

        if (electedCandidatesByElection && totalCandidatesTryingReelectionByElection) {
            //console.log({ electedCandidatesByElection, totalCandidatesTryingReelectionByElection, ano: election.ano_eleicao })
            const TR = (parseInt(electedCandidatesByElection) / parseInt(totalCandidatesTryingReelectionByElection))

            const object = {
                election_id: election.id,
                ano: election.ano_eleicao,
                total: TR,
            }
            //console.log({ object })
            return object
        }
    }).filter((item) => item)

    return TRByYear
}

module.exports = {
    getTaxaDeRenovacaoLiquida,
    getTaxaReeleicao,
}
