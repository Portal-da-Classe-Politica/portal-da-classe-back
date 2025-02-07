const {
    Op, where, QueryTypes, Sequelize,
} = require("sequelize")
const CandidatoEleicaoModel = require("../models/CandidatoEleicao")
const EleicaoModel = require("../models/Eleicao")
const CandidatoModel = require("../models/Candidato")
const PartidoModel = require("../models/Partido")
const SituacaoCandidatoModel = require("../models/SituacaoCandidatura")
const CargoModel = require("../models/Cargo")
const nomeUrnaModel = require("../models/NomeUrna")
const votacaoCandidatoMunicipioModel = require("../models/VotacaoCandidatoMunicipio")
const municipiosVotacaoModel = require("../models/MunicipiosVotacao")
const BensCandidatoEleicao = require("../models/BensCandidatoEleicao")
const GeneroModel = require("../models/Genero")
const SituacaoTurnoModel = require("../models/SituacaoTurno")
const ocupacaoModel = require("../models/Ocupacao")
const categoriaModel = require("../models/Categoria")
const categoria2Model = require("../models/Categoria2")
const doacoesCandidatoEleicaoModel = require("../models/DoacoesCandidatoEleicao")
const unidadeEleitoralSvc = require("./UnidateEleitoralService")
const { fatoresDeCorreção } = require("../utils/ipca")

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

const getLatestElectionsForSearch = async (candidateIds, skip, limit, electoralUnitIds, page) => {
    try {
        let whereClause = {}

        if (!candidateIds && !electoralUnitIds) {
            throw new Error("É necessário informar ao menos um candidato ou uma unidade eleitoral para buscar resultados.")
        }

        // Array para armazenar todas as condições
        const conditions = []

        // Adiciona condição de candidatos se houver IDs fornecidos
        if (candidateIds && candidateIds.length > 0) {
            conditions.push({ [Op.or]: candidateIds })
        }

        // Adiciona condição de unidades eleitorais se houver IDs fornecidos
        if (electoralUnitIds && electoralUnitIds.length > 0) {
            conditions.push({ unidade_eleitoral_id: { [Op.in]: electoralUnitIds } })
        }

        if (conditions.length === 1) {
            whereClause = conditions[0]
            const { count, rows } = await CandidatoEleicaoModel.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: CandidatoModel,
                        attributes: ["id", "nome"],
                        include: [
                            {
                                model: EleicaoModel,
                                attributes: ["ano_eleicao"],
                            },
                        ],
                    },
                    {
                        model: PartidoModel,
                        attributes: ["sigla"],
                    },
                    {
                        model: SituacaoCandidatoModel,
                        attributes: ["nome"],
                    },
                    {
                        model: CargoModel,
                        attributes: ["nome_cargo"],
                    },
                    {
                        model: nomeUrnaModel,
                        attributes: ["nome_urna"],
                    },
                ],
                order: [
                    [sequelize.col("candidato.nome"), "ASC"],
                ],
                attributes: [
                    ["id", "lastCandidatoEleicaoId"],
                    [sequelize.col("partido.sigla"), "partido"],
                    [sequelize.col("candidato.nome"), "nomeCandidato"],
                    [sequelize.col("candidato.id"), "candidatoId"],
                    [sequelize.col("candidato.eleicao.ano_eleicao"), "ultimaEleicao"],
                    [sequelize.col("situacao_candidatura.nome"), "situacao"],
                    [sequelize.col("cargo.nome_cargo"), "cargo"],
                    [sequelize.col("nome_urna.nome_urna"), "nome_urna"],

                ],
                limit,
                offset: skip,
                raw: true,
            })

            // Limpar resultados duplicados
            const cleanedResults = rows.map((result) => {
                return {
                    lastCandidatoEleicaoId: result.lastCandidatoEleicaoId,
                    partido: result.partido,
                    nomeCandidato: result.nomeCandidato,
                    situacao: result.situacao,
                    cargo: result.cargo,
                    nomeUrna: result.nome_urna,
                    ultimaEleicao: result.ultimaEleicao,
                    candidatoId: result.candidatoId,
                }
            })

            return {
                totalResults: count,
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                results: cleanedResults,
            }
        }
        const firstResult = await CandidatoEleicaoModel.findAll({
            where: conditions[0],
            attributes: [
                "id",
            ],
            raw: true,
        })

        if (!firstResult || firstResult.length === 0) {
            return {
                totalResults: 0,
                currentPage: parseInt(page),
                totalPages: 0,
                results: [],
            }
        }
        whereClause[Op.and] = {
            id: { [Op.in]: (firstResult.map((result) => result.id)) },
            unidade_eleitoral_id: { [Op.in]: electoralUnitIds },
        }

        const { count, rows } = await CandidatoEleicaoModel.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: CandidatoModel,
                    attributes: ["id", "nome"],
                    include: [
                        {
                            model: EleicaoModel,
                            attributes: ["ano_eleicao"],
                        },
                    ],
                },
                {
                    model: PartidoModel,
                    attributes: ["sigla"],
                },
                {
                    model: SituacaoCandidatoModel,
                    attributes: ["nome"],
                },
                {
                    model: CargoModel,
                    attributes: ["nome_cargo"],
                },
                {
                    model: nomeUrnaModel,
                    attributes: ["nome_urna"],
                },
            ],
            order: [
                [sequelize.col("candidato.nome"), "ASC"],
            ],
            attributes: [
                ["id", "lastCandidatoEleicaoId"],
                [sequelize.col("partido.sigla"), "partido"],
                [sequelize.col("candidato.nome"), "nomeCandidato"],
                [sequelize.col("candidato.id"), "candidatoId"],
                [sequelize.col("candidato.eleicao.ano_eleicao"), "ultimaEleicao"],
                [sequelize.col("situacao_candidatura.nome"), "situacao"],
                [sequelize.col("cargo.nome_cargo"), "cargo"],
                [sequelize.col("nome_urna.nome_urna"), "nome_urna"],

            ],
            limit,
            offset: skip,
            raw: true,
        })

        // Limpar resultados duplicados
        const cleanedResults = rows.map((result) => {
            return {
                lastCandidatoEleicaoId: result.lastCandidatoEleicaoId,
                partido: result.partido,
                nomeCandidato: result.nomeCandidato,
                situacao: result.situacao,
                cargo: result.cargo,
                nomeUrna: result.nome_urna,
                ultimaEleicao: result.ultimaEleicao,
                candidatoId: result.candidatoId,
            }
        })

        return {
            totalResults: count,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            results: cleanedResults,
        }

        // Consulta para obter os resultados paginados
    } catch (error) {
        console.error("Error fetching latest elections:", error)
        throw error
    }
}

