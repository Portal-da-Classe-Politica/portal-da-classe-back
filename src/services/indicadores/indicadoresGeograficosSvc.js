const {
    Sequelize,
} = require("sequelize")
const EleicaoModel = require("../../models/Eleicao")
const { getElectoralUnitByUFandAbrangency, getElectoralUnitsByUFandAbrangency, getFederativeUnitsByAbrangency } = require("../UnidateEleitoralService")

const getElectionsByYearInterval = async (initialYear, finalYear, round = [1]) => {
    try {
        const election = await EleicaoModel.findAll({
            where: {
                ano_eleicao: {
                    [Sequelize.Op.gte]: initialYear,
                    [Sequelize.Op.lte]: finalYear,
                },
                turno: { [Sequelize.Op.in]: round },
            },
            attributes: ["id"],
            raw: true,
        })
        return election
    } catch (error) {
        console.error("Error fetching election:", error)
        throw error
    }
}

const getConcentracaoRegionalVotos = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds, UF, partyId, round) => {
    if (!partyId) {
        throw new Error("Partido deve ser informado")
    }
    if (UF && (UF == "ZZ" || UF == "VT") && cargoId != 9){
        throw new Error("Apenas o cargo de presidente pode ter votação no exterior/trânsito")
    }
    let UFid
    if (UF && unidadesEleitoraisIds && cargoId != 9) {
        UFsearch = await getElectoralUnitByUFandAbrangency(UF, 1)
        UFid = UFsearch.id
    }
    if (cargoId == 9){
        UFid = 28
    }

    const elections = await getElectionsByYearInterval(initialYear, finalYear, round)
    const electionsIds = elections.map((e) => e.id)

    const replacements = { electionsIds, cargoId }
    let select = ""
    let group = ""
    let from = ""
    let where = ""

    if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
        if (!UFid){
            throw new Error("UF deve ser informado ou UF não encontrado")
        }
        select = `
      SELECT
        e.ano_eleicao,
        ce.eleicao_id,        
        mv.nome AS nome,
        SUM(votacao_municipio_selecionados.quantidade_votos) / (
          SELECT SUM(votacoes_totais.quantidade_votos)
          FROM candidato_eleicaos ce2
          JOIN votacao_candidato_municipios votacoes_totais ON ce2.id = votacoes_totais.candidato_eleicao_id                                
          WHERE ce2.eleicao_id = ce.eleicao_id
          AND ce2.cargo_id = ${cargoId}
          AND ce2.unidade_eleitoral_id = ${UFid}
        ) AS percentual_votos
      `

        from = `
      FROM candidato_eleicaos ce
        JOIN votacao_candidato_municipios votacao_municipio_selecionados ON ce.id = votacao_municipio_selecionados.candidato_eleicao_id
        JOIN eleicaos e ON e.id = ce.eleicao_id
        JOIN unidade_eleitorals ue ON ue.id = ce.unidade_eleitoral_id
        JOIN municipios_votacaos mv ON mv.id = votacao_municipio_selecionados.municipios_votacao_id
      `

        where = ` 
      WHERE ce.eleicao_id IN (:electionsIds) 
      AND ce.cargo_id ${Array.isArray(cargoId) ? 'IN (:cargoId)' : '= :cargoId'}
      AND mv.id IN (:unidadesEleitoraisIds) 
      AND ce.unidade_eleitoral_id = ${UFid}
      AND partido_id = ${partyId}
      `

        replacements.unidadesEleitoraisIds = unidadesEleitoraisIds

        group = " GROUP BY  votacao_municipio_selecionados.municipios_votacao_id, mv.nome, e.ano_eleicao, ce.eleicao_id"
    } else {
        if (!UFid){
            throw new Error("UF deve ser informado ou UF não encontrado")
        }
        let ufIds = [UFid]
        if (cargoId != 9){
            if (UF == "Brasil"){
                ufIdsArrray = await getFederativeUnitsByAbrangency(1)
            } else {
                ufIdsArrray = await getElectoralUnitsByUFandAbrangency(UF, 1)
            }

            ufIds = ufIdsArrray.map((uf) => parseInt(uf.id))
        }
        // aqui so pode ser presidente quando nao detalha por cidade
        select = `
      SELECT
        e.ano_eleicao,
        ce.eleicao_id,        
        mv.estado AS nome,
        SUM(votacao_municipio_selecionados.quantidade_votos) / (
          SELECT SUM(votacoes_totais.quantidade_votos)
          FROM candidato_eleicaos ce2
          JOIN votacao_candidato_municipios votacoes_totais ON ce2.id = votacoes_totais.candidato_eleicao_id                                
          WHERE ce2.eleicao_id = ce.eleicao_id
          AND ce2.cargo_id = ${cargoId}
          AND ce2.unidade_eleitoral_id IN (${ufIds})
        ) AS percentual_votos
      `

        from = `
      FROM candidato_eleicaos ce
        JOIN votacao_candidato_municipios votacao_municipio_selecionados ON ce.id = votacao_municipio_selecionados.candidato_eleicao_id
        JOIN eleicaos e ON e.id = ce.eleicao_id
        JOIN unidade_eleitorals ue ON ue.id = ce.unidade_eleitoral_id
        JOIN municipios_votacaos mv ON mv.id = votacao_municipio_selecionados.municipios_votacao_id
      `

        where = ` 
      WHERE ce.eleicao_id IN (:electionsIds) 
      AND ce.cargo_id ${Array.isArray(cargoId) ? 'IN (:cargoId)' : '= :cargoId'}        
      AND ce.unidade_eleitoral_id IN (${ufIds})
      AND partido_id = ${partyId}
      `

        group = " GROUP BY  mv.estado, e.ano_eleicao, ce.eleicao_id"
    }

    const query = select + from + where + group

    // Executa a consulta
    const data = await sequelize.query(query, {
        replacements, // Substitui os placeholders
        type: Sequelize.QueryTypes.SELECT, // Define como SELECT
    })

    // Step 2: Calculate percentages and format the result
    const result = data.map((entry) => ({
        ano: entry.ano_eleicao,
        regiao: entry.nome,
        percentual_votos: (Number(entry.percentual_votos)).toFixed(6),
    }))

    const sumSquare = computeSum(result)
    return sumSquare
}

