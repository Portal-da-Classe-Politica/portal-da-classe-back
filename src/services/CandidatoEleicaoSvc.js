const { Op, where, QueryTypes, Sequelize } = require("sequelize")
const CandidatoEleicaoModel = require("../models/CandidatoEleicao")
const EleicaoModel = require("../models/Eleicao")
const CandidatoModel = require("../models/Candidato")
const PartidoModel = require("../models/Partido")
const SituacaoCandidatoModel = require("../models/SituacaoCandidatura")
const CargoModel = require("../models/Cargo")
const nomeUrnaModel = require("../models/NomeUrna")
const votacaoCandidatoMunicipioModel = require("../models/VotacaoCandidatoMunicipio")
const municipiosVotacaoModel = require("../models/MunicipiosVotacao")
const GeneroModel = require("../models/Genero")
const SituacaoTurnoModel = require("../models/SituacaoTurno")


const parseFinder = (finder, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds) => {
    // UF, cidade
    if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
        finder.where.unidade_eleitoral_id = { [Op.in]: unidadesEleitoraisIds };
    }

    // is_elected
    if (isElected && isElected > 0) {
        const include = {
            model: SituacaoTurnoModel,
            required: true, //INNER JOIN
            where: {
                foi_eleito: Number(isElected) === 1
            },
            attributes: []
        }
        finder.include.push(include)
    }

    // partido
    if (partidos && partidos.length > 0) {
        finder.where.partido_id = { [Op.in]: partidos };
    }

    // cargo
    if (cargosIds && cargosIds.length > 0) {
        finder.where.cargo_id = { [Op.in]: cargosIds };
    }



    // categoria
    if (ocupacoesIds && ocupacoesIds.length > 0) {
        finder.where.ocupacao_id = { [Op.in]: ocupacoesIds }
    }

    return finder
}

const getLatestElectionsForSearch = async (candidateIds, skip, limit, electoralUnitIds, page) => {
    try {
        let whereClause = {}

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

const getCandidatesIdsByCandidateElectionsIds = async (ids, skip, limit, page, count) => {
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

const getLastAllElections = async (candidatoId) => {
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

const getCandidatesGenderByElection = async (elecionIds, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds) => {
    try {
        let finder = {
            where: {
                eleicao_id: { [Sequelize.Op.in]: elecionIds },
            },
            include: [
                {
                    model: CandidatoModel,
                    include: [
                        { model: GeneroModel, attributes: [] }
                    ], attributes: []
                },
            ],
            group: [
                [Sequelize.col("candidato.genero.nome_genero")]
            ],
            attributes: [
                [Sequelize.col("candidato.genero.nome_genero"), "genero"],
                [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('candidato.id'))), 'totalCandidatos']
            ],
            raw: true,
        }

        parseFinder(finder, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

        const candidateElection = await CandidatoEleicaoModel.findAll(finder)

        if (!candidateElection) {
            throw new Error("Resultado não encontrado")
        }

        // console.log(candidateElection)

        return candidateElection
    } catch (error) {
        console.error("Error getCandidatesGenderByElection:", error)
        throw error
    }
}

const getCandidatesByYear = async (elecionIds, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds) => {
    try {
        let finder = {
            where: {
                eleicao_id: { [Sequelize.Op.in]: elecionIds },
            },
            include: [
                {
                    model: CandidatoModel,
                    attributes: []
                },
                {
                    model: EleicaoModel,
                    attributes: []
                }
            ],
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('candidato.id')), 'totalCandidatos'],
                [Sequelize.col("eleicao.ano_eleicao"), "ano"],
            ],
            group: [
                "ano"
            ],
            raw: true,
        }

        parseFinder(finder, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

        const candidateElection = await CandidatoEleicaoModel.findAll(finder)

        if (!candidateElection) {
            throw new Error("Resultado não encontrado")
        }

        return candidateElection
    } catch (error) {
        console.error("Error getCandidatesByYear:", error)
        throw error
    }
}

//   // categoria (mandar as 3 para o gráfico de barrra)
//   if (cargo && cargo.length > 0){

//   }

module.exports = {
    getLastAllElections,
    getCandidatesIdsByCandidateElectionsIds,
    getLast5LastElectionsVotes,
    getLast5LastElections,
    getLatestElectionsForSearch,
    getLastElectionVotesByRegion,
    getCandidatesGenderByElection,
    getCandidatesByYear
}
