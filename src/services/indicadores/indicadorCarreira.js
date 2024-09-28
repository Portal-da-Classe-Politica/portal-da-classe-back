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
 * @name Taxa de Renovação Líquida
 * @description TRL = (D / (D + R)) * 100 - D = é o número de membros que tentaram a reeleição e foram derrotados - R = é o número de membros que tentaram a reeleição e foram reeleitos
 * @param {*} cargoId
 * @param {*} initialYear
 * @param {*} finalYear
 * @param {*} unidadesEleitorais
 * @returns
 */
const getTaxaDeRenovacaoLiquida = async (cargoId, initialYear, finalYear, unidadesEleitorais) => {
    const [elections, electedSituacaoTurnos, notElectedSituacaoTurnos] = await Promise.all([
        getElectionsByYearInterval(initialYear, finalYear),
        SituacaoTurnoModel.findAll({ where: { foi_eleito: true } }),
        SituacaoTurnoModel.findAll({ where: { foi_eleito: false } }),
    ])
    const electionsIds = elections.map((election) => election.id)

    let filterUnities
    if (unidadesEleitorais && unidadesEleitorais.length > 0) {
        filterUnities = {
            [Op.in]: unidadesEleitorais,
        }
    }

    const [totalElectedCandidatesReelected, failedReelectedCandidates] = await Promise.all([
        CandidatoEleicaoModel.findAll({
            attributes: [
                "eleicao_id",
                [Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("candidato_eleicao.candidato_id"))), "total"],
            ],
            where: {
                eleicao_id: { [Op.in]: electionsIds },
                cargo_id: cargoId,
                situacao_turno_id: { [Op.in]: electedSituacaoTurnos.map((situacaoTurno) => situacaoTurno.id) },
                situacao_reeleicao_id: 3,
                situacao_candidatura_id: { [Op.in]: [1, 16] },
                ...(filterUnities && { unidade_eleitoral_id: filterUnities }),
            },
            group: ["eleicao_id"],
            raw: true,
        }),
        CandidatoEleicaoModel.findAll({
            attributes: [
                "eleicao_id",
                [Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("candidato_eleicao.candidato_id"))), "total"],
            ],
            where: {
                eleicao_id: { [Op.in]: electionsIds },
                cargo_id: cargoId,
                situacao_turno_id: { [Op.in]: notElectedSituacaoTurnos.map((situacaoTurno) => situacaoTurno.id) },
                situacao_reeleicao_id: 3,
                situacao_candidatura_id: { [Op.in]: [1, 16] },
                ...(filterUnities && { unidade_eleitoral_id: filterUnities }),
            },
            group: ["eleicao_id"],
            raw: true,
        }),
    ])

    // TRL DEVE SER CALCULADO POR ANO
    // TRL = (D / (D + R)) * 100
    // D = é o número de membros que tentaram a reeleição e foram derrotados
    // R = é o número de membros que tentaram a reeleição e foram reeleitos
    const TRLByYear = elections.map((election) => {
        const electedCandidatesByElection = totalElectedCandidatesReelected.find((electedCandidate) => electedCandidate.eleicao_id === election.id)?.total || 0
        const notElectedCandidatesByElection = failedReelectedCandidates.find((notElectedCandidate) => notElectedCandidate.eleicao_id === election.id)?.total || 0
        // console.log({ electedCandidatesByElection, notElectedCandidatesByElection })
        if (electedCandidatesByElection && notElectedCandidatesByElection) {
            const TRL = (parseInt(notElectedCandidatesByElection) / (parseInt(electedCandidatesByElection) + parseInt(notElectedCandidatesByElection))) * 100

            const object = {
                election_id: election.id,
                ano: election.ano_eleicao,
                total: TRL,
            }
            return object
        }
    }).filter((item) => item)

    return TRLByYear
}

/**
 * @name Taxa de Reeleição
 * @description TR = REELEITOS / TOTAL DE CANDIDATOS QUE TENTARAM REELEIÇÃO
 * @param {*} cargoId
 * @param {*} initialYear
 * @param {*} finalYear
 * @param {*} unidadesEleitorais
 * @returns
 */
