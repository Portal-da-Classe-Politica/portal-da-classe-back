const {
    Sequelize,
} = require("sequelize")
const EleicaoModel = require("../../models/Eleicao")


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

const getDistribGeoVotos = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds) => {
    const elections = await getElectionsByYearInterval(initialYear, finalYear)
    const electionsIds = elections.map(e => e.id)

    const replacements = { electionsIds, cargoId };

    let query = `
        SELECT
            e.ano_eleicao,
            ce.unidade_eleitoral_id,
            ue.nome,
            SUM(vcm.quantidade_votos) * 100.0 / SUM(SUM(vcm.quantidade_votos)) OVER (PARTITION BY e.ano_eleicao) AS percentual_votos
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

    query += " GROUP BY  ce.unidade_eleitoral_id, ue.nome, e.ano_eleicao"

    // Executa a consulta
    const data = await sequelize.query(query, {
        replacements, // Substitui os placeholders
        type: Sequelize.QueryTypes.SELECT, // Define como SELECT
    })

    // Step 2: Calculate percentages and format the result
    const result = data.map(entry => ({
        year: entry.ano_eleicao,
        regiao: entry.nome,
        percentual_votos: (Number(entry.percentual_votos)).toFixed(2),
    }));


    return result;

}

const getConcentracaoRegionalVotos = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds) => {
    const elections = await getElectionsByYearInterval(initialYear, finalYear)
    const electionsIds = elections.map(e => e.id)

    const replacements = { electionsIds, cargoId };

    let query = `
        SELECT
            e.ano_eleicao,
            ce.unidade_eleitoral_id,
            SUM(vcm.quantidade_votos) / SUM(SUM(vcm.quantidade_votos)) OVER (PARTITION BY e.ano_eleicao) AS percentual_votos
        FROM candidato_eleicaos ce
        JOIN votacao_candidato_municipios vcm ON ce.candidato_id = vcm.candidato_eleicao_id
        JOIN eleicaos e ON e.id = ce.eleicao_id
        WHERE ce.eleicao_id IN (:electionsIds) AND ce.cargo_id = :cargoId
    `

    // Filtros adicionais dinâmicos
    if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
        query += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"
        replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
    }

    query += " GROUP BY  ce.unidade_eleitoral_id, e.ano_eleicao"

    // Executa a consulta
    const data = await sequelize.query(query, {
        replacements, // Substitui os placeholders
        type: Sequelize.QueryTypes.SELECT, // Define como SELECT
    })

    // Step 2: Calculate percentages and format the result
    const result = data.map(entry => ({
        year: entry.ano_eleicao,
        percentual_votos: (Number(entry.percentual_votos)).toFixed(6),
        ueid: entry.unidade_eleitoral_id,
    }));


    return computeSum(result);
}

const getDispersaoRegionalVotos = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds) => {
    const elections = await getElectionsByYearInterval(initialYear, finalYear)
    const electionsIds = elections.map(e => e.id)

    const replacements = { electionsIds, cargoId };

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
    `;

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
    const result = data.map(entry => ({
        year: entry.ano_eleicao,
        coefficient_variation: (Number(entry.coefficient_variation)).toFixed(6),
        nome: entry.nome,
    }));


    // return computeSum(result);
    return result
}

const getEficienciaVotos = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds) => {
    const elections = await getElectionsByYearInterval(initialYear, finalYear)
    const electionsIds = elections.map(e => e.id)

    const replacements = { electionsIds, cargoId };

    let query = `
        SELECT
            e.ano_eleicao,
            p.sigla,
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
    `;

    // Filtros adicionais dinâmicos
    if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
        query += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"
        replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
    }

    query += " GROUP BY  p.sigla, e.ano_eleicao"

    // Executa a consulta
    const data = await sequelize.query(query, {
        replacements, // Substitui os placeholders
        type: Sequelize.QueryTypes.SELECT, // Define como SELECT
    })

    // Step 2: Calculate percentages and format the result
    const result = data.map(entry => ({
        year: entry.ano_eleicao,
        sigla: entry.sigla,
        iev: (Number(entry.percentual_assentos) / Number(entry.percentual_votos)).toFixed(4),
    }));

    return result
}



// Function to compute sum of s_i^2 for each year
function computeSum(data) {
    const sumsByYear = {};

    // Group data by year and compute the sum for each year
    data.forEach(({ year, percentual_votos }) => {
        if (!sumsByYear[year]) {
            sumsByYear[year] = 0;
        }
        sumsByYear[year] += Math.pow(Number(percentual_votos), 2);
    });

    // Convert result to an array of objects
    return Object.keys(sumsByYear).map(year => ({
        year: parseInt(year),
        sum: sumsByYear[year]
    }));
}

module.exports = {
    getDistribGeoVotos,
    getConcentracaoRegionalVotos,
    getDispersaoRegionalVotos,
    getEficienciaVotos
}
