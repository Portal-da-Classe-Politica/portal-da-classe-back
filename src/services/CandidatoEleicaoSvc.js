const { Op, where, QueryTypes } = require("sequelize")
const CandidatoEleicaoModel = require("../models/CandidatoEleicao")
const EleicaoModel = require("../models/Eleicao")
const CandidatoModel = require("../models/Candidato")
const PartidoModel = require("../models/Partido")
const SituacaoCandidatoModel = require("../models/SituacaoCandidatura")
const CargoModel = require("../models/Cargo")
const nomeUrnaModel = require("../models/NomeUrna")
const votacaoCandidatoMunicipioModel = require("../models/VotacaoCandidatoMunicipio")
const municipiosVotacaoModel = require("../models/MunicipiosVotacao")

const getLatestElectionsForSearch = async (candidateIds, skip, limit, electoralUnitIds, page) => {
    try {
        let whereClause = { }

        if (!candidateIds && !electoralUnitIds) {
            throw new Error("É necessário informar ao menos um candidato ou uma unidade eleitoral para buscar resultados.")
        }

        // Array para armazenar todas as condições
        const conditions = []

        // Adiciona condição de candidatos se houver IDs fornecidos
        if (candidateIds && candidateIds.length > 0) {
            conditions.push({ [Op.or]: candidateIds })
        }

        // Adiciona condição de unidades eleitorais se houver IDs fornecidos
        if (electoralUnitIds && electoralUnitIds.length > 0) {
            conditions.push({ unidade_eleitoral_id: { [Op.in]: electoralUnitIds } })
        }

        if (conditions.length === 1) {
            whereClause = conditions[0]
            const { count, rows } = await CandidatoEleicaoModel.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: CandidatoModel,
                        attributes: ["id", "nome"],
                        include: [
                            {
                                model: EleicaoModel,
                                attributes: ["ano_eleicao"],
                            },
                        ],
                    },
                    {
                        model: PartidoModel,
                        attributes: ["sigla"],
                    },
                    {
                        model: SituacaoCandidatoModel,
                        attributes: ["nome"],
                    },
                    {
                        model: CargoModel,
                        attributes: ["nome_cargo"],
                    },
                    {
                        model: nomeUrnaModel,
                        attributes: ["nome_urna"],
                    },
                ],
                order: [
                    [sequelize.col("candidato.nome"), "ASC"],
                ],
                attributes: [
                    ["id", "lastCandidatoEleicaoId"],
                    [sequelize.col("partido.sigla"), "partido"],
                    [sequelize.col("candidato.nome"), "nomeCandidato"],
                    [sequelize.col("candidato.id"), "candidatoId"],
                    [sequelize.col("candidato.eleicao.ano_eleicao"), "ultimaEleicao"],
                    [sequelize.col("situacao_candidatura.nome"), "situacao"],
                    [sequelize.col("cargo.nome_cargo"), "cargo"],
                    [sequelize.col("nome_urna.nome_urna"), "nome_urna"],

                ],
                limit,
                offset: skip,
                raw: true,
            })

            // Limpar resultados duplicados
            const cleanedResults = rows.map((result) => {
                return {
                    lastCandidatoEleicaoId: result.lastCandidatoEleicaoId,
                    partido: result.partido,
                    nomeCandidato: result.nomeCandidato,
                    situacao: result.situacao,
                    cargo: result.cargo,
                    nomeUrna: result.nome_urna,
                    ultimaEleicao: result.ultimaEleicao,
                    candidatoId: result.candidatoId,
                }
            })

            return {
                totalResults: count,
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                results: cleanedResults,
            }
        }
        const firstResult = await CandidatoEleicaoModel.findAll({
            where: conditions[0],
            attributes: [
                "id",
            ],
            raw: true,
        })

        if (!firstResult || firstResult.length === 0) {
            return {
                totalResults: 0,
                currentPage: parseInt(page),
                totalPages: 0,
                results: [],
            }
        }
        whereClause[Op.and] = {
            id: { [Op.in]: (firstResult.map((result) => result.id)) },
            unidade_eleitoral_id: { [Op.in]: electoralUnitIds },
        }

        const { count, rows } = await CandidatoEleicaoModel.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: CandidatoModel,
                    attributes: ["id", "nome"],
                    include: [
                        {
                            model: EleicaoModel,
                            attributes: ["ano_eleicao"],
                        },
                    ],
                },
                {
                    model: PartidoModel,
                    attributes: ["sigla"],
                },
                {
                    model: SituacaoCandidatoModel,
                    attributes: ["nome"],
                },
                {
                    model: CargoModel,
                    attributes: ["nome_cargo"],
                },
                {
                    model: nomeUrnaModel,
                    attributes: ["nome_urna"],
                },
            ],
            order: [
                [sequelize.col("candidato.nome"), "ASC"],
            ],
            attributes: [
                ["id", "lastCandidatoEleicaoId"],
                [sequelize.col("partido.sigla"), "partido"],
                [sequelize.col("candidato.nome"), "nomeCandidato"],
                [sequelize.col("candidato.id"), "candidatoId"],
                [sequelize.col("candidato.eleicao.ano_eleicao"), "ultimaEleicao"],
                [sequelize.col("situacao_candidatura.nome"), "situacao"],
                [sequelize.col("cargo.nome_cargo"), "cargo"],
                [sequelize.col("nome_urna.nome_urna"), "nome_urna"],

            ],
            limit,
            offset: skip,
            raw: true,
        })

        // Limpar resultados duplicados
        const cleanedResults = rows.map((result) => {
            return {
                lastCandidatoEleicaoId: result.lastCandidatoEleicaoId,
                partido: result.partido,
                nomeCandidato: result.nomeCandidato,
                situacao: result.situacao,
                cargo: result.cargo,
                nomeUrna: result.nome_urna,
                ultimaEleicao: result.ultimaEleicao,
                candidatoId: result.candidatoId,
            }
        })

        return {
            totalResults: count,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            results: cleanedResults,
        }

        // Consulta para obter os resultados paginados
    } catch (error) {
        console.error("Error fetching latest elections:", error)
        throw error
    }
}

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
                votos: parseInt(r.votos),
            }
        })
        return parsedResults
    } catch (error) {
        console.error("Error fetching votes by region:", error)
        throw error
    }
}