const getTaxaReeleicao = async (cargoId, initialYear, finalYear, unidadesEleitorais) => {
    const [elections, electedSituacaoTurnos] = await Promise.all([
        getElectionsByYearInterval(initialYear, finalYear),
        SituacaoTurnoModel.findAll({ where: { foi_eleito: true } }),
    ])
    const electionsIds = elections.map((election) => election.id)

    let filterUnities
    if (unidadesEleitorais && unidadesEleitorais.length > 0) {
        filterUnities = {
            [Op.in]: unidadesEleitorais,
        }
    }

    const [totalElectedCandidatesReelected, totalCandidatesTryingReelection] = await Promise.all([
        CandidatoEleicaoModel.findAll({
            attributes: [
                "eleicao_id",
                [Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("candidato_eleicao.candidato_id"))), "total"],
            ],
            where: {
                eleicao_id: { [Op.in]: electionsIds },
                cargo_id: cargoId,
                situacao_turno_id: { [Op.in]: electedSituacaoTurnos.map((situacaoTurno) => situacaoTurno.id) },
                situacao_candidatura_id: { [Op.in]: [1, 16] }, // candidaturas validas
                situacao_reeleicao_id: 3, // tentou reeleição
                ...(filterUnities && { unidade_eleitoral_id: filterUnities }),
            },
            group: ["eleicao_id"],
            raw: true,
        }),
        CandidatoEleicaoModel.findAll({
            attributes: [
                "eleicao_id",
                [Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("candidato_eleicao.candidato_id"))), "total"],
            ],
            where: {
                eleicao_id: { [Op.in]: electionsIds },
                cargo_id: cargoId,
                situacao_candidatura_id: { [Op.in]: [1, 16] },
                situacao_reeleicao_id: 3, // tentou reeleição
                ...(filterUnities && { unidade_eleitoral_id: filterUnities }),
            },
            group: ["eleicao_id"],
            raw: true,
        }),
    ])

    // TR DEVE SER CALCULADO POR ANO
    // TR = REELEITOS / TOTAL DE CANDIDATOS QUE TENTARAM REELEIÇÃO
    const TRByYear = elections.map((election) => {
        const electedCandidatesByElection = totalElectedCandidatesReelected.find((electedCandidate) => electedCandidate.eleicao_id === election.id)?.total || 0
        const totalCandidatesTryingReelectionByElection = totalCandidatesTryingReelection.find((candidate) => candidate.eleicao_id === election.id)?.total || 0

        if (electedCandidatesByElection && totalCandidatesTryingReelectionByElection) {
            // console.log({ electedCandidatesByElection, totalCandidatesTryingReelectionByElection, ano: election.ano_eleicao })
            const TR = (parseInt(electedCandidatesByElection) / parseInt(totalCandidatesTryingReelectionByElection))

            const object = {
                election_id: election.id,
                ano: election.ano_eleicao,
                total: TR,
            }
            // console.log({ object })
            return object
        }
    }).filter((item) => item)

    return TRByYear
}
/**
 * @name Índice de Paridade Eleitoral de Gênero
 * @formula IPEG = (PME / PCM) * 100
 * @PME  é a proporção de mulheres eleitas (nº de mulheres eleitas pelo nº total de eleitos)
 * @PCM é proporção de candidatas mulheres (nº de candidatas mulheres pelo nº total de candidatos)
 * @param {*} cargoId
 * @param {*} initialYear
 * @param {*} finalYear
 * @param {*} unidadesEleitorais
 */
