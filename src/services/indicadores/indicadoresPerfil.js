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
const AbrangenciaModel = require("../../models/Abrangencia")
const unidadeEleitoralSvc = require("../UnidateEleitoralService")
const { fatoresDeCorreção } = require("../../utils/ipca")

/**
 * @typedef {Object} KPI
 * @property {string} name - Nome do indicador
 * @property {string} description - Descrição detalhada do indicador
 * @property {number} value - Valor numérico do indicador
 * @property {string} unity - Unidade de medida (ex: R$, %, text, integer, float)
 * @property {string} [trend] - Tendência do indicador (opcional)
 * @property {Object} [metadata] - Metadados adicionais (opcional)
 */

/**
 * Creates a KPI object with standardized structure
 * @param {Object} params Parameters to create KPI
 * @param {string} params.name Nome do indicador
 * @param {string} params.description Descrição do indicador
 * @param {number} params.value Valor do indicador
 * @param {string} params.unity Unidade de medida
 * @param {string} [params.trend] Tendência (opcional)
 * @param {Object} [params.metadata] Metadados adicionais (opcional)
 * @returns {KPI} KPI object
 */
const createKPI = ({
    name,
    description,
    value,
    unity,
    trend = null,
    metadata = null,
}) => ({
    name,
    description,
    value,
    unity,
    ...(trend && { trend }),
    ...(metadata && { metadata }),
})

/**
 * @name Custo por Voto
 * @description TCV = (C / V) = é o custo da campanha - V = é o número de votos obtidos pelo candidato.
 * @C é o custo da campanha
 * @V é o número de votos obtidos por partido
 * @param {*} candidateId
 * @returns
 */
const getCustoPorVoto = async (candidateId) => {
    // Pegar dados da ultima eleicao do candidato
    const results = await CandidatoEleicaoModel.findAll({
        attributes: [
            "eleicao_id",
            "eleicao.ano_eleicao",
            [Sequelize.fn("SUM", Sequelize.col("candidato_eleicao.despesa_campanha")), "total_cost"],
            [Sequelize.fn("SUM", Sequelize.col("votacao_candidato_municipios.quantidade_votos")), "total_votes"],
        ],
        include: [
            // {
            //     model: doacoesCandidatoEleicaoModel,
            //     attributes: [],
            //     required: false,
            // },
            {
                model: votacaoCandidatoMunicipioModel,
                attributes: [],
                required: false,
            },
            {
                model: EleicaoModel,
                attributes: ["ano_eleicao"],
            },
        ],
        where: {
            candidato_id: candidateId,
            situacao_candidatura_id: { [Op.in]: [1, 16] }, // candidaturas validas
        },
        group: ["eleicao_id", "eleicao.ano_eleicao"],
        // limit: 1,
        raw: true,
    })

    // Calcular a taxa de custo por voto (TCV)
    const TCV = results.map((result) => {
        const cost = parseFloat(result.total_cost) || 0
        const votes = parseInt(result.total_votes) || 0
        const object = {
            ano: result.ano_eleicao,
            TCV: votes > 0 ? parseFloat((cost / votes).toFixed(2)) : 0,
        }
        return object
    })
    // Ordenar por ano
    TCV.sort((a, b) => a.ano - b.ano)

    const lastTCV = TCV[TCV.length - 1]?.TCV || 0
    const secondLastTCV = TCV[TCV.length - 2]?.TCV || 0

    return createKPI({
        name: "Custo por Voto",
        description: "Custo da campanha dividido pelo número de votos obtidos pelo candidato.",
        value: lastTCV,
        unity: "R$",
        trend: lastTCV > secondLastTCV ? "up" : "down",
    })
}

/**
 * @name Cargos eleitos
 * @description Lista dos cargos para o qual o candidato concocorreu e foi eleito.
 * @param {*} candidateId
 * @returns
 */
const getCargosEleitos = async (candidateId) => {
    const results = await CandidatoEleicaoModel.findAll({
        attributes: [
            "eleicao_id",
            "eleicao.ano_eleicao",
            "cargo.nome_cargo",
            "situacao_turno.foi_eleito",

        ],
        include: [
            {
                model: EleicaoModel,
                attributes: [],
            },
            {
                model: CargoModel,
                attributes: [],
            },
            {
                model: SituacaoTurnoModel,
                attributes: [],
            },
        ],
        where: {
            candidato_id: candidateId,
            situacao_candidatura_id: { [Op.in]: [1, 16] }, // candidaturas validas
        },
        raw: true,
    })

    // Ordernar por ano de eleicao
    results.sort((a, b) => a.ano_eleicao - b.ano_eleicao)

    return createKPI({
        name: "Cargos eleitos",
        description: "Cargos para os quais o candidato concorreu e foi eleito.",
        value: [...new Set(results.filter((result) => result.foi_eleito === true).map((result) => result.nome_cargo))].join(", "),
        metadata: {
            total_eleitos: results.filter((result) => result.foi_eleito === true).length,
            total_candidaturas: results.length,
            cargos_disputados: [
                results.map((r) =>
                    `${r.nome_cargo} (${r.ano_eleicao}) - ${r.foi_eleito ? "Eleito" : "Não eleito"}`),
            ].join(", "),
        },
        unity: "text",
    })
}

/**
 * @name Percentil de patrimônio do candidato
 * @description Retorna o percentil do patrimonio do candidato na última eleição disputada.
 * @param {*} candidateId
 * @returns
 */