const getLastElectionVotesByRegion = async (candidatoId, eleicaoId) => {
    try {
        const candidateElection = await CandidatoEleicaoModel.findOne({
            where: {
                candidato_id: candidatoId,
                eleicao_id: eleicaoId,
            },
            raw: true,
            attributes: ["id"],
        })

        if (!candidateElection) {
            throw new Error("Candidato não encontrado")
        }
        const result = await votacaoCandidatoMunicipioModel.findAll({
            where: {
                candidato_eleicao_id: candidateElection.id,
            },
            include: [
                {
                    model: municipiosVotacaoModel,
                    attributes: ["nome", "codigo_ibge"],
                },
            ],
            attributes: [
                [sequelize.col("municipios_votacao.nome"), "municipios_votacao.nome"],
                [sequelize.col("municipios_votacao.codigo_ibge"), "municipios_votacao.codigo_ibge"],
                ["quantidade_votos", "votos"],
            ],
            order: [
                [sequelize.col("votos"), "DESC"],
            ],
            raw: true,
        })
        if (!result || result.length === 0) {
            throw new Error("Nenhum voto encontrado")
        }
        const parsedResults = result.map((r) => {
            return {
                municipio: r["municipios_votacao.nome"],
                codigo_ibge: r["municipios_votacao.codigo_ibge"],
                votos: parseInt(r.votos),
            }
        })
        return parsedResults
    } catch (error) {
        console.error("Error fetching votes by region:", error)
        throw error
    }
}

const getLast5LastElections = async (candidatoId, limit = 5) => {
    try {
        const candidateElection = await CandidatoEleicaoModel.findAll({
            where: {
                candidato_id: candidatoId,
            },
            include: [
                {
                    model: EleicaoModel,
                    where: {
                        turno: 1,
                    },
                    attributes: ["ano_eleicao", "id"],
                },
            ],
            order: [
                [sequelize.col("eleicao.ano_eleicao"), "DESC"],
            ],
            limit,
            raw: true,
            attributes: ["id", [sequelize.col("eleicao.id"), "eleicao_id"], [sequelize.col("eleicao.ano_eleicao"), "ano_eleicao"]],
        })

        if (!candidateElection) {
            throw new Error("Candidato não encontrado")
        }

        // console.log(candidateElection)

        return candidateElection
    } catch (error) {
        console.error("Error fetching votes by region:", error)
        throw error
    }
}

const getLast5LastElectionsVotes = async (candidateElectionsIds) => {
    try {
        const candidateElection = await CandidatoEleicaoModel.findAll({
            where: {
                id: { [Op.in]: candidateElectionsIds },
            },
            include: [
                {
                    model: votacaoCandidatoMunicipioModel,
                    attributes: [[sequelize.fn("SUM", sequelize.col("quantidade_votos")), "total_votos"]],
                    group: ["candidato_eleicao_id"],
                },
                {
                    model: EleicaoModel,
                    attributes: ["ano_eleicao"],
                },
            ],
            raw: true,
            group: ["candidato_eleicao_id", "eleicao.ano_eleicao", "candidato_eleicao.id"],
            attributes: [[sequelize.col("eleicao.ano_eleicao"), "ano_eleicao"]],
        })
        if (!candidateElection) {
            throw new Error("Candidato não encontrado")
        }
        const parsedResults = candidateElection.map((r) => {
            return {
                ano_eleicao: r["eleicao.ano_eleicao"],
                total_votos: parseInt(r["votacao_candidato_municipios.total_votos"]),
            }
        })
        return parsedResults
    } catch (error) {
        console.error("Error fetching votes by region:", error)
        throw error
    }
}