const getIndiceParidadeEleitoralGenero = async (cargoId, initialYear, finalYear, unidadesEleitorais) => {
    const [elections, electedSituacaoTurnos] = await Promise.all([
        getElectionsByYearInterval(initialYear, finalYear),
        SituacaoTurnoModel.findAll({ where: { foi_eleito: true } }),
    ])
    const electionsIds = elections.map((election) => election.id)

    let filterUnities
    if (unidadesEleitorais && unidadesEleitorais.length > 0) {
        filterUnities = {
            [Op.in]: unidadesEleitorais,
        }
    }

    const [totalElectedCandidates, totalCandidates] = await Promise.all([
        CandidatoEleicaoModel.findAll({
            attributes: [
                "eleicao_id",
                "candidato.genero.nome_genero",
                "candidato.genero_id",
                [Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("candidato_eleicao.candidato_id"))), "total"],
            ],
            where: {
                eleicao_id: { [Op.in]: electionsIds },
                cargo_id: cargoId,
                situacao_turno_id: { [Op.in]: electedSituacaoTurnos.map((situacaoTurno) => situacaoTurno.id) },
                situacao_candidatura_id: { [Op.in]: [1, 16] }, // candidaturas validas
                ...(filterUnities && { unidade_eleitoral_id: filterUnities }),
            },
            include: [{
                model: CandidatoModel,
                attributes: [],
                include: [{
                    model: GeneroModel,
                    attributes: [],
                }],
            }],
            group: ["eleicao_id", "candidato.genero.nome_genero", "candidato.genero_id"],
            raw: true,
        }),
        CandidatoEleicaoModel.findAll({
            attributes: [
                "eleicao_id",
                "candidato.genero.nome_genero",
                "candidato.genero_id",
                [Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("candidato_eleicao.candidato_id"))), "total"],
            ],
            where: {
                eleicao_id: { [Op.in]: electionsIds },
                cargo_id: cargoId,
                situacao_candidatura_id: { [Op.in]: [1, 16] }, // candidaturas validas
                ...(filterUnities && { unidade_eleitoral_id: filterUnities }),
            },
            include: [{
                model: CandidatoModel,
                attributes: [],
                include: [{
                    model: GeneroModel,
                    attributes: [],
                }],
            }],
            group: ["eleicao_id", "candidato.genero.nome_genero", "candidato.genero_id"],
            raw: true,
        }),
    ])

    // IPEG DEVE SER CALCULADO POR ANO
    // IPEG = (PME / PCM) * 100
    // PME  é a proporção de mulheres eleitas (nº de mulheres eleitas pelo nº total de eleitos)
    // PCM é a proporção de candidatas mulheres (nº de candidatas mulheres pelo nº total de candidatos)
    const IPEGByYear = elections.map((election) => {
        const totalElected = totalElectedCandidates.filter((candidate) => candidate.eleicao_id === election.id)
        const totalValidCandidates = totalCandidates.filter((candidate) => candidate.eleicao_id === election.id)

        const totalElectedCount = totalElected.reduce((acc, candidate) => acc + parseInt(candidate.total), 0)
        const totalValidCandidatesCount = totalValidCandidates.reduce((acc, candidate) => acc + parseInt(candidate.total), 0)

        const totalElectedWomen = totalElected.find((candidate) => candidate.genero_id === 2)?.total || 0
        const totalValidWomenCandidates = totalValidCandidates.find((candidate) => candidate.genero_id === 2)?.total || 0

        if (totalElectedCount && totalValidCandidatesCount) {
            const PME = parseInt(totalElectedWomen) / parseInt(totalElectedCount)
            const PCM = parseInt(totalValidWomenCandidates) / parseInt(totalValidCandidatesCount)
            const IPEG = (PME / PCM)

            const object = {
                election_id: election.id,
                ano: election.ano_eleicao,
                total: IPEG,
            }

            return object
        }
    }).filter((item) => item)

    // console.log(IPEGByYear)

    return IPEGByYear
}

/**
 *  @name Taxa de Custo por Voto
 * @formula TCV = (C / V)
 * @C é o custo da campanha
 * @V é o número de votos obtidos por partido
 * @param {*} cargoId
 * @param {*} initialYear
 * @param {*} finalYear
 * @param {*} unidadesEleitorais
 */
const getTaxaCustoPorVoto = async (cargoId, initialYear, finalYear, unidadesEleitorais) => {
    const elections = await getElectionsByYearInterval(initialYear, finalYear)
    const electionsIds = elections.map((election) => election.id)

    let filterUnities
    if (unidadesEleitorais && unidadesEleitorais.length > 0) {
        filterUnities = unidadesEleitorais
    }

    // Obter os custos de campanha e votos dos partidos em uma única consulta
    const results = await CandidatoEleicaoModel.findAll({
        attributes: [
            "eleicao_id",
            "partido.sigla",
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
                model: PartidoModel,
                attributes: ["sigla"],
            },
        ],
        where: {
            eleicao_id: { [Op.in]: electionsIds },
            cargo_id: cargoId,
            situacao_candidatura_id: { [Op.in]: [1, 16] }, // candidaturas validas
            ...(filterUnities && { unidade_eleitoral_id: filterUnities }),
        },
        group: ["eleicao_id", "partido.sigla"],
        raw: true,
    })

    // Calcular a taxa de custo por voto (TCV)
    const TCV = results.map((result) => {
        const cost = parseFloat(result.total_cost) || 0
        const votes = parseInt(result.total_votes) || 0
        const object = {
            partido: result["partido.sigla"],
            ano: elections.find((election) => election.id === result.eleicao_id).ano_eleicao,
            TCV: votes > 0 ? parseFloat((cost / votes).toFixed(2)) : 0,
        }
        // console.log(object)
        return object
    })

    return TCV
}
/**
 *  @name Índice de Igualdade de Acesso a Recursos
    @formula IEAR = (R / A)
    @R é a variância dos recursos disponíveis entre os candidatos -> variancia dos bens declarados de todos candidatos
    @A é a média dos recursos disponíveis entre os candidatos -> media dos bens declarados de todos candidatos
 * @param {*} cargoId
 * @param {*} initialYear
 * @param {*} finalYear
 * @param {*} unidadesEleitorais
 */
