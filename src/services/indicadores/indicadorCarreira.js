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
const cargoSvc = require("../CargoService")

const getElectionsByYearInterval = async (initialYear, finalYear, abrangenciaId, round = [1]) => {
    const finder = {
        where: {
            ano_eleicao: {
                [Sequelize.Op.gte]: initialYear,
                [Sequelize.Op.lte]: finalYear,
            },
            turno: { [Sequelize.Op.in]: round },
        },
        attributes: ["id", "ano_eleicao"],
        raw: true,
    }

    if (abrangenciaId) {
        finder.where.abrangencium_id = abrangenciaId
    }
    try {
        const election = await EleicaoModel.findAll(finder)
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
const getTaxaDeRenovacaoLiquida = async (cargoId, initialYear, finalYear, unidadesEleitorais, round) => {
    const abrangency = await cargoSvc.getAbragencyByCargoID(cargoId)
    const abrangenciaId = abrangency.abrangencia
    const [elections, electedSituacaoTurnos, notElectedSituacaoTurnos] = await Promise.all([
        getElectionsByYearInterval(initialYear, finalYear, abrangenciaId, round),
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
        // console.log({ ano: election.ano_eleicao, electedCandidatesByElection, notElectedCandidatesByElection })
        // console.log({ electedCandidatesByElection, notElectedCandidatesByElection })

        let TRL = (parseInt(notElectedCandidatesByElection) / (parseInt(electedCandidatesByElection) + parseInt(notElectedCandidatesByElection))) * 100

        if (isNaN(TRL) || !isFinite(TRL)) {
            TRL = 0
        }

        const object = {
            election_id: election.id,
            ano: election.ano_eleicao,
            taxa_renovacao_liquida: TRL,
        }

        // console.log({ electedCandidatesByElection, notElectedCandidatesByElection, ano: election.ano_eleicao, TRL })

        return object
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
const getTaxaReeleicao = async (cargoId, initialYear, finalYear, unidadesEleitorais, round) => {
    const abrangency = await cargoSvc.getAbragencyByCargoID(cargoId)
    const abrangenciaId = abrangency.abrangencia
    const [elections, electedSituacaoTurnos] = await Promise.all([
        getElectionsByYearInterval(initialYear, finalYear, abrangenciaId, round),
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
        const reelectedCandidatesByElection = totalElectedCandidatesReelected.find((electedCandidate) => electedCandidate.eleicao_id === election.id)?.total || 0
        const totalCandidatesTryingReelectionByElection = totalCandidatesTryingReelection.find((candidate) => candidate.eleicao_id === election.id)?.total || 0

        let TR = 0
        if (totalCandidatesTryingReelectionByElection > 0) {
            TR = (parseInt(reelectedCandidatesByElection) / parseInt(totalCandidatesTryingReelectionByElection)) * 100
        }

        const object = {
            election_id: election.id,
            ano: election.ano_eleicao,
            taxa_reeleicao: TR,
        }

        return object
    })

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
const getIndiceParidadeEleitoralGenero = async (cargoId, initialYear, finalYear, unidadesEleitorais, round) => {
    const [elections, electedSituacaoTurnos] = await Promise.all([
        getElectionsByYearInterval(initialYear, finalYear, null, round),
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
                indice_paridade_eleitoral_genero: IPEG,
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
            "partido.sigla_atual",
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
                model: PartidoModel,
                attributes: ["sigla_atual"],
            },
        ],
        where: {
            eleicao_id: { [Op.in]: electionsIds },
            cargo_id: cargoId,
            situacao_candidatura_id: { [Op.in]: [1, 16] }, // candidaturas validas
            ...(filterUnities && { unidade_eleitoral_id: filterUnities }),
        },
        group: ["eleicao_id", "partido.sigla_atual"],
        raw: true,
    })

    // Calcular a taxa de custo por voto (TCV)
    const TCV = results.map((result) => {
        const cost = parseFloat(result.total_cost) || 0
        const votes = parseInt(result.total_votes) || 0
        const object = {
            partido: result["partido.sigla_atual"],
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
const getIndiceIgualdadeAcessoRecursos = async (cargoId, initialYear, finalYear, unidadesEleitorais, round) => {
    const elections = await getElectionsByYearInterval(initialYear, finalYear, null, round)
    const electionsIds = elections.map((election) => election.id)

    let filterUnitiesCondition = ""
    if (unidadesEleitorais && unidadesEleitorais.length > 0) {
        filterUnitiesCondition = `AND ce.unidade_eleitoral_id IN (${unidadesEleitorais.join(",")})`
    }

    const replacements = { electionsIds, cargoId }
    let query = `
    WITH patrimonio_por_candidato AS (
      SELECT
        e.ano_eleicao,
        ce.id AS candidato_eleicao_id,
        SUM(b.valor) AS patrimonio_cand
      FROM bens_candidatos b
      JOIN candidato_eleicaos ce ON b.candidato_eleicao_id = ce.id
      JOIN eleicaos e ON ce.eleicao_id = e.id
      WHERE ce.eleicao_id IN (:electionsIds)
        AND ce.cargo_id = :cargoId
        AND ce.situacao_candidatura_id IN (1, 16)
        ${filterUnitiesCondition}
      GROUP BY e.ano_eleicao, ce.id
    ),
    totais_ano AS (
      SELECT
        ano_eleicao,
        SUM(patrimonio_cand) AS total_patrimonio
      FROM patrimonio_por_candidato
      GROUP BY ano_eleicao
    ),
    shares AS (
      SELECT
        p.ano_eleicao,
        p.patrimonio_cand / NULLIF(t.total_patrimonio, 0) AS s_i
      FROM patrimonio_por_candidato p
      JOIN totais_ano t USING (ano_eleicao)
    )
    SELECT
      ano_eleicao,
      SUM(POWER(s_i, 2)) AS hhi
    FROM shares
    GROUP BY ano_eleicao
    ORDER BY ano_eleicao;
  `

    const rows = await sequelize.query(query, {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
    })

    return rows.map((r) => ({
        ano: Number(r.ano_eleicao),
        IDAR: r.hhi == null ? null : Number(r.hhi), // HHI
    }))
}

/**
 * @name Média e Mediana de Patrimônio da Classe Política por eleicao
 * @param {*} cargoId
 * @param {*} initialYear
 * @param {*} finalYear
 * @param {*} unidadesEleitorais
 */
const getMediaMedianaPatrimonio = async (cargoId, initialYear, finalYear, unidadesEleitorais, round) => {
    const elections = await getElectionsByYearInterval(initialYear, finalYear, null, round)
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
const getIndiceDiversidadeEconomica = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds, round) => {
    const elections = await getElectionsByYearInterval(initialYear, finalYear, null, round)
    const electionsIds = elections.map((e) => e.id)

    let select = `
    SELECT 
        e.ano_eleicao,
        ce.id,
        SUM(bens.valor) AS resultado,
        (SUM(bens.valor) / SUM(SUM(bens.valor)) OVER (PARTITION BY e.ano_eleicao)) * 100 AS percentual
`

    let queryFrom = `FROM candidato_eleicaos ce
        JOIN situacao_turnos st ON st.id = ce.situacao_turno_id
        JOIN eleicaos e ON e.id = ce.eleicao_id
        INNER JOIN bens_candidatos bens ON ce.id = bens.candidato_eleicao_id  
    `

    let queryWhere = ` WHERE ce.eleicao_id IN (:electionsIds) 
        AND ce.cargo_id = :cargoId 
    `
    let queryGroupBy = " GROUP BY e.ano_eleicao, ce.id"

    const replacements = { electionsIds, cargoId }

    // Filtros adicionais dinâmicos
    if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
        queryWhere += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"
        replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
    }

    let sqlQuery = select + queryFrom + queryWhere + queryGroupBy

    // Executa a consulta
    const data = await sequelize.query(sqlQuery, {
        replacements, // Substitui os placeholders
        type: Sequelize.QueryTypes.SELECT, // Define como SELECT
    })
    // console.log("data", data)

    return computeSum(data)
}

const getMedianaMigracao = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds) => {
    const elections = await getElectionsByYearInterval(initialYear, finalYear)
    const electionsIds = elections.map((e) => e.id)

    let select = `
            WITH candidate_parties AS (
            SELECT 
                candidato_id,
                e.ano_eleicao,
                partido_id,
                ROW_NUMBER() OVER (
                    PARTITION BY candidato_id, partido_id 
                    ORDER BY e.ano_eleicao
                ) AS first_occurrence
            FROM public.candidato_eleicaos ce
            JOIN eleicaos e ON ce.eleicao_id = e.id
            WHERE ce.eleicao_id IN (:electionsIds)
                AND ce.cargo_id = :cargoId
        `

    const replacements = { electionsIds, cargoId }

    // Filtros adicionais dinâmicos
    if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
        select += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"
        replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
    }
    select += `),
        unique_parties AS (
            SELECT 
                candidato_id,
                ano_eleicao,
                COUNT(*) AS new_parties
            FROM candidate_parties
            WHERE first_occurrence = 1
            GROUP BY candidato_id, ano_eleicao
        )
        SELECT 
            candidato_id,
            ano_eleicao,
            SUM(new_parties) OVER (
                PARTITION BY candidato_id 
                ORDER BY ano_eleicao
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS total_unique_parties_up_to_year
        FROM unique_parties
        ORDER BY candidato_id, ano_eleicao;
        `

    // Executa a consulta
    const data = await sequelize.query(select, {
        replacements, // Substitui os placeholders
        type: Sequelize.QueryTypes.SELECT, // Define como SELECT
    })

    return computeAvg(data)
}

// Function to compute sum of 1/s_i^2 for each year
function computeSum(data) {
    const sumsByYear = {}

    // Group data by year and compute the sum for each year
    data.forEach(({ ano_eleicao, percentual }) => {
        if (!sumsByYear[ano_eleicao]) {
            sumsByYear[ano_eleicao] = 0
        }
        sumsByYear[ano_eleicao] += Math.pow(percentual, 2)
    })

    // Convert result to an array of objects
    return Object.keys(sumsByYear).map((ano_eleicao) => ({
        ano_eleicao: parseInt(ano_eleicao),
        indice_diversidade_economica: sumsByYear[ano_eleicao],
    }))
}

function computeAvg(data) {
    // Step 1: Group by ano_eleicao
    const yearGroups = data.reduce((acc, { ano_eleicao, total_unique_parties_up_to_year }) => {
        if (!acc[ano_eleicao]) {
            acc[ano_eleicao] = { sum: 0, count: 0 }
        }
        acc[ano_eleicao].sum += parseInt(total_unique_parties_up_to_year, 10)
        acc[ano_eleicao].count += 1
        return acc
    }, {})

    // Step 2: Compute the average for each year
    const averageByYear = Object.entries(yearGroups).map(([year, { sum, count }]) => ({
        ano_eleicao: parseInt(year, 10),
        media_partidos: sum / count,
    }))

    return averageByYear
}

const getGallagherLSq = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds, round) => {
    const elections = await getElectionsByYearInterval(initialYear, finalYear, null, round)
    const electionsIds = elections.map((e) => e.id)

    const replacements = { electionsIds, cargoId }

    let filterUnitiesCondition = ""
    if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
        filterUnitiesCondition = " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds) "
        replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
    }

    let query = `
    WITH votos_por_partido_ano AS (
      SELECT
        e.ano_eleicao,
        p.sigla_atual,
        SUM(vcm.quantidade_votos) AS votos_partido_ano
      FROM candidato_eleicaos ce
      JOIN votacao_candidato_municipios vcm ON ce.id = vcm.candidato_eleicao_id
      JOIN eleicaos e ON e.id = ce.eleicao_id
      JOIN partidos p ON p.id = ce.partido_id
      WHERE ce.eleicao_id IN (:electionsIds)
        AND ce.cargo_id = :cargoId
        ${filterUnitiesCondition}
      GROUP BY e.ano_eleicao, p.sigla_atual
    ),
    votos_totais_ano AS (
      SELECT ano_eleicao, SUM(votos_partido_ano) AS votos_total_ano
      FROM votos_por_partido_ano
      GROUP BY ano_eleicao
    ),
    pct_votos AS (
      SELECT
        v.ano_eleicao,
        v.sigla_atual,
        v.votos_partido_ano / NULLIF(t.votos_total_ano, 0) AS pct_votos
      FROM votos_por_partido_ano v
      JOIN votos_totais_ano t USING (ano_eleicao)
    ),
    eleitos_por_partido_ano AS (
      SELECT
        e.ano_eleicao,
        p.sigla_atual,
        COUNT(DISTINCT CASE
          WHEN ce.situacao_turno_id IN (2, 7, 11, 13) THEN ce.candidato_id
        END) AS eleitos_partido_ano
      FROM candidato_eleicaos ce
      JOIN eleicaos e ON e.id = ce.eleicao_id
      JOIN partidos p ON p.id = ce.partido_id
      WHERE ce.eleicao_id IN (:electionsIds)
        AND ce.cargo_id = :cargoId
        ${filterUnitiesCondition}
      GROUP BY e.ano_eleicao, p.sigla_atual
    ),
    eleitos_totais_ano AS (
      SELECT ano_eleicao, SUM(eleitos_partido_ano) AS eleitos_total_ano
      FROM eleitos_por_partido_ano
      GROUP BY ano_eleicao
    ),
    pct_assentos AS (
      SELECT
        epa.ano_eleicao,
        epa.sigla_atual,
        epa.eleitos_partido_ano / NULLIF(et.eleitos_total_ano, 0) AS pct_assentos
      FROM eleitos_por_partido_ano epa
      JOIN eleitos_totais_ano et USING (ano_eleicao)
    ),
    base AS (
      SELECT
        COALESCE(v.ano_eleicao, s.ano_eleicao) AS ano_eleicao,
        COALESCE(v.sigla_atual, s.sigla_atual) AS sigla_atual,
        COALESCE(v.pct_votos, 0.0)   AS pct_votos,
        COALESCE(s.pct_assentos, 0.0) AS pct_assentos
      FROM pct_votos v
      FULL OUTER JOIN pct_assentos s
        ON v.ano_eleicao = s.ano_eleicao AND v.sigla_atual = s.sigla_atual
    ),
    componentes AS (
      SELECT
        ano_eleicao,
        sigla_atual,
        (pct_votos - pct_assentos) AS diff,
        POWER(pct_votos - pct_assentos, 2) AS diff2
      FROM base
    )
    SELECT
      ano_eleicao,
      SQRT(0.5 * SUM(diff2)) AS lsq_gallagher
    FROM componentes
    GROUP BY ano_eleicao
    ORDER BY ano_eleicao;
  `

    const rows = await sequelize.query(query, {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
    })
    // console.log(rows)

    // Retorna como número
    return rows.map((r) => ({
        ano: Number(r.ano_eleicao),
        lsq: r.lsq_gallagher == null ? null : Number(r.lsq_gallagher),
    }))
}

module.exports = {
    getTaxaDeRenovacaoLiquida,
    getTaxaReeleicao,
    getIndiceParidadeEleitoralGenero,
    getTaxaCustoPorVoto,
    getIndiceIgualdadeAcessoRecursos,
    getMediaMedianaPatrimonio,
    getIndiceDiversidadeEconomica,
    getMedianaMigracao,
    getGallagherLSq,
}