const getCandidatesIdsByCandidateElectionsIds = async (ids, skip, limit, page, count) => {
    const finalResult = await CandidatoEleicaoModel.findAll({
        where: {
            id: {
                [Op.in]: ids,
            },
        },
        include: [
            {
                model: CandidatoModel,
                attributes: ["id", "nome"],
                include: [
                    {
                        model: EleicaoModel,
                        attributes: ["ano_eleicao"],
                    },
                ],
            },
            {
                model: PartidoModel,
                attributes: ["sigla"],
            },
            {
                model: SituacaoCandidatoModel,
                attributes: ["nome"],
            },
            {
                model: CargoModel,
                attributes: ["nome_cargo"],
            },
            {
                model: nomeUrnaModel,
                attributes: ["nome_urna"],
            },
        ],
        order: [
            [sequelize.col("candidato.nome"), "ASC"],
        ],
        attributes: [
            ["id", "lastCandidatoEleicaoId"],
            [sequelize.col("partido.sigla"), "partido"],
            [sequelize.col("candidato.nome"), "nomeCandidato"],
            [sequelize.col("candidato.id"), "candidatoId"],
            [sequelize.col("candidato.eleicao.ano_eleicao"), "ultimaEleicao"],
            [sequelize.col("situacao_candidatura.nome"), "situacao"],
            [sequelize.col("cargo.nome_cargo"), "cargo"],
            [sequelize.col("nome_urna.nome_urna"), "nome_urna"],

        ],
        raw: true,
    })

    // Limpar resultados duplicados
    const cleanedResults = finalResult.map((result) => {
        return {
            lastCandidatoEleicaoId: result.lastCandidatoEleicaoId,
            partido: result.partido,
            nomeCandidato: result.nomeCandidato,
            situacao: result.situacao,
            cargo: result.cargo,
            nomeUrna: result.nome_urna,
            ultimaEleicao: result.ultimaEleicao,
            candidatoId: result.candidatoId,
        }
    })

    return {
        totalResults: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        results: cleanedResults,
    }
}

const getLastAllElections = async (candidatoId) => {
    try {
        const candidateElection = await CandidatoEleicaoModel.findAll({
            where: {
                candidato_id: candidatoId,
            },
            include: [
                {
                    model: EleicaoModel,
                    where: {
                        turno: 1,
                    },
                    attributes: ["ano_eleicao", "id"],
                },
            ],
            order: [
                [sequelize.col("eleicao.ano_eleicao"), "DESC"],
            ],
            raw: true,
            attributes: ["id", [sequelize.col("eleicao.id"), "eleicao_id"], [sequelize.col("eleicao.ano_eleicao"), "ano_eleicao"]],
        })

        if (!candidateElection) {
            throw new Error("Candidato não encontrado")
        }

        // console.log(candidateElection)

        return candidateElection
    } catch (error) {
        console.error("Error fetching votes by region:", error)
        throw error
    }
}

