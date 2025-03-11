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
const unidadeEleitoralSvc = require("../UnidateEleitoralService")
const { fatoresDeCorreção } = require("../../utils/ipca")

const getElectionsByYearInterval = async (initialYear, finalYear, round = 1) => {
    try {
        const election = await EleicaoModel.findAll({
            where: {
                ano_eleicao: {
                    [Sequelize.Op.gte]: initialYear,
                    [Sequelize.Op.lte]: finalYear,
                },
                turno: round,
            },
            attributes: ["id", "ano_eleicao"],
            raw: true,
        })
        return election
    } catch (error) {
        console.error("Error fetching election:", error)
        throw error
    }
}

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
            {
                model: doacoesCandidatoEleicaoModel,
                attributes: [],
                required: false,
            },
            {
                model: votacaoCandidatoMunicipioModel,
                attributes: [],
                required: false,
            },
            {
                model: EleicaoModel,
                attributes: ["ano_eleicao"],
            }
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
    return TCV
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
            }
        ],
        where: {
            candidato_id: candidateId,
            situacao_candidatura_id: { [Op.in]: [1, 16] }, // candidaturas validas
        },
        // group: ["eleicao_id", "eleicao.ano_eleicao", "cargo.nome"],
        // limit: 1,
        raw: true,
    })

    // Ordernar por ano de eleicao
    results.sort((a, b) => a.ano_eleicao - b.ano_eleicao)
    return results;
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
            attributes: ['id', 'ano_eleicao'],
        }],
        order: [[Sequelize.col('eleicao.ano_eleicao'), 'DESC']],
        raw: true,
    });

    if (!lastElection) {
        return null;
    }

    // Get candidate's total assets
    const candidateAssets = await BensCandidatoEleicao.findOne({
        attributes: [
            [Sequelize.fn('SUM', Sequelize.col('valor')), 'total_assets']
        ],
        where: {
            candidato_eleicao_id: lastElection['id']
        },
        raw: true,
    });

    // Get all candidates' assets from the same election
    const allCandidatesAssets = await BensCandidatoEleicao.findAll({
        attributes: [
            'candidato_eleicao_id',
            [Sequelize.fn('SUM', Sequelize.col('valor')), 'total_assets']
        ],
        include: [{
            model: CandidatoEleicaoModel,
            where: {
                eleicao_id: lastElection['eleicao.id'],
                situacao_candidatura_id: { [Op.in]: [1, 16] },
            },
            attributes: [],
        }],
        group: ['candidato_eleicao_id'],
        raw: true,
    });

    // Calculate percentile
    const allAssets = allCandidatesAssets.map(c => parseFloat(c.total_assets) || 0).sort((a, b) => a - b);
    const candidateTotalAssets = parseFloat(candidateAssets?.total_assets) || 0;
    
    const position = allAssets.findIndex(asset => asset >= candidateTotalAssets);
    const percentile = position === -1 ? 100 : (position / allAssets.length) * 100;

    return {
        ano_eleicao: lastElection['eleicao.ano_eleicao'],
        valor_total_bens: candidateTotalAssets,
        percentil: parseFloat(percentile.toFixed(2)),
        total_candidatos: allAssets.length
    };
};



module.exports = {
    getCustoPorVoto,
    getCargosEleitos,
    getPercentilPatrimonio,
    // getIndiceDiversidadeEconomica,
    // getMedianaMigracao
}
