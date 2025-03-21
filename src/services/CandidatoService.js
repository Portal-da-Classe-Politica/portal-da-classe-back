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

const {
    Op, where, QueryTypes, Sequelize,
} = require("sequelize")

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
        const query = `
      SELECT 
          c.id AS candidato_id,
          c.nome,
          c.cpf,
          c.data_nascimento,
          c.municipio_nascimento,
          c.estado_nascimento,
          g.nome_genero,
          r.nome AS raca,
          o.nome_ocupacao,
          e.ano_eleicao,
          ce.coligacao,
          p.nome AS partido,
          p.sigla AS sigla_partido,
          p.nome_atual,
          p.class_categ_1,
          p.class_categ_4,
          p.class_survey_esp,
          gi.nome_agrupado AS grau_de_instrucao,          
          SUM(b.valor) AS total_bens_valor,
          ca.nome_cargo,
          ue.nome AS unidade_eleitoral,
          ue.sigla_unidade_federacao,
          sc.nome AS situacao_candidatura
      FROM candidatos c
      LEFT JOIN generos g ON c.genero_id = g.id
      LEFT JOIN racas r ON c.raca_id = r.id
      LEFT JOIN ocupacaos o ON c.ultima_ocupacao_id = o.id
      LEFT JOIN eleicaos e ON c.ultima_eleicao_id = e.id
      LEFT JOIN candidato_eleicaos ce ON c.id = ce.candidato_id
      LEFT JOIN partidos p ON ce.partido_id = p.id
      LEFT JOIN grau_de_instrucaos gi ON ce.grau_de_instrucao_id = gi.id
      LEFT JOIN bens_candidatos b ON ce.id = b.candidato_eleicao_id
      LEFT JOIN cargos ca ON ce.cargo_id = ca.id
      LEFT JOIN unidade_eleitorals ue ON ce.unidade_eleitoral_id = ue.id
      LEFT JOIN situacao_candidaturas sc ON ce.situacao_candidatura_id = sc.id      
      WHERE c.id = :candidatoId
      GROUP BY c.id, c.nome, c.cpf, c.data_nascimento, 
      c.municipio_nascimento, c.estado_nascimento, 
      g.nome_genero, r.nome, o.nome_ocupacao, 
      e.ano_eleicao, ce.coligacao, p.nome, p.sigla, 
      p.nome_atual, p.class_categ_1, 
      p.class_categ_4, p.class_survey_esp, 
      gi.nome_agrupado, 
      ca.nome_cargo, ue.nome, ue.sigla_unidade_federacao, sc.nome
  `

        const [candidate] = await sequelize.query(query, {
            replacements: { candidatoId },
            type: QueryTypes.SELECT,
        })

        if (!candidate) return new Error("Candidato não encontrado")

        const parsedCandidate = {
            candidato_id: candidate.candidato_id,
            nome: candidate.nome,
            cpf: candidate.cpf,
            data_nascimento: candidate.data_nascimento,
            municipio_nascimento: candidate.municipio_nascimento,
            estado_nascimento: candidate.estado_nascimento,
            genero: candidate.nome_genero,
            raca: candidate.raca || "Não informada",
            ocupacao: candidate.nome_ocupacao,
            ano_ultima_eleicao: candidate.ano_eleicao,
            coligacao: candidate.coligacao,
            partido: candidate.partido,
            sigla_partido: candidate.sigla_partido,
            nome_atual: candidate.nome_atual,
            class_categ_1: candidate.class_categ_1,
            class_categ_4: candidate.class_categ_4,
            class_survey_esp: candidate.class_survey_esp,
            grau_de_instrucao: candidate.grau_de_instrucao,
            bens_declarados: candidate.total_bens_valor,
            cidade_nascimento: candidate.municipio_nascimento,
            ultimo_cargo: candidate.nome_cargo,
            ultima_unidade_eleitoral: `${candidate.sigla_unidade_federacao} - ${candidate.unidade_eleitoral}`,
            ultima_situacao_candidatura: candidate.situacao_candidatura,
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