const getCandidatesGenderByElection = async (elecionIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds) => {
    try {
        let finder = {
            where: {
                eleicao_id: { [Sequelize.Op.in]: elecionIds },
            },
            include: [
                {
                    model: CandidatoModel,
                    include: [
                        { model: GeneroModel, attributes: [] },
                    ],
                    attributes: [],
                },
            ],
            group: [
                [Sequelize.col("candidato.genero.nome_genero")],
            ],
            attributes: [
                [Sequelize.col("candidato.genero.nome_genero"), "genero"],
            ],
            raw: true,
        }

        parseFinder(finder, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

        parseByDimension(finder, dimension)

        const candidateElection = await CandidatoEleicaoModel.findAll(finder)

        if (!candidateElection) {
            throw new Error("Resultado não encontrado")
        }

        return candidateElection
    } catch (error) {
        console.error("Error getCandidatesGenderByElection:", error)
        throw error
    }
}

const getCandidatesByYear = async (elecionIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds) => {
    try {
        let finder = {
            where: {
                eleicao_id: { [Sequelize.Op.in]: elecionIds },
            },
            include: [
                {
                    model: CandidatoModel,
                    attributes: [],
                },
                {
                    model: EleicaoModel,
                    attributes: [],
                },
            ],
            attributes: [
                [Sequelize.col("eleicao.ano_eleicao"), "ano"],
            ],
            group: [
                "ano",
            ],
            raw: true,
        }

        parseFinder(finder, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

        parseByDimension(finder, dimension)

        const candidateElection = await CandidatoEleicaoModel.findAll(finder)

        if (!candidateElection) {
            throw new Error("Resultado não encontrado")
        }

        return candidateElection
    } catch (error) {
        console.error("Error getCandidatesByYear:", error)
        throw error
    }
}

const getCompetitionByYear = async (elecionIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds) => {
    // console.log('TESTE', ocupacoesIds)
    try {
        let finder = {
            where: {
                eleicao_id: { [Sequelize.Op.in]: elecionIds },
            },
            include: [
                {
                    model: CandidatoModel,
                    attributes: [],
                },
                {
                    model: EleicaoModel,
                    attributes: [],
                },
                {
                    model: SituacaoTurnoModel,
                    required: true, // INNER JOIN
                    attributes: ["foi_eleito"],
                },
            ],
            attributes: [
                [Sequelize.col("eleicao.ano_eleicao"), "ano"],
            ],
            group: [
                "ano",
                "situacao_turno.foi_eleito",
            ],
            raw: true,
        }

        finder = parseFinder(finder, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds = ocupacoesIds, cargosIds)

        parseByDimension(finder, dimension)

        const candidateElection = await CandidatoEleicaoModel.findAll(finder)

        if (!candidateElection) {
            throw new Error("Resultado não encontrado")
        }

        return candidateElection
    } catch (error) {
        console.error("Error getCandidatesByYear:", error)
        throw error
    }
}

const getTopCandidatesByVotes = async (elecionIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, limit = 10) => {
    let select = `
        SELECT 
            subquery.candidato_id,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY subquery.total_votos) AS mediana
            -- MAX(subquery.total_votos) AS mediana
    `

    let subquerySelect = `SELECT
        ce.eleicao_id,
        ce.candidato_id, 
        SUM(vcm.quantidade_votos) as total_votos `

    let subqueryFrom = ` FROM candidato_eleicaos ce
        JOIN votacao_candidato_municipios as vcm on ce.id = vcm.candidato_eleicao_id `

    // Include situacao_turnos JOIN only if isElected is set
    if (isElected && isElected > 0) {
        subqueryFrom += " JOIN situacao_turnos st ON st.id = ce.situacao_turno_id "
    }

    let subqueryWhere = " WHERE ce.eleicao_id IN (:elecionIds)"
    let subqueryGroupBy = " GROUP BY ce.eleicao_id, ce.candidato_id"

    const replacements = { elecionIds }

    // Additional dynamic filters
    if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
        subqueryWhere += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"
        replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
    }

    if (isElected && isElected > 0) {
        subqueryWhere += " AND st.foi_eleito = :isElected"
        replacements.isElected = (Number(isElected) === 1)
    }

    if (partidos && partidos.length > 0) {
        subqueryWhere += " AND ce.partido_id IN (:partidos)"
        replacements.partidos = partidos
    }

    if (cargosIds && cargosIds.length > 0) {
        subqueryWhere += " AND ce.cargo_id IN (:cargosIds)"
        replacements.cargosIds = cargosIds
    }

    if (ocupacoesIds && ocupacoesIds.length > 0) {
        subqueryWhere += " AND ce.ocupacao_id IN (:ocupacoesIds)"
        replacements.ocupacoesIds = ocupacoesIds
    }

    // Final assembly of the subquery and main query
    let limitClause = " LIMIT :limit"
    replacements.limit = limit

    console.log("getTopCandidatesByVotes", { replacements })

    let subquery = subquerySelect + subqueryFrom + subqueryWhere + subqueryGroupBy
    let sqlQuery = select + ` FROM (${subquery}) AS subquery GROUP BY subquery.candidato_id ORDER BY mediana DESC ` + limitClause

    let sqlQueryFinal = `SELECT 
        c.nome,
        subqueryMediana.candidato_id,
        subqueryMediana.mediana
        FROM (${sqlQuery}) as subqueryMediana
        JOIN candidatos c ON c.id = subqueryMediana.candidato_id
    `

    // Execute the query
    console.log({ sqlQueryFinal })
    const results = await sequelize.query(sqlQueryFinal, {
        replacements, // Substitute placeholders
        type: Sequelize.QueryTypes.SELECT, // Define as SELECT
    })

    return results
}

// TODO: mandar as 3 para o gráfico de barrra
const getCandidatesByOccupation = async (elecionIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds) => {
    try {
        let finder = {
            where: {
                eleicao_id: { [Sequelize.Op.in]: elecionIds },
            },
            include: [
                {
                    model: CandidatoModel,
                    attributes: [],
                },
                {
                    model: ocupacaoModel,
                    attributes: [],
                    include: [
                        // {
                        //     model: categoriaModel, attributes: [],
                        // },
                        {
                            model: categoria2Model, attributes: [],
                        },
                    ],
                },

            ],
            attributes: [
                // [Sequelize.col("ocupacao.categorium.nome"), "categoria_ocupacao"],
                [Sequelize.col("ocupacao.categoria_2.nome"), "categoria_ocupacao"],
            ],
            group: [
                "categoria_ocupacao",
            ],
            raw: true,
        }

        parseFinder(finder, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

        parseByDimension(finder, dimension)

        const candidateElection = await CandidatoEleicaoModel.findAll(finder)

        if (!candidateElection) {
            throw new Error("Resultado não encontrado")
        }

        return candidateElection
    } catch (error) {
        console.error("Error getCandidatesGenderByElection:", error)
        throw error
    }
}

const getCandidatesProfileKPIs = async (elecionIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds) => {
    try {
        let sqlQuery = `
                SELECT
                    e.ano_eleicao,
                    COUNT (c.id) as total_candidatos,
                    SUM(vcm.quantidade_votos) AS total_votos,
                    SUM(ce.despesa_campanha) AS total_despesas,
                    SUM(bce.valor) AS total_bens
                FROM candidato_eleicaos ce
                    JOIN candidatos c ON ce.candidato_id = c.id
                    JOIN eleicaos e ON ce.eleicao_id = e.id
                    JOIN situacao_turnos st ON st.id = ce.situacao_turno_id
                    LEFT JOIN votacao_candidato_municipios vcm ON ce.candidato_id = vcm.candidato_eleicao_id
                    LEFT JOIN bens_candidatos bce ON ce.candidato_id  = bce.candidato_eleicao_id
                WHERE ce.eleicao_id IN (:elecionIds)
                `

        const replacements = { elecionIds }

        // Dynamic Filter Conditions
        if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
            sqlQuery += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"
            replacements.unidadesEleitoraisIds = unidadesEleitoraisIds // Add to replacements
        }

        if (isElected && isElected > 0) {
            sqlQuery += " AND st.foi_eleito = (:isElected)"
            replacements.isElected = (Number(isElected) === 1)
        }

        if (partidos && partidos.length > 0) {
            sqlQuery += " AND ce.partido_id IN (:partidos)"
            replacements.partidos = partidos
        }

        if (cargosIds && cargosIds.length > 0) {
            sqlQuery += " AND ce.cargo_id IN (:cargosIds)"
            replacements.cargosIds = cargosIds
        }

        if (ocupacoesIds && ocupacoesIds.length > 0) {
            sqlQuery += " AND ce.ocupacao_id IN (:ocupacoesIds)"
            replacements.ocupacoesIds = ocupacoesIds
        }

        sqlQuery += " GROUP BY e.ano_eleicao ORDER BY e.ano_eleicao;"

        const results = await sequelize.query(sqlQuery, {
            replacements, // Replace placeholders in the query
            type: Sequelize.QueryTypes.SELECT, // Indicate this is a SELECT query
        })

        return results
    } catch (error) {
        console.error("Error getCandidatesByYear:", error)
        throw error
    }
}

const getFinanceKPIs = async (elecionIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds) => {
    // values: [
    //     { id: 0, label: "Volume total de financiamento" }, doacoes_candidato_eleicoes
    //     { id: 1, label: "Quantidade doações" }, doacoes_candidato_eleicoes
    //     { id: 2, label: "Volume fundo eleitoral" }, where fonte_receita_id = 5
    //     { id: 3, label: "Volume fundo partidário" }, where fonte_receita_id = 1
    //     { id: 4, label: "Volume financiamento privado" }, where fonte_receita_id != 1 e fonte_receita_id != 5
    // ],
    try {
        let select = `SELECT
                    ce.eleicao_id                    
                    `

        if (dimension === 0) {
            select += ", SUM(doacoes_candidato_eleicoes.valor) as resultado"
        } else if (dimension === 1) {
            select += ", COUNT(doacoes_candidato_eleicoes.id) as resultado"
        } else if (dimension === 2) {
            select += ", SUM(doacoes_candidato_eleicoes.valor) as resultado"
        } else if (dimension === 3) {
            select += ", SUM(doacoes_candidato_eleicoes.valor) as resultado"
        } else if (dimension === 4) {
            select += ", SUM(doacoes_candidato_eleicoes.valor) as resultado"
        }

        const from = ` FROM candidato_eleicaos ce                    
                    JOIN eleicaos e ON ce.eleicao_id = e.id
                    JOIN situacao_turnos st ON st.id = ce.situacao_turno_id
                    LEFT JOIN doacoes_candidato_eleicoes ON ce.id = doacoes_candidato_eleicoes.candidato_eleicao_id  
                    `

        const where = "WHERE ce.eleicao_id IN (:elecionIds)"

        let sqlQuery = select + from + where

        const replacements = { elecionIds }

        // Dynamic Filter Conditions
        if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
            sqlQuery += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"
            replacements.unidadesEleitoraisIds = unidadesEleitoraisIds // Add to replacements
        }

        if (isElected && isElected > 0) {
            sqlQuery += " AND st.foi_eleito = (:isElected)"
            replacements.isElected = (Number(isElected) === 1)
        }

        if (partidos && partidos.length > 0) {
            sqlQuery += " AND ce.partido_id IN (:partidos)"
            replacements.partidos = partidos
        }

        if (cargosIds && cargosIds.length > 0) {
            sqlQuery += " AND ce.cargo_id IN (:cargosIds)"
            replacements.cargosIds = cargosIds
        }

        if (ocupacoesIds && ocupacoesIds.length > 0) {
            sqlQuery += " AND ce.ocupacao_id IN (:ocupacoesIds)"
            replacements.ocupacoesIds = ocupacoesIds
        }

        if (dimension === 2) {
            sqlQuery += " AND doacoes_candidato_eleicoes.fonte_receita_id = 5"
        } else if (dimension === 3) {
            sqlQuery += " AND doacoes_candidato_eleicoes.fonte_receita_id = 1"
        } else if (dimension === 4) {
            sqlQuery += "AND doacoes_candidato_eleicoes.fonte_receita_id NOT IN (1, 5)"
        }

        sqlQuery += " GROUP BY ce.eleicao_id;"

        const results = await sequelize.query(sqlQuery, {
            replacements, // Replace placeholders in the query
            type: Sequelize.QueryTypes.SELECT, // Indicate this is a SELECT query
        })

        return results
    } catch (error) {
        console.error("Error getFinanceKPIs:", error)
        throw error
    }
}