const getPercentilPatrimonio = async (candidateId) => {
    // First, get the candidate's last election
    const lastElection = await CandidatoEleicaoModel.findOne({
        where: {
            candidato_id: candidateId,
            situacao_candidatura_id: { [Op.in]: [1, 16] }, // valid candidacies
        },
        include: [{
            model: EleicaoModel,
            attributes: ["id", "ano_eleicao"],
        }],
        order: [[Sequelize.col("eleicao.ano_eleicao"), "DESC"]],
        raw: true,
    })

    if (!lastElection) {
        return null
    }

    // Get candidate's total assets
    const candidateAssets = await BensCandidatoEleicao.findOne({
        attributes: [
            [Sequelize.fn("SUM", Sequelize.col("valor")), "total_assets"],
        ],
        where: {
            candidato_eleicao_id: lastElection.id,
        },
        raw: true,
    })

    // Get all candidates' assets from the same election
    const allCandidatesAssets = await BensCandidatoEleicao.findAll({
        attributes: [
            "candidato_eleicao_id",
            [Sequelize.fn("SUM", Sequelize.col("valor")), "total_assets"],
        ],
        include: [{
            model: CandidatoEleicaoModel,
            where: {
                eleicao_id: lastElection["eleicao.id"],
                situacao_candidatura_id: { [Op.in]: [1, 16] },
            },
            attributes: [],
        }],
        group: ["candidato_eleicao_id"],
        raw: true,
    })

    // Calculate percentile
    const allAssets = allCandidatesAssets.map((c) => parseFloat(c.total_assets) || 0).sort((a, b) => a - b)
    const candidateTotalAssets = parseFloat(candidateAssets?.total_assets) || 0

    const position = allAssets.findIndex((asset) => asset >= candidateTotalAssets)
    const percentile = position === -1 ? 100 : (position / allAssets.length) * 100

    return createKPI({
        name: "Percentil de patrimônio do candidato",
        description: "Posição relativa do patrimônio do candidato comparado a todos os candidatos da mesma eleição. Valores próximos a 0% indicam que o candidato está entre os menos abastados, enquanto valores próximos a 100% indicam que está entre os mais ricos da eleição.",
        value: parseFloat(percentile.toFixed(0)),
        unity: "%",
    })
}

const getDispersaoVotos = async (candidateId) => {
    // First, get the candidate's last election with abrangencia = 1 (eleições gerais)
    const lastElection = await CandidatoEleicaoModel.findOne({
        where: {
            candidato_id: candidateId,
            situacao_candidatura_id: { [Op.in]: [1, 16] }, // valid candidacies
        },
        include: [{
            model: EleicaoModel,
            attributes: ["id", "ano_eleicao"],
            where: {
                abrangencium_id: 1, // apenas eleições gerais
            },
        }],
        order: [[Sequelize.col("eleicao.ano_eleicao"), "DESC"]],
        raw: true,
    })

    if (!lastElection) {
        return createKPI({
            name: "Não participou de eleições gerais",
            description: "Como o candidato não participou de eleições gerais, não é possível calcular a concentração de votos.",
            value: 0,
            metadata: {
                totalVotos: 0,
            // votosPorcentagem: votosPorcentagem.sort((a, b) => b.percentual - a.percentual),
            },
            unity: "%",
        })
    }

    const votos = await CandidatoEleicaoModel.findAll({
        attributes: [
            "votacao_candidato_municipios.municipios_votacao_id",
            [Sequelize.fn("SUM", Sequelize.col("votacao_candidato_municipios.quantidade_votos")), "total_votes"],
        ],
        include: [{
            model: votacaoCandidatoMunicipioModel,
            attributes: [],
        }],
        where: {
            eleicao_id: lastElection["eleicao.id"],
            candidato_id: candidateId,
        },
        group: ["municipios_votacao_id"],
        raw: true,
    })

    const votosTratados = votos.map((voto) => ({
        ...voto,
        total_votes: Number(voto.total_votes),
    }))

    const totalVotos = votosTratados.reduce((acc, curr) => Number(acc) + Number(curr.total_votes), 0)

    // Compute the percentage of votes for each municipality
    const votosPorcentagem = votosTratados.map((voto) => ({
        ...voto,
        percentual: (Number(voto.total_votes) / totalVotos) * 100,
    }))

    // Compute the sum of percenteage ^ 2 (Índice de Herfindahl-Hirschman)
    const somaQuadrados = votosPorcentagem.reduce((acc, curr) => acc + Math.pow(curr.percentual, 2), 0)

    // Normalize the index to be between 0 and 100
    const indiceNormalizado = (somaQuadrados / 10000) * 100

    return createKPI({
        name: "Concentração de votos",
        description: "O índice de concentração de votos mede a concentração geográfica dos votos do candidato. Quanto mais próximo de 100%, mais concentrados são os votos em poucos municípios. Quanto mais próximo de 0%, mais dispersos são os votos entre vários municípios.",
        value: indiceNormalizado ? parseFloat(indiceNormalizado.toFixed(2)) : 0,
        metadata: {
            totalVotos,
            // votosPorcentagem: votosPorcentagem.sort((a, b) => b.percentual - a.percentual),
        },
        unity: "%",
    })
}

module.exports = {
    getCustoPorVoto,
    getCargosEleitos,
    getPercentilPatrimonio,
    getDispersaoVotos,
}
