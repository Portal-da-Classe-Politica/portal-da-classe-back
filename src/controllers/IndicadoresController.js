const {
    verifyIfIndicatorIsInGroup, getIndicatorByID, getCargoFilterByID, verifyIfCargoIsAllowedForIndicator, indicatorsGroupsGlossary,
} = require("../utils/filterParsers")
const indicadoresEleitoraisSvc = require("../services/indicadores/indicadoresEleitoraisSvc")
const IndicatorCarreiraSvc = require("../services/indicadores/indicadorCarreira")
const indicadoresGeograficosSvc = require("../services/indicadores/indicadoresGeograficosSvc")
const chartsUtil = require("../utils/chartParsers")
const UfForVotes = require("../utils/votesLocation")
const municipioVotacaoService = require("../services/MunicipiosVotacaoSvc")

const getIndicador = async (req, res) => {
    try {
        const { type, indicator_id } = req.params
        let {
            cargoId, initialYear, finalYear, unidadesEleitorais,
        } = req.query
        const isIndicatorInGroup = verifyIfIndicatorIsInGroup(indicator_id, type)
        const indicator = getIndicatorByID(indicator_id)
        if (!indicator) {
            return res.status(400).json({ success: false, message: `Indicador ${indicator_id} não encontrado` })
        }
        if (!isIndicatorInGroup) {
            return res.status(400).json({ success: false, message: `Indicador ${indicator.nome} não pertence ao grupo ${type}` })
        }
        if (!initialYear || !finalYear) {
            return res.status(400).json({ success: false, message: "Informe o ano inicial e final" })
        }
        cargoId = parseInt(cargoId) || 1
        const cargoFilter = getCargoFilterByID(parseInt(cargoId))
        if (!cargoFilter) {
            return res.status(400).json({ success: false, message: `Cargo ${cargoId} não encontrado` })
        }
        const isCargoAllowedForIndicator = verifyIfCargoIsAllowedForIndicator(indicator_id, cargoId)
        if (!isCargoAllowedForIndicator) {
            return res.status(400).json({ success: false, message: `Cargo ${cargoId} não é permitido para o indicador ${indicator.nome}` })
        }

        // if (unidadesEleitorais && !Array.isArray(unidadesEleitorais)) {
        //     unidadesEleitorais = [unidadesEleitorais]
        // }
        if (unidadesEleitorais) {
            // If it's a string, split it into an array based on commas
            if (typeof unidadesEleitorais === "string") {
                unidadesEleitorais = unidadesEleitorais.split(",").map(Number)
            }
            // If it's not already an array, wrap it in an array
            else if (!Array.isArray(unidadesEleitorais)) {
                unidadesEleitorais = [Number(unidadesEleitorais)]
            }
        }

        const indicatorData = await computeIndicator(indicator_id, cargoId, initialYear, finalYear, unidadesEleitorais)
        // console.log({ indicatorData })

        res.status(200).json({
            success: true,
            data: indicatorData,
            message: `Indicador ${indicator.nome} do grupo ${type} para o cargo ${cargoFilter.name}`,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}

const getAllIndicadorByType = async (req, res) => {
    try {
        const { type } = req.params

        // console.log({ type, indicatorsGroupsGlossary })

        res.status(200).json({
            success: true,
            data: indicatorsGroupsGlossary[type],
            message: `Indicadores do grupo ${type}`,
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const computeIndicator = async (indicatorId, cargoId, initialYear, finalYear, unidadesEleitoraisIds) => {
    switch (parseInt(indicatorId)) {
    case 1:
        const dataNepp = await indicadoresEleitoraisSvc.getNEPP(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
        return chartsUtil.parseDataToLineChart(
            dataNepp,
            seriesName = chartsUtil.indicatorsDetails[1].title,
            xAxisLabel = chartsUtil.indicatorsDetails[1].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[1].yAxisLabel,
            title = chartsUtil.indicatorsDetails[1].title,
            dataType = "float",
            xAxisKey = "year",
            yAxisKey = "sum",
            indicator_detail = 1,
        )
    case 2:
        const dataPersen = await indicadoresEleitoraisSvc.getVolatilidadeEleitoral(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
        return chartsUtil.parseDataToLineChart(
            dataPersen,
            seriesName = chartsUtil.indicatorsDetails[2].name,
            xAxisLabel = chartsUtil.indicatorsDetails[2].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[2].yAxisLabel,
            title = "Índice de Volatilidade Eleitoral (Pedersen)",
            dataType = "float",
            xAxisKey = "year",
            yAxisKey = "volatility",
            indicator_detail = 2,
        )
    case 3:
        const dataQE = await indicadoresEleitoraisSvc.getQuocienteEleitoral(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
        return chartsUtil.parseDataToLineChart(
            dataQE,
            seriesName = chartsUtil.indicatorsDetails[3].title,
            xAxisLabel = chartsUtil.indicatorsDetails[3].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[3].yAxisLabel,
            title = chartsUtil.indicatorsDetails[3].title,
            dataType = "integer",
            xAxisKey = "ano",
            yAxisKey = "quociente_eleitoral",
            indicator_detail = 3,
        )
    case 4:
        const dataQP = await indicadoresEleitoraisSvc.getQuocientePartidario(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
        return chartsUtil.parseDataToMultipleSeriesLineChart(
            dataQP,
            seriesName = "Quociente Partidário (QP)",
            xAxisLabel = "Ano",
            yAxisLabel = "QP",
            title = "Quociente Partidário (QP)",
            dataType = "integer",
            xAxisKey = "ano",
            yAxisKey = "quociente_partidario",
            seriesKey = "sigla",
            indicator_detail = 4,
        )
    case 5:
        const data = await IndicatorCarreiraSvc.getTaxaDeRenovacaoLiquida(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
        return chartsUtil.parseDataToLineChart(
            data,
            seriesName = chartsUtil.indicatorsDetails[5].title,
            xAxisLabel = chartsUtil.indicatorsDetails[5].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[5].yAxisLabel,
            title = chartsUtil.indicatorsDetails[5].title,
            dataType = "float",
            "ano",
            "total",
            indicator_detail = 5,
        )
    case 6:
        const dataReeleicao = await IndicatorCarreiraSvc.getTaxaReeleicao(cargoId, initialYear, finalYear, unidadesEleitoraisIds)

        return chartsUtil.parseDataToLineChart(
            dataReeleicao,
            seriesName = chartsUtil.indicatorsDetails[6].title,
            xAxisLabel = chartsUtil.indicatorsDetails[6].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[6].yAxisLabel,
            title = chartsUtil.indicatorsDetails[6].title,
            dataType = "float",
            "ano",
            "total",
            indicator_detail = 6,
        )
    case 7:
        const dataMedianaMigraca = await IndicatorCarreiraSvc.getMedianaMigracao(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
        return chartsUtil.parseDataToLineChart(
            dataMedianaMigraca,
            seriesName = chartsUtil.indicatorsDetails[7].title,
            xAxisLabel = chartsUtil.indicatorsDetails[7].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[7].yAxisLabel,
            title = chartsUtil.indicatorsDetails[7].title,
            "float",
            "ano_eleicao",
            "average_unique_parties",
            indicator_detail = 7,
        )

    case 8:
        const dataIPEG = await IndicatorCarreiraSvc.getIndiceParidadeEleitoralGenero(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
        return chartsUtil.parseDataToBarChart2(
            dataIPEG, // data
            title = chartsUtil.indicatorsDetails[8].title,
            xAxisLabel = chartsUtil.indicatorsDetails[8].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[8].yAxisLabel,
            totalKey = "total",
            indicator_detail = 8,
        )

    case 9:
        const dataDistribGeoVotos = await indicadoresGeograficosSvc.getDistribGeoVotos(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
        return chartsUtil.parseDataToMultipleSeriesLineChart(
            dataDistribGeoVotos,
            seriesName = chartsUtil.indicatorsDetails[9].title,
            xAxisLabel = chartsUtil.indicatorsDetails[9].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[9].yAxisLabel,
            title = chartsUtil.indicatorsDetails[9].title,
            dataType = "integer",
            xAxisKey = "year",
            yAxisKey = "percentual_votos",
            seriesKey = "regiao",
            indicator_detail = 9,
        )
    case 10:
        const dataConceGeoVotos = await indicadoresGeograficosSvc.getConcentracaoRegionalVotos(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
        return chartsUtil.parseDataToMultipleSeriesLineChart(
            dataConceGeoVotos,
            seriesName = chartsUtil.indicatorsDetails[10].title,
            xAxisLabel = chartsUtil.indicatorsDetails[10].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[10].yAxisLabel,
            title = chartsUtil.indicatorsDetails[10].title,
            dataType = "float",
            xAxisKey = "year",
            yAxisKey = "percentual_votos",
            seriesKey = "regiao",
            indicator_detail = 10,
        )
    case 11:
        const dataDispereoVotos = await indicadoresGeograficosSvc.getDispersaoRegionalVotos(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
        return chartsUtil.parseDataToMultipleSeriesLineChart(
            dataDispereoVotos,
            seriesName = chartsUtil.indicatorsDetails[11].title,
            xAxisLabel = chartsUtil.indicatorsDetails[11].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[11].yAxisLabel,
            title = chartsUtil.indicatorsDetails[11].title,
            dataType = "float",
            xAxisKey = "year",
            yAxisKey = "coefficient_variation",
            seriesKey = "nome",
            indicator_detail = 11,
        )
    case 12:
        const dataEficienciaVotos = await indicadoresGeograficosSvc.getEficienciaVotos(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
        return chartsUtil.parseDataToMultipleSeriesLineChart(
            dataEficienciaVotos,
            seriesName = chartsUtil.indicatorsDetails[12].title,
            xAxisLabel = chartsUtil.indicatorsDetails[12].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[12].yAxisLabel,
            title = chartsUtil.indicatorsDetails[12].title,
            dataType = "float",
            xAxisKey = "year",
            yAxisKey = "iev",
            seriesKey = "sigla",
            indicator_detail = 12,
        )
    case 13:
        const dataCustoVoto = await IndicatorCarreiraSvc.getTaxaCustoPorVoto(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
        return chartsUtil.generateLineChartData(
            dataCustoVoto, // data
            "ano", // xAxisLabel
            "TCV", // yAxisLabel
            seriesKey = "partido", // Campo categórico (Exemplo: 'partido')
            seriesName = chartsUtil.indicatorsDetails[13].title,
            xAxisLabel = chartsUtil.indicatorsDetails[13].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[13].yAxisLabel,
            "float", // type
            indicator_detail = 13,
        )

    case 14:
        const dataIEAR = await IndicatorCarreiraSvc.getIndiceIgualdadeAcessoRecursos(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
        return chartsUtil.parseDataToLineChart(
            dataIEAR,
            seriesName = chartsUtil.indicatorsDetails[14].title,
            xAxisLabel = chartsUtil.indicatorsDetails[14].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[14].yAxisLabel,
            "Índice de Igualdade de Acesso a Recursos",
            "float",
            "ano",
            "IEAR",
            indicator_detail = 14,
        )

        /**
         * @AcacioTelechi
         * Índice de Diversidade Econômica entre Candidatos teria que passar um determinado candidato e isso não esta previsto nos filtros
         */
    case 15:
        const dataDiversidadeEcon = await IndicatorCarreiraSvc.getIndiceDiversidadeEconomica(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
        return chartsUtil.parseDataToLineChart(
            dataDiversidadeEcon,
            xAxisLabel = chartsUtil.indicatorsDetails[15].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[15].yAxisLabel,
            seriesName = chartsUtil.indicatorsDetails[15].title,
            title = chartsUtil.indicatorsDetails[15].title,
            "float",
            seriesKey = "ano_eleicao",
            "sum",
            indicator_detail = 15,
        )
    case 16:
        const dataPatrimonio = await IndicatorCarreiraSvc.getMediaMedianaPatrimonio(cargoId, initialYear, finalYear, unidadesEleitoraisIds)

        return chartsUtil.generateLineChartDataForMultipleLines(
            dataPatrimonio, // data
            "ano", // xAxisLabel
            seriesName = chartsUtil.indicatorsDetails[16].title, // seriesName
            xAxisLabel = chartsUtil.indicatorsDetails[16].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[16].yAxisLabel,
            "float", // type
            indicator_detail = 16,
        )
    default:
        return null
    }
}

const getUFVotes = async (req, res) => {
    try {
        res.status(200).json({ success: true, data: UfForVotes, message: "Siglas agrupadoras de locais de votação" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getCitiesVotesByUF = async (req, res) => {
    try {
        const { uf } = req.params
        const data = await municipioVotacaoService.getMunicipiosByUF(uf)
        res.status(200).json({ success: true, data, message: `Cidades de votação do estado ${uf}` })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
    getIndicador, getAllIndicadorByType, getUFVotes, getCitiesVotesByUF,
}
