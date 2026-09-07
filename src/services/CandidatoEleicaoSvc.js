const { Op } = require("sequelize")
const CandidatoEleicaoModel = require("../models/CandidatoEleicao")
const EleicaoModel = require("../models/Eleicao")
const votacaoCandidatoMunicipioModel = require("../models/VotacaoCandidatoMunicipio")
const municipiosVotacaoModel = require("../models/MunicipiosVotacao")

const getLastElectionVotesByRegion = async (candidatoId, eleicaoId) => {
    try {
        const candidateElection = await CandidatoEleicaoModel.findOne({
            where: {
                candidato_id: candidatoId,
                eleicao_id: eleicaoId,
            },
            raw: true,
            attributes: ["id"],
        })

        if (!candidateElection) {
            throw new Error("Candidato não encontrado")
        }
        const result = await votacaoCandidatoMunicipioModel.findAll({
            where: {
                candidato_eleicao_id: candidateElection.id,
            },
            include: [
                {
                    model: municipiosVotacaoModel,
                    attributes: ["nome", "codigo_ibge"],
                },
            ],
            attributes: [
                [sequelize.col("municipios_votacao.nome"), "municipios_votacao.nome"],
                [sequelize.col("municipios_votacao.codigo_ibge"), "municipios_votacao.codigo_ibge"],
                [sequelize.col("municipios_votacao.estado"), "municipios_votacao.estado"],
                ["quantidade_votos", "votos"],
            ],
            order: [
                [sequelize.col("votos"), "DESC"],
            ],
            raw: true,
        })
        if (!result || result.length === 0) {
            throw new Error("Nenhum voto encontrado")
        }
        const parsedResults = result.map((r) => {
            return {
                municipio: r["municipios_votacao.nome"],
                codigo_ibge: r["municipios_votacao.codigo_ibge"],
                estado: r["municipios_votacao.estado"],
                votos: parseInt(r.votos),
            }
        })
        // console.log(parsedResults)
        return parsedResults
    } catch (error) {
        console.error("Error fetching votes by region:", error)
        throw error
    }
}

const getLast5LastElections = async (candidatoId, limit = 5) => {
    try {
        const candidateElection = await CandidatoEleicaoModel.findAll({
            where: {
                candidato_id: candidatoId,
                situacao_candidatura_id: { [Op.in]: [1, 16] },
            },
            include: [
                {
                    model: EleicaoModel,
                    attributes: ["ano_eleicao", "id"],
                    where: {
                        turno: { [Op.in]: [1, 2] },
                    },
                },
            ],
            order: [
                [sequelize.col("eleicao.ano_eleicao"), "DESC"],
            ],
            limit,
            raw: true,
            attributes: ["id", [sequelize.col("eleicao.id"), "eleicao_id"],
                [sequelize.col("eleicao.ano_eleicao"), "ano_eleicao"],
            ],
        })

        if (!candidateElection) {
            throw new Error("Candidato não encontrado")
        }

        // console.log(candidateElection)

        return candidateElection
    } catch (error) {
        console.error("Error fetching votes by region:", error)
        throw error
    }
}

const getLast5LastElectionsVotes = async (candidateElectionsIds) => {
    try {
        const candidateElection = await CandidatoEleicaoModel.findAll({
            where: {
                id: { [Op.in]: candidateElectionsIds },
            },
            include: [
                {
                    model: votacaoCandidatoMunicipioModel,
                    attributes: [[sequelize.fn("SUM", sequelize.col("quantidade_votos")), "total_votos"]],
                    group: ["candidato_eleicao_id"],
                },
                {
                    model: EleicaoModel,
                    attributes: ["ano_eleicao", "turno"],
                },
            ],
            raw: true,
            group: ["candidato_eleicao_id", "eleicao.ano_eleicao", "candidato_eleicao.id", "eleicao.turno"],
            order: [
                [sequelize.col("eleicao.ano_eleicao"), "ASC"],
                [sequelize.col("eleicao.turno"), "ASC"],
            ],
            attributes: [[sequelize.col("eleicao.ano_eleicao"), "ano_eleicao"],
                [sequelize.col("eleicao.turno"), "turno"],
            ],
        })
        if (!candidateElection) {
            throw new Error("Candidato não encontrado")
        }
        const parsedResults = candidateElection.map((r) => {
            return {
                ano_eleicao: `${r["eleicao.ano_eleicao"]}${r["eleicao.turno"] ? " - " + r["eleicao.turno"] + "º turno" : ""}`,
                total_votos: parseInt(r["votacao_candidato_municipios.total_votos"]),
            }
        })
        return parsedResults
    } catch (error) {
        console.error("Erro buscando ultimas eleicoes do candidato", error)
        throw error
    }
}

module.exports = {
    getLastElectionVotesByRegion,
    getLast5LastElections,
    getLast5LastElectionsVotes,
}
