const {
    Op, where, QueryTypes, Sequelize,
} = require("sequelize")
const CandidatoEleicaoModel = require("../models/CandidatoEleicao")
const CandidatoModel = require("../models/Candidato")
const EleicaoModel = require("../models/Eleicao")
const SituacaoTurnoModel = require("../models/SituacaoTurno")
const votacaoCandidatoMunicipioModel = require("../models/VotacaoCandidatoMunicipio")

const getAnalyticCrossCriteria = async (params) => {
    console.log(params)
    try {
        let finder = {
            where: {
                eleicao_id: { [Sequelize.Op.in]: params.electionsIds },
                cargo_id: params.cargoId,
            },
            include: [
                {
                    model: CandidatoModel,
                    attributes: [],
                },
                {
                    model: EleicaoModel,
                    attributes: [],
                },
            ],
            attributes: [
                [Sequelize.col("eleicao.ano_eleicao"), "ano"],
            ],
            group: [
                "ano",
            ],
            raw: true,
        }
        parseByDimension(finder, params.dimension)
        const candidateElection = await CandidatoEleicaoModel.findAll(finder)

        if (!candidateElection) {
            throw new Error("Resultado não encontrado")
        }

        return candidateElection
    } catch (error) {
        console.error("Error getAnalyticCrossCriteria:", error)
        throw error
    } }

const parseByDimension = (finder, dimension) => {
    switch (dimension) {
    case "total_candidates":
        finder.attributes.push([Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("candidato.id"))), "total"])
        break
    case "elected_candidates":
        finder.attributes.push([Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("candidato.id"))), "total"])
        const includeST = {
            model: SituacaoTurnoModel,
            required: true, // INNER JOIN
            where: {
                foi_eleito: true,
            },
            attributes: [],
        }
        finder.include.push(includeST)
        break
    case "votes":
        finder.include.push({ model: votacaoCandidatoMunicipioModel, attributes: [] })
        finder.attributes.push([Sequelize.fn("SUM", Sequelize.col("votacao_candidato_municipios.quantidade_votos")), "total"])
        break
    default: break
    }
}

module.exports = {
    getAnalyticCrossCriteria,
}
