const {
    Op, where, QueryTypes, Sequelize,
} = require("sequelize")
const CandidatoEleicaoModel = require("../models/CandidatoEleicao")
const CandidatoModel = require("../models/Candidato")
const EleicaoModel = require("../models/Eleicao")
const PartidoModel = require("../models/Partido")
const OcupacaoModel = require("../models/Ocupacao")
const categoriaModel = require("../models/Categoria")
const generoModel = require("../models/Genero")
const SituacaoTurnoModel = require("../models/SituacaoTurno")
const votacaoCandidatoMunicipioModel = require("../models/VotacaoCandidatoMunicipio")

const parseCrossCriteria = (finder, params) => {
    if (params.partidosIds && params.partidosIds.length > 0) {
        finder.where.partido_id = { [Op.in]: params.partidosIds }
        const partidoInclude = {
            model: PartidoModel,
            attributes: [],
        }
        finder.include.push(partidoInclude)
        finder.attributes.push([Sequelize.col("partido.nome_atual"), "partido"])
        finder.group.push("partido")
    }
    if (params.ocupationsIds && params.ocupationsIds.length > 0) {
        finder.where.ocupacao_id = { [Op.in]: params.ocupationsIds }
        const ocupacaoInclude = {
            model: OcupacaoModel,
            attributes: [],
            include: [
                {
                    model: categoriaModel,
                    attributes: [],
                },
            ],
        }
        finder.include.push(ocupacaoInclude)
        finder.attributes.push([Sequelize.col("ocupacao.categorium.nome"), "ocupacao"])
        finder.group.push("ocupacao")
    }
    if (params.gendersIds && params.gendersIds.length > 0) {
        if (!finder.include[0].where){
            finder.include[0].where = {}
            finder.include[0].where.genero_id = { [Op.in]: params.gendersIds }
        }// } else {
        //     finder.include[0].where.genero_id = { [Op.in]: params.gendersIds }
        // }

        const generoInclude = {
            model: generoModel,
            attributes: [],
        }
        if (!finder.include[0].include) {
            finder.include[0].include = []
            finder.include[0].include.push(generoInclude)
        }
        finder.attributes.push([Sequelize.col("candidato.genero.nome_genero"), "genero"])
        finder.group.push("genero")
    }
}

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
        parseCrossCriteria(finder, params)
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