const parseDimensionFinance = (finder, dimension) => {
    if (dimension === 0) {
        finder.attributes.push([Sequelize.fn("SUM", Sequelize.col("doacoes_candidato_eleicoes.valor")), "total"])
    } else if (dimension === 1) {
        finder.attributes.push([Sequelize.fn("COUNT", Sequelize.col("doacoes_candidato_eleicoes.id")), "total"])
    } else if (dimension === 2) {
        finder.attributes.push([Sequelize.fn("SUM", Sequelize.col("doacoes_candidato_eleicoes.valor")), "total"])
        finder.include[0].where = { fonte_receita_id: 5 }
    } else if (dimension === 3) {
        finder.attributes.push([Sequelize.fn("SUM", Sequelize.col("doacoes_candidato_eleicoes.valor")), "total"])
        finder.include[0].where = { fonte_receita_id: 1 }
    } else if (dimension === 4) {
        finder.attributes.push([Sequelize.fn("SUM", Sequelize.col("doacoes_candidato_eleicoes.valor")), "total"])
        finder.include[0].where = { fonte_receita_id: { [Sequelize.Op.notIn]: [1, 5] } }
    }
}

const getFinanceCandidatesByYear = async (elecionIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds) => {
    try {
        let finder = {
            where: {
                eleicao_id: { [Sequelize.Op.in]: elecionIds },
            },
            include: [
                {
                    model: doacoesCandidatoEleicaoModel,
                    attributes: [],
                },
                {
                    model: EleicaoModel,
                    attributes: [],
                },
            ],
            attributes: [
                [Sequelize.col("eleicao.ano_eleicao"), "ano"],
            ],
            group: [
                "ano",
            ],
            raw: true,
        }

        parseFinder(finder, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds)

        parseDimensionFinance(finder, dimension)

        // console.log(finder.include[0])

        const candidateElection = await CandidatoEleicaoModel.findAll(finder)

        if (!candidateElection) {
            throw new Error("Resultado não encontrado")
        }

        return candidateElection
    } catch (error) {
        console.error("Error getCandidatesByYear:", error)
        throw error
    }
}

