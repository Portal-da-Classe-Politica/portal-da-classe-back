const candidatoModel = require("../models/Candidato")
const nomeUrnaModel = require("../models/NomeUrna")
const eleicaoModel = require("../models/Eleicao")
const candidatoEleicaoModel = require("../models/CandidatoEleicao")
const grauDeInstrucaoModel = require("../models/GrauDeInstrucao")
const generoModel = require("../models/Genero")
const partidoModel = require("../models/Partido")
const racaModel = require("../models/Raca")
const ocupacaoModel = require("../models/Ocupacao")
const bensCandidatoEleicaoModel = require("../models/BensCandidatoEleicao")
const cargoModel = require("../models/Cargo")
const unidadesEleitoraisModel = require("../models/UnidadeEleitoral")
const situacaoCandidaturaModel = require("../models/SituacaoCandidatura")
const { Sequelize } = require("sequelize")

const get10CandidatesSortedByName = async (skip, limit) => {
    try {
        const { count, rows } = await candidatoModel.findAndCountAll({
            order: [
                ["nome", "ASC"],
            ],
            attributes: ["id", "ultima_eleicao_id"],
            "limit": limit,
            offset: skip,
            raw: true,

        })

        if (!rows || rows.length === 0) return new Error("Nenhum candidato encontrado")
        const currentPage = Math.floor(skip / limit) + 1
        const totalPages = Math.ceil(count / limit)
        const totalResults = count
        const filteredCandidates = rows.map((c) => {
            return {
                candidato_id: c.id,
                eleicao_id: c.ultima_eleicao_id,
            }
        })

        const result = {
            totalResults,
            currentPage,
            totalPages,
            results: filteredCandidates,
        }

        return result
    } catch (error) {
        console.error("Error fetching candidates:", error)
        throw error
    }
}

const getCandidateDetailById = async (candidatoId) => {
    try {
        const candidate = await candidatoModel.findOne({
            where: {
                id: candidatoId,
            },
            include: [
                {
                    model: eleicaoModel,
                    attributes: ["ano_eleicao"],
                    include: [
                        {
                            model: candidatoEleicaoModel,
                            where: {
                                candidato_id: candidatoId,
                            },
                            include: [
                                {
                                    model: partidoModel,
                                },
                                {
                                    model: grauDeInstrucaoModel,
                                    attributes: ["nome_agrupado"],
                                },
                                {
                                    model: bensCandidatoEleicaoModel,

                                    attributes: [
                                        [sequelize.fn("sum", Sequelize.col("valor")), "totalValor"],
                                    ],
                                },
                                {
                                    model: cargoModel,
                                    attributes: ["nome_cargo"],
                                },
                                {
                                    model: unidadesEleitoraisModel,
                                    attributes: ["nome", "sigla_unidade_federacao"],
                                },
                                {
                                    model: situacaoCandidaturaModel,
                                    attributes: ["nome"],
                                },

                            ],

                            attributes: [
                                "coligacao",

                            ],
                        },
                    ],
                },
                {
                    model: generoModel,
                    attributes: ["nome_genero"],
                },
                {
                    model: racaModel,
                    attributes: ["nome"],
                },
                {
                    model: ocupacaoModel,
                    attributes: ["nome_ocupacao"],
                },
            ],
            group: ["candidato.id", "eleicao.ano_eleicao", "eleicao->candidato_eleicaos.id",
                "eleicao->candidato_eleicaos->partido.id", "eleicao->candidato_eleicaos->grau_de_instrucao.id",
                "eleicao->candidato_eleicaos->bens_candidatos.id", "eleicao->candidato_eleicaos->cargo.id",
                "eleicao->candidato_eleicaos->unidade_eleitoral.id", "genero.id", "raca.id", "ocupacao.id",
                "eleicao->candidato_eleicaos->situacao_candidatura.id",
            ],
            attributes: [
                "id",
                "nome",
                "cpf",
                "data_nascimento",

            ],
            raw: true,
            nest: true,
        })

        if (!candidate) return new Error("Candidato não encontrado")
        const parsedCandidate = {
            candidato_id: candidate.id,
            nome: candidate.nome,
            cpf: candidate.cpf,
            data_nascimento: candidate.data_nascimento,
            genero: candidate.genero.nome_genero,
            raca: candidate.raca.nome || "Não informada",
            ocupacao: candidate.ocupacao.nome_ocupacao,
            ano_ultima_eleicao: candidate.ano_eleicao,
            coligacao: candidate.eleicao.candidato_eleicaos.coligacao,
            ...candidate.eleicao.candidato_eleicaos.partido,
            grau_de_instrucao: candidate.eleicao.candidato_eleicaos.grau_de_instrucao.nome_agrupado,
            bens_declarados: candidate.eleicao.candidato_eleicaos.bens_candidatos.totalValor,
            cidade_nascimento: candidate.municipio_nascimento,
            ultimo_cargo: candidate.eleicao.candidato_eleicaos.cargo.nome_cargo,
            ultima_unidade_eleitoral: `${candidate.eleicao.candidato_eleicaos.unidade_eleitoral.sigla_unidade_fede} - ${candidate.eleicao.candidato_eleicaos.unidade_eleitoral.nome}`,
            ultima_situacao_candidatura: candidate.eleicao.candidato_eleicaos.situacao_candidatura.nome,

        }

        return parsedCandidate
    } catch (error) {
        console.error("Error fetching candidate:", error)
        throw error
    }
}

const getCandidate = async (candidatoId) => {
    try {
        return await candidatoModel.findOne({
            where: {
                id: candidatoId,
            },
            include: [
                {
                    model: eleicaoModel,
                    attributes: ["ano_eleicao"],
                },
            ],

            attributes: ["id", "eleicao.ano_eleicao"],
            raw: true,

        })
    } catch (error) {
        throw error
    }
}

module.exports = {
    getCandidate,
    get10CandidatesSortedByName,
    getCandidateDetailById,
}
