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

const parseFinder = (finder, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds) => {
    // UF, cidade
    if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
        finder.where.unidade_eleitoral_id = { [Op.in]: unidadesEleitoraisIds }
    }

    // is_elected
    if (isElected && isElected > 0) {
        const include = {
            model: SituacaoTurnoModel,
            required: true, // INNER JOIN
            where: {
                foi_eleito: Number(isElected) === 1,
            },
            attributes: [],
        }
        finder.include.push(include)
    }

    // partido
    if (partidos && partidos.length > 0) {
        finder.where.partido_id = { [Op.in]: partidos }
    }

    // cargo
    if (cargosIds && cargosIds.length > 0) {
        finder.where.cargo_id = { [Op.in]: cargosIds }
    }

    // categoria
    if (ocupacoesIds && ocupacoesIds.length > 0) {
        finder.where.ocupacao_id = { [Op.in]: ocupacoesIds }
    }

    return finder
}

const parseByDimension = (finder, dimension) => {
    switch (Number(dimension)) {
        case 0:
            finder.attributes.push([Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("candidato.id"))), "total"])
            break
        case 1:
            finder.include.push({ model: votacaoCandidatoMunicipioModel, attributes: [] })
            finder.attributes.push([Sequelize.fn("SUM", Sequelize.col("votacao_candidato_municipios.quantidade_votos")), "total"])
            break
        case 2:
            finder.include.push({ model: BensCandidatoEleicao, attributes: [] })
            finder.attributes.push([Sequelize.fn("SUM", Sequelize.col("bens_candidatos.valor")), "total"])
            break
        default: break
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

const getNEPP = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds) => {
    const elections = await getElectionsByYearInterval(initialYear, finalYear)
    const electionsIds = elections.map(e => e.id)

    let select = `
    SELECT 
        subquery.ano_eleicao,
        subquery.partido_id,
        p.sigla,
        subquery.count
`

    let subquerySelect = `
    SELECT 
        e.ano_eleicao,
        ce.partido_id,
        COUNT (ce.id)
    `

    let subqueryFrom = `FROM public.candidato_eleicaos ce
        JOIN situacao_turnos st ON st.id = ce.situacao_turno_id
        JOIN eleicaos e ON e.id = ce.eleicao_id
    `

    let subqueryWhere = ` WHERE ce.eleicao_id IN (:electionsIds) 
        AND ce.cargo_id = :cargoId 
        AND st.foi_eleito = TRUE
    `
    let subqueryGroupBy = " GROUP BY  e.ano_eleicao, ce.partido_id"

    const replacements = { electionsIds, cargoId }


    // Filtros adicionais dinâmicos
    if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
        subqueryWhere += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"
        replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
        console.log("TESTE", {subqueryWhere, replacements})
    }


    let subquery = subquerySelect + subqueryFrom + subqueryWhere + subqueryGroupBy
    let sqlQuery = select + ` FROM (${subquery}) AS subquery
    JOIN partidos p on subquery.partido_id = p.id `


    // Executa a consulta
    const data = await sequelize.query(sqlQuery, {
        replacements, // Substitui os placeholders
        type: Sequelize.QueryTypes.SELECT, // Define como SELECT
    })

    // Step 1: Group data by year and calculate total count per year
    const totalPerYear = data.reduce((acc, entry) => {
        acc[entry.ano_eleicao] = (acc[entry.ano_eleicao] || 0) + Number(entry.count);
        return acc;
    }, {});

    // Step 2: Calculate percentages and format the result
    const result = data.map(entry => ({
        year: entry.ano_eleicao,
        party: entry.sigla,
        count: (Number(entry.count) / totalPerYear[entry.ano_eleicao]).toFixed(2), // Decimal percentage
    }));


    return computeSum(result);

}

