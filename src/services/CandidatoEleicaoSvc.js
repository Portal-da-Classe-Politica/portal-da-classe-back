const { Op, where, QueryTypes } = require("sequelize")
const CandidatoEleicaoModel = require("../models/CandidatoEleicao")
const EleicaoModel = require("../models/Eleicao")
const CandidatoModel = require("../models/Candidato")
const PartidoModel = require("../models/Partido")
const SituacaoCandidatoModel = require("../models/SituacaoCandidatura")
const CargoModel = require("../models/Cargo")
const nomeUrnaModel = require("../models/NomeUrna")

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

module.exports = {
    getLatestElectionsForSearch,
}