const getIndiceIgualdadeAcessoRecursos = async (cargoId, initialYear, finalYear, unidadesEleitorais) => {
    const elections = await getElectionsByYearInterval(initialYear, finalYear)
    const electionsIds = elections.map((election) => election.id)

    let filterUnitiesCondition = ""
    if (unidadesEleitorais && unidadesEleitorais.length > 0) {
        filterUnitiesCondition = `AND ce.unidade_eleitoral_id IN (${unidadesEleitorais.join(",")})`
    }
    const query = `
    SELECT 
        e.ano_eleicao,
        AVG(b.valor) AS media,
        VARIANCE(b.valor) AS variancia
    FROM 
        bens_candidatos b
    JOIN 
        candidato_eleicaos ce ON b.candidato_eleicao_id = ce.id
    JOIN 
        eleicaos e ON ce.eleicao_id = e.id
    WHERE 
        ce.eleicao_id IN (${electionsIds.join(",")})
        AND ce.cargo_id = ${cargoId}
        AND ce.situacao_candidatura_id IN (1, 16)
        ${filterUnitiesCondition}
    GROUP BY 
        e.ano_eleicao
`

    const results = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT })

    const IEARPorAno = results.map((result) => ({
        ano: result.ano_eleicao,
        IEAR: result.media > 0 ? Number((parseFloat(result.variancia) / parseFloat(result.media)).toFixed(2)) : 0,
    }))

    return IEARPorAno
}

/**
 * @name Média e Mediana de Patrimônio da Classe Política por eleicao
 * @param {*} cargoId
 * @param {*} initialYear
 * @param {*} finalYear
 * @param {*} unidadesEleitorais
 */
const getMediaMedianaPatrimonio = async (cargoId, initialYear, finalYear, unidadesEleitorais) => {
    const elections = await getElectionsByYearInterval(initialYear, finalYear)
    const electionsIds = elections.map((election) => election.id)

    let filterUnitiesCondition = ""
    if (unidadesEleitorais && unidadesEleitorais.length > 0) {
        filterUnitiesCondition = `AND ce.unidade_eleitoral_id IN (${unidadesEleitorais.join(",")})`
    }

    const query = `
        SELECT 
            e.ano_eleicao,
            AVG(b.valor) AS media,
            SUM(b.valor) AS total_patrimonio,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY b.valor) AS mediana
        FROM 
            bens_candidatos b
        JOIN 
            candidato_eleicaos ce ON b.candidato_eleicao_id = ce.id
        JOIN 
            eleicaos e ON ce.eleicao_id = e.id
        WHERE 
            ce.eleicao_id IN (${electionsIds.join(",")})
            AND ce.cargo_id = ${cargoId}
            AND ce.situacao_candidatura_id IN (1, 16)
            ${filterUnitiesCondition}
        GROUP BY 
            e.ano_eleicao
    `

    const results = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT })

    // Calcular a linha de tendência (simplesmente a média dos valores ao longo dos anos)
    const tendencia = results.map((result, index, array) => {
        const sum = array.slice(0, index + 1).reduce((acc, curr) => acc + parseFloat(curr.media), 0)
        return sum / (index + 1)
    })

    const patrimonioPorAno = results.map((result, index) => ({
        ano: result.ano_eleicao,
        media: parseFloat(result.media.toFixed(2)),
        mediana: parseFloat(result.mediana.toFixed(2)),
        total_patrimonio: parseFloat(result.total_patrimonio.toFixed(2)),
        tendencia: parseFloat(tendencia[index].toFixed(2)),
    }))

    return patrimonioPorAno
}

module.exports = {
    getTaxaDeRenovacaoLiquida,
    getTaxaReeleicao,
    getIndiceParidadeEleitoralGenero,
    getTaxaCustoPorVoto,
    getIndiceIgualdadeAcessoRecursos,
    getMediaMedianaPatrimonio,
}