/**
 * busca a mediana de financiamento por partido
 * @param {*} elecionIds
 * @param {*} dimension
 * @param {*} unidadesEleitoraisIds
 * @param {*} isElected
 * @param {*} partidos
 * @param {*} ocupacoesIds
 * @param {*} cargosIds
 */
const getFinanceMedianCandidatesByParty = async (elecionIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds) => {
    try {
        let select = `SELECT
                subquery.partido,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY subquery.total) AS mediana
            `

        let subquerySelect = `SELECT
                            p.sigla AS partido,
                            doacoes_candidato_eleicoes.valor * COALESCE(fator.fator, 1) AS total                           
                        `

        let subqueryFrom = ` FROM candidato_eleicaos ce
                        JOIN partidos p ON ce.partido_id = p.id
                        LEFT JOIN doacoes_candidato_eleicoes ON ce.id = doacoes_candidato_eleicoes.candidato_eleicao_id
                        JOIN situacao_turnos st ON st.id = ce.situacao_turno_id
                        JOIN eleicaos e ON ce.eleicao_id = e.id
                        LEFT JOIN (
                            SELECT 
                                ano, 
                                valor AS fator 
                            FROM (
                                VALUES
                                    (1998, ${fatoresDeCorreção[1998]}),
                                    (2000, ${fatoresDeCorreção[2000]}),
                                    (2002, ${fatoresDeCorreção[2002]}),
                                    (2004, ${fatoresDeCorreção[2004]}),
                                    (2006, ${fatoresDeCorreção[2006]}),
                                    (2008, ${fatoresDeCorreção[2008]}),
                                    (2010, ${fatoresDeCorreção[2010]}),
                                    (2012, ${fatoresDeCorreção[2012]}),
                                    (2014, ${fatoresDeCorreção[2014]}),
                                    (2016, ${fatoresDeCorreção[2016]}),
                                    (2018, ${fatoresDeCorreção[2018]}),
                                    (2020, ${fatoresDeCorreção[2020]}),
                                    (2022, ${fatoresDeCorreção[2022]})
                            ) AS fator(ano, valor)
                        ) AS fator ON e.ano_eleicao = fator.ano
                    `

        let subqueryWhere = " WHERE ce.eleicao_id IN (:elecionIds)"
        let subqueryGroupBy = " GROUP BY p.sigla, total"

        const replacements = { elecionIds }

        if (dimension === 1) {
            subquerySelect = `SELECT
            p.sigla AS partido,
            COUNT(ce.partido_id) AS total
        `
            subqueryGroupBy = " GROUP BY p.sigla"
        } else if (dimension === 2) {
            subqueryWhere += " AND doacoes_candidato_eleicoes.fonte_receita_id = 5"
        } else if (dimension === 3) {
            subqueryWhere += " AND doacoes_candidato_eleicoes.fonte_receita_id = 1"
        } else if (dimension === 4) {
            subqueryWhere += " AND doacoes_candidato_eleicoes.fonte_receita_id NOT IN (1, 5)"
        }

        // Filtros adicionais dinâmicos
        if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
            subqueryWhere += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"
            replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
        }

        if (isElected && isElected > 0) {
            subqueryWhere += " AND st.foi_eleito = (:isElected)"
            replacements.isElected = (Number(isElected) === 1)
        }

        if (partidos && partidos.length > 0) {
            subqueryWhere += " AND ce.partido_id IN (:partidos)"
            replacements.partidos = partidos
        }

        if (cargosIds && cargosIds.length > 0) {
            subqueryWhere += " AND ce.cargo_id IN (:cargosIds)"
            replacements.cargosIds = cargosIds
        }

        if (ocupacoesIds && ocupacoesIds.length > 0) {
            subqueryWhere += " AND ce.ocupacao_id IN (:ocupacoesIds)"
            replacements.ocupacoesIds = ocupacoesIds
        }

        // Montagem final da subquery e da query principal
        let subquery = subquerySelect + subqueryFrom + subqueryWhere + subqueryGroupBy
        let sqlQuery = select + ` FROM (${subquery}) AS subquery GROUP BY subquery.partido`

        // Executa a consulta
        const results = await sequelize.query(sqlQuery, {
            replacements, // Substitui os placeholders
            type: Sequelize.QueryTypes.SELECT, // Define como SELECT
        })

        return results
    } catch (error) {
        console.error("Error getFinanceMedianCandidatesByParty:", error)
        throw error
    }
}

