const {
    Sequelize,
} = require("sequelize")
const EleicaoModel = require("../../models/Eleicao")
const unidadeEleitoralModel = require("../../models/UnidadeEleitoral")
const { getElectoralUnitByUFandAbrangency } = require("../UnidateEleitoralService")

const getUFByElectoralUnitId = async (id) => {
    try {
        const unidadeEleitoral = await unidadeEleitoralModel.findOne({
            where: {
                id,
            },
            attributes: ["sigla_unidade_federacao"],
            raw: true,
        })
        return unidadeEleitoral.sigla_unidade_federacao
    } catch (error) {
        console.error("Error fetching UF by electoral unit id:", error)
        throw error
    }
}

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
            attributes: ["id"],
            raw: true,
        })
        return election
    } catch (error) {
        console.error("Error fetching election:", error)
        throw error
    }
}

const getDistribGeoVotos = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds, UF) => {
    let UFid
    if (UF && unidadesEleitoraisIds && cargoId != 9) {
        UFsearch = await getElectoralUnitByUFandAbrangency(UF, 1)
        UFid = UFsearch.id
    }
    if (cargoId == 9){
        UFid = 28
    }
    if (!UFid){
        throw new Error("UF deve ser informado")
    }
    const elections = await getElectionsByYearInterval(initialYear, finalYear)
    const electionsIds = elections.map((e) => e.id)

    const replacements = { electionsIds, cargoId }
    let select = ""
    let group = ""
    let from = ""
    let where = ""

    if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
        select = `
        SELECT
          e.ano_eleicao,
          ce.eleicao_id,        
          mv.nome AS nome,
          SUM(votacao_municipio_selecionados.quantidade_votos) * 100.0 / (
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
        AND ce.cargo_id = :cargoId
        AND mv.id IN (:unidadesEleitoraisIds) 
        AND ce.unidade_eleitoral_id = ${UFid}
        `

        replacements.unidadesEleitoraisIds = unidadesEleitoraisIds

        group = " GROUP BY  votacao_municipio_selecionados.municipios_votacao_id, mv.nome, e.ano_eleicao, ce.eleicao_id"
    } else {
        if (cargoId != 9){
            throw new Error("Unidades eleitorais devem ser informadas para o cargo")
        }
        // aqui so pode ser presidente quando nao detalha por cidade
        select = `
        SELECT
          e.ano_eleicao,
          ce.eleicao_id,        
          mv.estado AS nome,
          SUM(votacao_municipio_selecionados.quantidade_votos) * 100.0 / (
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
        AND ce.cargo_id = :cargoId         
        AND ce.unidade_eleitoral_id = ${UFid}
        `

        replacements.unidadesEleitoraisIds = unidadesEleitoraisIds

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
        year: entry.ano_eleicao,
        regiao: entry.nome,
        percentual_votos: (Number(entry.percentual_votos)).toFixed(2),
    }))

    return result
}

const getConcentracaoRegionalVotos = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds, UF, partyId) => {
    if (!partyId) {
        throw new Error("Partido deve ser informado")
    }
    let UFid
    if (UF && unidadesEleitoraisIds && cargoId != 9) {
        UFsearch = await getElectoralUnitByUFandAbrangency(UF, 1)
        UFid = UFsearch.id
    }
    if (cargoId == 9){
        UFid = 28
    }
    if (!UFid){
        throw new Error("UF deve ser informado")
    }
    const elections = await getElectionsByYearInterval(initialYear, finalYear)
    const electionsIds = elections.map((e) => e.id)

    const replacements = { electionsIds, cargoId }
    let select = ""
    let group = ""
    let from = ""
    let where = ""

    if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
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
      AND ce.cargo_id = :cargoId
      AND mv.id IN (:unidadesEleitoraisIds) 
      AND ce.unidade_eleitoral_id = ${UFid}
      AND partido_id = ${partyId}
      `

        replacements.unidadesEleitoraisIds = unidadesEleitoraisIds

        group = " GROUP BY  votacao_municipio_selecionados.municipios_votacao_id, mv.nome, e.ano_eleicao, ce.eleicao_id"
    } else {
        if (cargoId != 9){
            throw new Error("Unidades eleitorais devem ser informadas para o cargo")
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
      AND ce.cargo_id = :cargoId         
      AND ce.unidade_eleitoral_id = ${UFid}
      AND partido_id = ${partyId}
      `

        replacements.unidadesEleitoraisIds = unidadesEleitoraisIds

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
        year: entry.ano_eleicao,
        regiao: entry.nome,
        percentual_votos: (Number(entry.percentual_votos)).toFixed(6),
    }))

    const sumSquare = computeSum(result)
    return sumSquare
}

