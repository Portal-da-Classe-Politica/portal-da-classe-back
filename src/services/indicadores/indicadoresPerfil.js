const {
    Op, Sequelize,
} = require("sequelize")

const CandidatoEleicaoModel = require("../../models/CandidatoEleicao")
const EleicaoModel = require("../../models/Eleicao")
const CargoModel = require("../../models/Cargo")
const votacaoCandidatoMunicipioModel = require("../../models/VotacaoCandidatoMunicipio")
const SituacaoTurnoModel = require("../../models/SituacaoTurno")

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
            // foi_eleito vem NULL (não false) para uma candidatura cuja eleição ainda
            // não teve resultado apurado — tratar como false diria "Não eleito" para
            // uma eleição que sequer aconteceu.
            cargos_disputados: [
                results.map((r) => {
                    const situacao = r.foi_eleito === true
                        ? "Eleito"
                        : r.foi_eleito === false
                            ? "Não eleito"
                            : "Aguardando resultado"
                    return `${r.nome_cargo} (${r.ano_eleicao}) - ${situacao}`
                }),
            ].join(", "),
        },
        unity: "text",
    })
}

const getDispersaoVotos = async (candidateId) => {
    // Candidaturas válidas do candidato em eleições gerais (abrangência 1),
    // da mais recente para a mais antiga.
    const candidaturasGerais = await CandidatoEleicaoModel.findAll({
        where: {
            candidato_id: candidateId,
            situacao_candidatura_id: { [Op.in]: [1, 16] }, // valid candidacies
        },
        include: [{
            model: EleicaoModel,
            attributes: ["id", "ano_eleicao", "turno"],
            where: {
                abrangencium_id: 1, // apenas eleições gerais
            },
        }],
        attributes: ["id", "eleicao_id"],
        order: [[Sequelize.col("eleicao.ano_eleicao"), "DESC"]],
        raw: true,
    })

    if (!candidaturasGerais.length) {
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

    // Total de votos por eleição. O INNER JOIN com a votação deixa de fora as eleições
    // que ainda não foram apuradas (ex.: 2026, com candidaturas já importadas mas sem
    // nenhum registro em votacao_candidato_municipios).
    const totaisPorEleicao = await CandidatoEleicaoModel.findAll({
        attributes: [
            "eleicao_id",
            [Sequelize.fn("SUM", Sequelize.col("votacao_candidato_municipios.quantidade_votos")), "total_votes"],
        ],
        include: [{
            model: votacaoCandidatoMunicipioModel,
            attributes: [],
            required: true,
        }],
        where: {
            candidato_id: candidateId,
            eleicao_id: { [Op.in]: candidaturasGerais.map((candidatura) => candidatura["eleicao.id"]) },
        },
        group: [Sequelize.col("candidato_eleicao.eleicao_id")],
        raw: true,
    })

    const eleicoesApuradas = new Set(
        totaisPorEleicao
            .filter((linha) => Number(linha.total_votes) > 0)
            .map((linha) => linha.eleicao_id),
    )

    // A eleição analisada é a mais recente COM votação apurada: uma candidatura em
    // eleição ainda em curso não deve zerar o indicador nem esconder o último
    // resultado real do candidato.
    const lastElection = candidaturasGerais.find((candidatura) => eleicoesApuradas.has(candidatura["eleicao.id"]))

    if (!lastElection) {
        return createKPI({
            name: `Concentração de votos - ${candidaturasGerais[0]["eleicao.ano_eleicao"]}`,
            description: "Ainda não há resultado de votação apurado para essa candidatura.",
            value: null,
            metadata: {
                totalVotos: 0,
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

    // Sem nenhum voto computado, a eleição ainda não tem resultado apurado (ex.:
    // candidatura de uma eleição em curso) — retorna "sem dado" em vez de calcular
    // um índice de concentração de 0% que sugeriria "votos totalmente dispersos".
    if (!votos.length || totalVotos === 0) {
        return createKPI({
            name: `Concentração de votos - ${lastElection["eleicao.turno"]}º turno - ${lastElection["eleicao.ano_eleicao"]}`,
            description: "Ainda não há resultado de votação apurado para essa candidatura.",
            value: null,
            metadata: {
                totalVotos: 0,
            },
            unity: "%",
        })
    }

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
        name: `Concentração de votos - ${lastElection["eleicao.turno"]}º turno - ${lastElection["eleicao.ano_eleicao"]}`,
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
    getCargosEleitos,
    getDispersaoVotos,
}