const getFinanceMedianCandidatesByLocation = async (elecionIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds) => {
    try {
        let select = `SELECT              
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY subquery.total) AS mediana
    `
        if (dimension === 1) {
            select = `SELECT              
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY subquery.total) AS total_doacoes
        `
        }

        // Base da subquery
        let subquerySelect = `SELECT                           
                            doacoes_candidato_eleicoes.valor * COALESCE(fator.fator, 1) AS total
                        `

        let subqueryFrom = ` FROM candidato_eleicaos ce
                        JOIN unidade_eleitorals ue ON ce.unidade_eleitoral_id = ue.id
                        LEFT JOIN doacoes_candidato_eleicoes ON ce.id = doacoes_candidato_eleicoes.candidato_eleicao_id
                        JOIN situacao_turnos st ON st.id = ce.situacao_turno_id
                        JOIN eleicaos e ON ce.eleicao_id = e.id
                        LEFT JOIN (
                            SELECT 
                                ano, 
                                valor AS fator 
                            FROM (
                                VALUES
                                    (1998, ${fatoresDeCorreção[1998]}),
                                    (2000, ${fatoresDeCorreção[2000]}),
                                    (2002, ${fatoresDeCorreção[2002]}),
                                    (2004, ${fatoresDeCorreção[2004]}),
                                    (2006, ${fatoresDeCorreção[2006]}),
                                    (2008, ${fatoresDeCorreção[2008]}),
                                    (2010, ${fatoresDeCorreção[2010]}),
                                    (2012, ${fatoresDeCorreção[2012]}),
                                    (2014, ${fatoresDeCorreção[2014]}),
                                    (2016, ${fatoresDeCorreção[2016]}),
                                    (2018, ${fatoresDeCorreção[2018]}),
                                    (2020, ${fatoresDeCorreção[2020]}),
                                    (2022, ${fatoresDeCorreção[2022]})
                            ) AS fator(ano, valor)
                        ) AS fator ON e.ano_eleicao = fator.ano
                    `

        let subqueryWhere = " WHERE ce.eleicao_id IN (:elecionIds)"
        let subqueryGroupBy = " GROUP BY ue.id, total, ue.nome, ue.codigo_ibge"

        const replacements = { elecionIds }

        if (dimension === 1) {
            subquerySelect = `SELECT            
            COUNT(ce.unidade_eleitoral_id) AS total
        `
            subqueryGroupBy = " GROUP BY ue.id"
        } else if (dimension === 2) {
            subqueryWhere += " AND doacoes_candidato_eleicoes.fonte_receita_id = 5"
        } else if (dimension === 3) {
            subqueryWhere += " AND doacoes_candidato_eleicoes.fonte_receita_id = 1"
        } else if (dimension === 4) {
            subqueryWhere += " AND doacoes_candidato_eleicoes.fonte_receita_id NOT IN (1, 5)"
        }

        // se mandar o estado agrupa por municipio, nao pode enviar por municipio
        if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
            subqueryWhere += " AND ce.unidade_eleitoral_id IN (:unidadesEleitoraisIds)"

            if (dimension === 1) {
                subquerySelect += ", ue.nome AS nome_unidade_eleitoral, ue.codigo_ibge"
                subqueryGroupBy = " GROUP BY ue.id, ue.nome, ue.codigo_ibge"
                select += ", subquery.nome_unidade_eleitoral,  subquery.codigo_ibge"
            } else {
                subquerySelect += ", ue.nome AS nome_unidade_eleitoral, ue.codigo_ibge"
                subqueryGroupBy = " GROUP BY ue.id, total, ue.nome, ue.codigo_ibge"
                select += ", subquery.nome_unidade_eleitoral, subquery.codigo_ibge"
            }

            replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
        } else {
            // se nao enviar algum id de estado, agrupa por estado
            if (dimension === 1) {
                subquerySelect += ", ue.sigla_unidade_federacao"
                subqueryGroupBy = " GROUP BY ue.sigla_unidade_federacao"
                select += ", subquery.sigla_unidade_federacao"
            } else {
                subquerySelect += ", ue.sigla_unidade_federacao"
                subqueryGroupBy = " GROUP BY ue.sigla_unidade_federacao, total"
                select += ", subquery.sigla_unidade_federacao"
            }
        }

        if (isElected && isElected > 0) {
            subqueryWhere += " AND st.foi_eleito = (:isElected)"
            replacements.isElected = (Number(isElected) === 1)
        }

        if (partidos && partidos.length > 0) {
            subqueryWhere += " AND ce.partido_id IN (:partidos)"
            replacements.partidos = partidos
        }

        if (cargosIds && cargosIds.length > 0) {
            subqueryWhere += " AND ce.cargo_id IN (:cargosIds)"
            replacements.cargosIds = cargosIds
        }

        if (ocupacoesIds && ocupacoesIds.length > 0) {
            subqueryWhere += " AND ce.ocupacao_id IN (:ocupacoesIds)"
            replacements.ocupacoesIds = ocupacoesIds
        }

        // Montagem final da subquery e da query principal
        let subquery = subquerySelect + subqueryFrom + subqueryWhere + subqueryGroupBy
        let sqlQuery
        if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
            sqlQuery = select + ` FROM (${subquery}) AS subquery GROUP BY subquery.nome_unidade_eleitoral, subquery.codigo_ibge`
        } else {
            sqlQuery = select + ` FROM (${subquery}) AS subquery GROUP BY subquery.sigla_unidade_federacao`
        }

        // Executa a consulta
        const results = await sequelize.query(sqlQuery, {
            replacements, // Substitui os placeholders
            type: Sequelize.QueryTypes.SELECT, // Define como SELECT
        })

        return results
    } catch (error) {
        console.error("Error getFinanceMedianCandidatesByLocation:", error)
        throw error
    }
}