const getDispersaoRegionalVotos = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds) => {
    const elections = await getElectionsByYearInterval(initialYear, finalYear)
    const electionsIds = elections.map((e) => e.id)

    const replacements = { electionsIds, cargoId }

    let query = `
        SELECT
            e.ano_eleicao,
            -- ce.unidade_eleitoral_id,
            ue.nome,
            CASE
                WHEN AVG(vcm.quantidade_votos) > 0 THEN STDDEV(vcm.quantidade_votos) / AVG(vcm.quantidade_votos) -- CV: Coefficient of Variation
                ELSE 0
            END AS coefficient_variation -- CV = σ / V
        FROM candidato_eleicaos ce
        JOIN votacao_candidato_municipios vcm ON ce.candidato_id = vcm.candidato_eleicao_id
        JOIN eleicaos e ON e.id = ce.eleicao_id
        JOIN unidade_eleitorals ue ON ue.id = ce.unidade_eleitoral_id
        WHERE ce.eleicao_id IN (:electionsIds) AND ce.cargo_id = :cargoId
    `

    // Filtros adicionais dinâmicos
    if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
        query += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"
        replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
    }

    query += " GROUP BY  ue.nome, e.ano_eleicao"

    // Executa a consulta
    const data = await sequelize.query(query, {
        replacements, // Substitui os placeholders
        type: Sequelize.QueryTypes.SELECT, // Define como SELECT
    })

    // Step 2: Calculate percentages and format the result
    const result = data.map((entry) => ({
        year: entry.ano_eleicao,
        coefficient_variation: (Number(entry.coefficient_variation)).toFixed(6),
        nome: entry.nome,
    }))

    // return computeSum(result);
    return result
}

const getEficienciaVotos = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds) => {
    const elections = await getElectionsByYearInterval(initialYear, finalYear)
    const electionsIds = elections.map((e) => e.id)

    const replacements = { electionsIds, cargoId }

    let query = `
        SELECT
            e.ano_eleicao,
            p.sigla_atual,
            SUM(vcm.quantidade_votos) / SUM(SUM(vcm.quantidade_votos)) OVER (PARTITION BY e.ano_eleicao) AS percentual_votos,
             -- Proportion of elected candidates
            COUNT(DISTINCT CASE WHEN ce.situacao_turno_id IN (2, 7, 11, 13) THEN ce.candidato_id END) 
            / NULLIF(
                SUM(COUNT(DISTINCT CASE WHEN ce.situacao_turno_id IN (2, 7, 11, 13) THEN ce.candidato_id END)) 
                OVER (PARTITION BY e.ano_eleicao),
            0)
            AS percentual_assentos
        FROM candidato_eleicaos ce
        JOIN votacao_candidato_municipios vcm ON ce.candidato_id = vcm.candidato_eleicao_id
        JOIN eleicaos e ON e.id = ce.eleicao_id
        JOIN partidos p ON p.id = ce.partido_id 
        WHERE ce.eleicao_id IN (:electionsIds) AND ce.cargo_id = :cargoId
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
        year: entry.ano_eleicao,
        sigla: entry.sigla_atual,
        iev: (Number(entry.percentual_assentos) / Number(entry.percentual_votos)).toFixed(4),
    }))

    return result
}

// Function to compute sum of s_i^2 for each year
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
    getDistribGeoVotos,
    getConcentracaoRegionalVotos,
    getDispersaoRegionalVotos,
    getEficienciaVotos,
}