const getLast5LastElections = async (candidatoId) => {
    try {
        const candidateElection = await CandidatoEleicaoModel.findAll({
            where: {
                candidato_id: candidatoId,
            },
            include: [
                {
                    model: EleicaoModel,
                    where: {
                        turno: 1,
                    },
                    attributes: ["ano_eleicao", "id"],
                },
            ],
            order: [
                [sequelize.col("eleicao.ano_eleicao"), "DESC"],
            ],
            limit: 5,
            raw: true,
            attributes: ["id", [sequelize.col("eleicao.id"), "eleicao_id"], [sequelize.col("eleicao.ano_eleicao"), "ano_eleicao"]],
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
                    attributes: ["ano_eleicao"],
                },
            ],
            raw: true,
            group: ["candidato_eleicao_id", "eleicao.ano_eleicao", "candidato_eleicao.id"],
            attributes: [[sequelize.col("eleicao.ano_eleicao"), "ano_eleicao"]],
        })
        if (!candidateElection) {
            throw new Error("Candidato não encontrado")
        }
        const parsedResults = candidateElection.map((r) => {
            return {
                ano_eleicao: r["eleicao.ano_eleicao"],
                total_votos: parseInt(r["votacao_candidato_municipios.total_votos"]),
            }
        })
        return parsedResults
    } catch (error) {
        console.error("Error fetching votes by region:", error)
        throw error
    }
}

const getCandidatesIdsByNomeUrnaOrName = async (nomeUrnaOrName, skip, limit, electoralUnitIds, page) => {
    const finder = {
        include: [
            {
                model: nomeUrnaModel,
                required: true,
                attributes: [],
                where: {
                    [Op.or]: [
                        {
                            nome_urna: {
                                [Op.iLike]: `%${nomeUrnaOrName}%`,
                            },
                        },
                        {
                            nome_candidato: {
                                [Op.iLike]: `%${nomeUrnaOrName}%`,
                            },
                        },
                    ],
                },
            },
        ],
        raw: true,
        limit,
        offset: skip,
        order: [[sequelize.col("nome_urna.nome_candidato"), "ASC"]],
        attributes: ["id"],

    }

    if (electoralUnitIds && electoralUnitIds.length > 0) {
        console.log("electoralUnitIds", electoralUnitIds)
        finder.where = {
            unidade_eleitoral_id: {
                [Op.in]: electoralUnitIds,
            },
        }
    }

    const { count, rows } = await CandidatoEleicaoModel.findAndCountAll(finder)
    if (!rows || rows.length === 0) return new Error("Nenhum candidato encontrado")

    const ids = rows.map((candidate) => candidate.id)

    const finalResult = await CandidatoEleicaoModel.findAll({
        where: {
            id: {
                [Op.in]: ids,
            },
        },
        include: [
            {
                model: CandidatoModel,
                attributes: ["id", "nome"],
                include: [
                    {
                        model: EleicaoModel,
                        attributes: ["ano_eleicao"],
                    },
                ],
            },
            {
                model: PartidoModel,
                attributes: ["sigla"],
            },
            {
                model: SituacaoCandidatoModel,
                attributes: ["nome"],
            },
            {
                model: CargoModel,
                attributes: ["nome_cargo"],
            },
            {
                model: nomeUrnaModel,
                attributes: ["nome_urna"],
            },
        ],
        order: [
            [sequelize.col("candidato.nome"), "ASC"],
        ],
        attributes: [
            ["id", "lastCandidatoEleicaoId"],
            [sequelize.col("partido.sigla"), "partido"],
            [sequelize.col("candidato.nome"), "nomeCandidato"],
            [sequelize.col("candidato.id"), "candidatoId"],
            [sequelize.col("candidato.eleicao.ano_eleicao"), "ultimaEleicao"],
            [sequelize.col("situacao_candidatura.nome"), "situacao"],
            [sequelize.col("cargo.nome_cargo"), "cargo"],
            [sequelize.col("nome_urna.nome_urna"), "nome_urna"],

        ],
        raw: true,
    })

    // Limpar resultados duplicados
    const cleanedResults = finalResult.map((result) => {
        return {
            lastCandidatoEleicaoId: result.lastCandidatoEleicaoId,
            partido: result.partido,
            nomeCandidato: result.nomeCandidato,
            situacao: result.situacao,
            cargo: result.cargo,
            nomeUrna: result.nome_urna,
            ultimaEleicao: result.ultimaEleicao,
            candidatoId: result.candidatoId,
        }
    })

    return {
        totalResults: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        results: cleanedResults,
    }
}

module.exports = {
    getCandidatesIdsByNomeUrnaOrName,
    getLast5LastElectionsVotes,
    getLast5LastElections,
    getLatestElectionsForSearch,
    getLastElectionVotesByRegion,
}
