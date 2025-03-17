const CandidatoEleicaoService = require("../services/CandidatoEleicaoSvc")
const EleicaoService = require("../services/EleicaoSvc")
const cargoService = require("../services/CargoService")
const { parseDataToDonutChart, parseDataToLineChart, parseDataToBarChart } = require("../utils/chartParsers")
const { validateParams } = require("../utils/validators")
const { logger } = require("../utils/logger")

const getCandidatesByYear = async (req, res) => {
    try {
        let params
        try {
            params = await validateParams(req.query, "candidates")
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                data: {},
                message: validationError.message,
            })
        }

        const {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca,
        } = params

        const abrangencyByCargo = await cargoService.getAbragencyByCargoID(cargosIds)

        if (!abrangencyByCargo) {
            return res.status(400).json({
                success: false,
                data: {},
                message: "Cargo não encontrado",
            })
        }

        const elections = await EleicaoService.getElectionsByYearIntervalAndAbragency(initialYear, finalYear, round, abrangencyByCargo.abrangencia)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getCandidatesByYear(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca)

        const parsedData = parseDataToLineChart(resp, "Total", "Anos", "Candidatos", "Candidatos histórico")

        return res.json({
            success: true,
            data: parsedData,
            message: "Dados buscados com sucesso.",

        })
    } catch (error) {
        logger.log(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar candidatos por gênero",
        })
    }
}

const getCandidatesByGender = async (req, res) => {
    try {
        let params
        try {
            params = await validateParams(req.query, "candidates")
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                data: {},
                message: validationError.message,
            })
        }

        const {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca,
        } = params

        const abrangencyByCargo = await cargoService.getAbragencyByCargoID(cargosIds)

        if (!abrangencyByCargo) {
            return res.status(400).json({
                success: false,
                data: {},
                message: "Cargo não encontrado",
            })
        }

        const elections = await EleicaoService.getElectionsByYearIntervalAndAbragency(initialYear, finalYear, round, abrangencyByCargo.abrangencia)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getCandidatesGenderByElection(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca)

        if (resp && resp.length) {
            const parsedData = parseDataToDonutChart(resp, "genero", "total", "Proporção de candidatos por gênero")

            return res.json({
                success: true,
                data: parsedData,
                message: "Dados buscados com sucesso.",

            })
        }
        return res.status(400).json({
            success: false,
            data: {},
            message: "Não foram encontrados resultados para a busca.",
        })
    } catch (error) {
        logger.log(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar candidatos por gênero",
        })
    }
}

const getCandidatesByOcupations = async (req, res) => {
    try {
        let params
        try {
            params = await validateParams(req.query, "candidates")
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                data: {},
                message: validationError.message,
            })
        }

        const {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca,
        } = params

        const abrangencyByCargo = await cargoService.getAbragencyByCargoID(cargosIds)

        if (!abrangencyByCargo) {
            return res.status(400).json({
                success: false,
                data: {},
                message: "Cargo não encontrado",
            })
        }

        const elections = await EleicaoService.getElectionsByYearIntervalAndAbragency(initialYear, finalYear, round, abrangencyByCargo.abrangencia)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getCandidatesByOccupation(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca)
        if (resp && resp.length) {
            const parsedData = parseDataToBarChart(resp, "Distribuição do total por categoria de ocupação", "Total")

            return res.json({
                success: true,
                data: parsedData,
                message: "Dados buscados com sucesso.",
            })
        }

        return res.status(400).json({
            success: false,
            data: {},
            message: "Não foram encontrados resultados para a busca.",

        })
    } catch (error) {
        logger.log(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar candidatos por gênero",
        })
    }
}

const getCandidatesKPIs = async (req, res) => {
    try {
        let params
        try {
            params = await validateParams(req.query, "candidates")
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                data: {},
                message: validationError.message,
            })
        }

        const {
            dimension, initialYear, finalYear, round, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca,
        } = params

        const abrangencyByCargo = await cargoService.getAbragencyByCargoID(cargosIds)

        if (!abrangencyByCargo) {
            return res.status(400).json({
                success: false,
                data: {},
                message: "Cargo não encontrado",
            })
        }

        const elections = await EleicaoService.getElectionsByYearIntervalAndAbragency(initialYear, finalYear, round, abrangencyByCargo.abrangencia)
        const electionsIds = elections.map((i) => i.id)

        const resp = await CandidatoEleicaoService.getCandidatesProfileKPIs(electionsIds, dimension, unidadesEleitoraisIds, isElected, partidos, ocupacoesIds, cargosIds, raca)

        if (resp && resp.length) {
            const finalYearTotalCandidatos = resp[resp.length - 1].total_candidatos
            const initialYearTotalCandidatos = resp[0].total_candidatos

            const totalCandidatos = resp.reduce((sum, item) => sum + Number(item.total_candidatos), 0)
            const totalBensSum = resp.reduce((sum, item) => sum + Number(item.total_bens), 0)
            const totalDespesasSum = resp.reduce((sum, item) => sum + Number(item.total_despesas), 0)

            const kpi1 = (finalYearTotalCandidatos - initialYearTotalCandidatos).toLocaleString("pt-BR")
            const kpi2 = (totalBensSum / totalCandidatos).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            const kpi3 = (totalDespesasSum / totalCandidatos).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

            const finalData = [
                {
                    label: "Variação Absoluta no número de candidatos",
                    value: kpi1,
                    description: `A quantidade de candidatos variou ${kpi1} entre ${initialYear} e ${finalYear}.`,
                },
                {
                    label: "Média de bens declarados por candidato",
                    value: `R$ ${kpi2}`,
                    description: `A média de bens declarados por candidato foi de R$ ${kpi2} no período entre ${initialYear} e ${finalYear}.`,
                },
                {
                    label: "Média de despesas por candidato",
                    value: `R$ ${kpi3}`,
                    description: `A média de despesas por candidato foi de R$ ${kpi3} no período entre ${initialYear} e ${finalYear}.`,
                },

            ]

            return res.json({
                success: true,
                title: "Indicadores sobre candidatos",
                data: finalData,
                // resp,
                message: "Dados buscados com sucesso.",

            })
        }
        return res.status(400).json({
            success: false,
            data: {},
            message: "Não foram encontrados resultados para a busca.",
        })
    } catch (error) {
        logger.log(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar candidatos por gênero",
        })
    }
}

module.exports = {
    getCandidatesByYear,
    getCandidatesByGender,
    getCandidatesByOcupations,
    getCandidatesKPIs,
}