const getVotesMedianCandidatesByLocation = async (elecionIds, dimension, unidadesEleitoraisIds, isElected, round, partidos, ocupacoesIds, cargosIds) => {
    try {
        // Base da subquery
        let subquerySelect = "SELECT ce.eleicao_id,  ue.sigla_unidade_federacao, "
        let subqueryWhere = " WHERE ce.eleicao_id IN (:elecionIds)"
        let subqueryFrom = ` FROM candidato_eleicaos ce
            JOIN eleicaos e ON ce.eleicao_id = e.id
            JOIN votacao_candidato_municipios vcm ON ce.id = vcm.candidato_eleicao_id
            JOIN municipios_votacaos mv ON mv.id = vcm.municipios_votacao_id
            JOIN unidade_eleitorals ue ON ue.sigla_unidade_eleitoral = mv.codigo_municipio
            JOIN situacao_turnos st ON st.id = ce.situacao_turno_id
        `
        let subqueryGroupBy = " GROUP BY ce.eleicao_id, ue.sigla_unidade_federacao"

        const replacements = { elecionIds }

        // Conditional handling for unidadesEleitoraisIds
        if (unidadesEleitoraisIds && unidadesEleitoraisIds.length > 0) {
            subqueryWhere += " AND ue.id IN (:unidadesEleitoraisIds)"
            replacements.unidadesEleitoraisIds = unidadesEleitoraisIds
        }

        subquerySelect += "SUM(vcm.quantidade_votos) AS total "

        // Additional filters
        if (isElected && isElected > 0) {
            subqueryWhere += " AND st.foi_eleito = (:isElected)"
            replacements.isElected = (Number(isElected) === 1)
        }

        if (partidos && partidos.length > 0) {
            subqueryWhere += " AND ce.partido_id IN (:partidos)"
            replacements.partidos = partidos
        }

        if (cargosIds && cargosIds.length > 0) {
            subqueryWhere += " AND ce.cargo_id IN (:cargosIds)"
            replacements.cargosIds = cargosIds
        }

        if (ocupacoesIds && ocupacoesIds.length > 0) {
            subqueryWhere += " AND ce.ocupacao_id IN (:ocupacoesIds)"
            replacements.ocupacoesIds = ocupacoesIds
        }

        // Final assembly of the subquery and main query
        let subquery = subquerySelect + subqueryFrom + subqueryWhere + subqueryGroupBy
        let sqlQuery

        sqlQuery = `SELECT 
                subquery.sigla_unidade_federacao,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY subquery.total) AS mediana 
                FROM (${subquery}) AS subquery 
                GROUP BY subquery.sigla_unidade_federacao`

        // Execute the query
        const results = await sequelize.query(sqlQuery, {
            replacements, // Substitute placeholders
            type: Sequelize.QueryTypes.SELECT, // Define as SELECT
        })

        return results
    } catch (error) {
        console.error("Error in getVotesMedianCandidatesByLocation:", error)
        throw error
    }
}

module.exports = {
    getFinanceMedianCandidatesByLocation,
    getFinanceMedianCandidatesByParty,
    getFinanceCandidatesByYear,
    getFinanceKPIs,
    getLastAllElections,
    getCandidatesIdsByCandidateElectionsIds,
    getLast5LastElectionsVotes,
    getLast5LastElections,
    getLatestElectionsForSearch,
    getLastElectionVotesByRegion,
    getCandidatesGenderByElection,
    getCandidatesByYear,
    getCandidatesByOccupation,
    getCandidatesProfileKPIs,
    getCompetitionByYear,
    getTopCandidatesByVotes,
    getVotesMedianCandidatesByLocation,
}
