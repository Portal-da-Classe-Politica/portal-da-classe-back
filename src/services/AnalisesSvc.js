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
const RacaModel = require("../models/Raca")
const GrauDeInstrucaoModel = require("../models/GrauDeInstrucao")
const SituacaoTurnoModel = require("../models/SituacaoTurno")
const votacaoCandidatoMunicipioModel = require("../models/VotacaoCandidatoMunicipio")
const { ageBuckets } = require("../enums/ageFilters")

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
    if (params.ageBucketIds && params.ageBucketIds.length > 0) {
        // Convert to numbers for comparison
        const ageBucketIdsAsNumbers = params.ageBucketIds.map((id) => parseInt(id))
        const selectedBuckets = ageBuckets.filter((bucket) => ageBucketIdsAsNumbers.includes(bucket.id))

        if (selectedBuckets.length > 0) {
            const ageConditions = selectedBuckets.map((bucket) => ({
                [Op.and]: [
                    { idade_data_da_posse: { [Op.gte]: bucket.min } },
                    { idade_data_da_posse: { [Op.lte]: bucket.max } },
                ],
            }))

            finder.where[Op.or] = ageConditions

            const caseStatement = selectedBuckets.map((bucket) => `WHEN candidato_eleicao.idade_data_da_posse BETWEEN ${bucket.min} AND ${bucket.max} THEN '${bucket.label}'`).join(" ")

            finder.attributes.push([
                Sequelize.literal(`CASE ${caseStatement} ELSE NULL END`),
                "faixa_etaria",
            ])
            finder.group.push("faixa_etaria")
        }
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
        }
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
    if (params.racesIds && params.racesIds.length > 0) {
        if (!finder.include[0].where){
            finder.include[0].where = {}
            finder.include[0].where.raca_id = { [Op.in]: params.racesIds }
        } else {
            finder.include[0].where.raca_id = { [Op.in]: params.racesIds }
        }
        const racaInclude = {
            model: RacaModel,
            attributes: [],
        }
        if (!finder.include[0].include) {
            finder.include[0].include = [racaInclude]
        } else {
            finder.include[0].include.push(racaInclude)
        }
        finder.attributes.push([Sequelize.col("candidato.raca.nome"), "raca"])
        finder.group.push("raca")
    }
    if (params.instructionsDegreesIds && params.instructionsDegreesIds.length > 0) {
        finder.where.grau_de_instrucao_id = { [Op.in]: params.instructionsDegreesIds }
        const grauInstrucaoInclude = {
            model: GrauDeInstrucaoModel,
            attributes: [],
        }
        finder.include.push(grauInstrucaoInclude)
        finder.attributes.push([Sequelize.col("grau_de_instrucao.nome_agrupado"), "instrucao"])
        finder.group.push("instrucao")
    }
}

const getAnalyticCrossCriteria = async (params) => {
    try {
        let finder = {
            where: {
                eleicao_id: { [Sequelize.Op.in]: params.electionsIds },
                cargo_id: Array.isArray(params.cargoId) 
                    ? { [Sequelize.Op.in]: params.cargoId }  // Se for array, usa IN
                    : params.cargoId,  // Se for número único, usa igualdade
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
            order: [
                ["ano", "ASC"],
            ],
            raw: true,
        }
        parseByDimension(finder, params.dimension)
        parseCrossCriteria(finder, params)

        if (params.electoralUnitiesIds && params.electoralUnitiesIds.length > 0) {
            finder.where.unidade_eleitoral_id = { [Op.in]: params.electoralUnitiesIds }
        }

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
        finder.attributes.push(
            [Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("candidato.id"))), "total"],
            [Sequelize.col("situacao_turno.foi_eleito"), "status_eleicao"],
        )

        const includeST = {
            model: SituacaoTurnoModel,
            required: true, // INNER JOIN
            attributes: [], // Adiciona a coluna foi_eleito
        }
        finder.include.push(includeST)
        finder.group.push("situacao_turno.foi_eleito") // Agrupa por foi_eleito
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