const getVolatilidadeEleitoral = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds) => {
    try {
        const elections = await getElectionsByYearInterval(initialYear, finalYear)
        const electionIds = elections.map(e => e.id)

        const replacements = { electionIds, cargoId };

        let query = `
            SELECT
                ce.partido_id,
                e.ano_eleicao,
                SUM(vcm.quantidade_votos) * 100.0 / SUM(SUM(vcm.quantidade_votos)) OVER (PARTITION BY e.ano_eleicao) AS percentual_votos
            FROM candidato_eleicaos ce
            JOIN votacao_candidato_municipios vcm ON ce.candidato_id = vcm.candidato_eleicao_id
            JOIN eleicaos e ON e.id = ce.eleicao_id
            WHERE ce.eleicao_id IN (:electionIds) AND ce.cargo_id = :cargoId
        `
        // Filtros adicionais dinâmicos
        if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
            query += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"
            replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
        }

        query += `
            GROUP BY ce.partido_id, e.ano_eleicao
            ORDER BY ce.partido_id, e.ano_eleicao
        `;

        const results = await sequelize.query(query, {
            replacements,
            type: Sequelize.QueryTypes.SELECT,
        });

        // Step 3: Calculate electoral volatility
        const partyPercentages = new Map();

        // Store election percentages by party and year
        results.forEach(result => {
            if (!partyPercentages.has(result.partido_id)) {
                partyPercentages.set(result.partido_id, []);
            }
            partyPercentages.get(result.partido_id).push({
                year: result.ano_eleicao,
                percentage: result.percentual_votos,
            });
        });

        // Initialize volatility results
        const volatilityResults = Array.from(new Set(results.map(r => r.ano_eleicao))).map(year => ({
            year,
            sum: 0,
        }));

        // Calculate volatility based on the formula
        for (const [partyId, percentages] of partyPercentages) {
            // Ensure percentages are sorted by year
            percentages.sort((a, b) => a.year - b.year);

            if (percentages.length > 1) {
                for (let i = 1; i < percentages.length; i++) {
                    const P_current = percentages[i].percentage;
                    const P_previous = percentages[i - 1].percentage;

                    const currentYear = percentages[i].year;
                    const previousYear = percentages[i - 1].year;

                    // Update volatility sum for the current year
                    const currentVolatilityEntry = volatilityResults.find(v => v.year === currentYear);
                    if (currentVolatilityEntry) {
                        currentVolatilityEntry.sum += Math.abs(P_current - P_previous) / 2;
                    }
                }
            }
        }

        // Convert the result into the desired format
        return {
            data: volatilityResults.map(v => ({
                year: v.year,
                volatility: v.sum,
            })),
        };
    } catch (error) {
        console.error("Error in getVolatilidadeEleitoral:", error);
        throw error;
    }
}
const getQuocienteEleitoral = async (cargoId, initialYear, finalYear, unidadesEleitoraisIds) => {
    try {
        const elections = await getElectionsByYearInterval(initialYear, finalYear)
        const electionIds = elections.map(e => e.id)

        const replacements = { electionIds, cargoId };

        let query = `
            SELECT
                ce.cargo_id,
                e.ano_eleicao,
	            SUM(vcm.quantidade_votos) / COUNT(DISTINCT CASE WHEN ce.situacao_turno_id IN (2, 7, 11, 13) THEN ce.candidato_id END) AS quociente_eleitoral
            FROM candidato_eleicaos ce
            JOIN votacao_candidato_municipios vcm ON ce.candidato_id = vcm.candidato_eleicao_id
            JOIN eleicaos e ON e.id = ce.eleicao_id
            WHERE ce.eleicao_id IN (:electionIds) AND ce.cargo_id = :cargoId
        `
        // Filtros adicionais dinâmicos
        if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
            query += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"
            replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
        }

        query += `
            GROUP BY ce.cargo_id, e.ano_eleicao
            ORDER BY ce.cargo_id, e.ano_eleicao
        `;

        const results = await sequelize.query(query, {
            replacements,
            type: Sequelize.QueryTypes.SELECT,
        });


        // Convert the result into the desired format
        return {
            data: results.map(v => ({
                ano: v.ano_eleicao,
                quociente_eleitoral: parseInt(v.quociente_eleitoral),
            })),
        };
    } catch (error) {
        console.error("Error in getVolatilidadeEleitoral:", error);
        throw error;
    }
}


// Function to compute sum of 1/s_i^2 for each year
function computeSum(data) {
    const sumsByYear = {};

    // Group data by year and compute the sum for each year
    data.forEach(({ year, count }) => {
        if (!sumsByYear[year]) {
            sumsByYear[year] = 0;
        }
        sumsByYear[year] += Math.pow(count, 2);
    });

    // Convert result to an array of objects
    return Object.keys(sumsByYear).map(year => ({
        year: parseInt(year),
        sum: 1 / sumsByYear[year]
    }));
}

module.exports = {
    getNEPP,
    getVolatilidadeEleitoral,
    getQuocienteEleitoral
}