const getDispersaoRegionalVotos = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds, round) => {
    const elections = await getElectionsByYearInterval(initialYear, finalYear, round)
    const electionsIds = elections.map((e) => e.id)

    const replacements = { electionsIds, cargoId }

    let query = `
        SELECT
            e.ano_eleicao,
            -- ce.unidade_eleitoral_id,
            p.sigla_atual as sigla_atual,
            CASE
                WHEN AVG(vcm.quantidade_votos) > 0 THEN STDDEV(vcm.quantidade_votos) / AVG(vcm.quantidade_votos) -- CV: Coefficient of Variation
                ELSE 0
            END AS coefficient_variation -- CV = σ / V
        FROM candidato_eleicaos ce
        JOIN votacao_candidato_municipios vcm ON ce.id = vcm.candidato_eleicao_id
        JOIN eleicaos e ON e.id = ce.eleicao_id
        JOIN unidade_eleitorals ue ON ue.id = ce.unidade_eleitoral_id
        JOIN partidos p ON p.id = ce.partido_id
        WHERE ce.eleicao_id IN (:electionsIds) AND ce.cargo_id ${Array.isArray(cargoId) ? 'IN (:cargoId)' : '= :cargoId'}
    `

    // Filtros adicionais dinâmicos
    if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
        query += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"
        replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
    }

    query += " GROUP BY  p.sigla_atual, e.ano_eleicao"

    // Executa a consulta
    const data = await sequelize.query(query, {
        replacements, // Substitui os placeholders
        type: Sequelize.QueryTypes.SELECT, // Define como SELECT
    })

    // Step 2: Calculate percentages and format the result
    const result = data.map((entry) => ({
        ano: entry.ano_eleicao,
        coeficente_variacao: (Number(entry.coefficient_variation)).toFixed(6),
        sigla_atual: entry.sigla_atual,
    }))

    // return computeSum(result);
    return result
}

function computeSum(data) {
    const sumsByYear = {}

    // Group data by year and compute the sum for each year
    data.forEach(({ year, percentual_votos }) => {
        percentual_votos = Math.pow(Number(percentual_votos), 2)
    })

    // Convert result to an array of objects
    return data
}

module.exports = {
    getConcentracaoRegionalVotos,
    getDispersaoRegionalVotos,
}
