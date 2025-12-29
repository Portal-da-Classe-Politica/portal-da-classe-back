const {
    verifyIfIndicatorIsInGroup, getIndicatorByID, getCargoFilterByID, verifyIfCargoIsAllowedForIndicator, indicatorsGroupsGlossary,
} = require("../utils/filterParsers")
const { expandCargoIds } = require("../services/CargoService")
const { splitPSDByYear } = require("../services/AnalisesSvc")
const indicadoresEleitoraisSvc = require("../services/indicadores/indicadoresEleitoraisSvc")
const IndicatorCarreiraSvc = require("../services/indicadores/indicadorCarreira")
const indicadoresGeograficosSvc = require("../services/indicadores/indicadoresGeograficosSvc")
const chartsUtil = require("../utils/chartParsers")
const UfForVotes = require("../utils/votesLocation")
const municipioVotacaoService = require("../services/MunicipiosVotacaoSvc")
const { getElectoralUnitByUFandAbrangency } = require("../services/UnidateEleitoralService")
const logger = require("../utils/logger")
const { Parser } = require("json2csv") // no topo do arquivo
const { convertDecimalSeparatorInData } = require("../utils/csvUtils")
const parser = new Parser({
    delimiter: ";",
})
const footer = "\nFonte: Portal da Classe Política - INCT ReDem (2025)"

const getIndicador = async (req, res) => {
    try {
        console.log("getIndicador called with params:", req.params, "and query:", req.query)
        const { type, indicator_id } = req.params
        let {
            cargoId, initialYear, finalYear, unidadesEleitorais, UF, partyId, exportcsv, round,
        } = req.query
        if (!exportcsv){
            exportcsv = "false"
        }
        if (!round){
            round = [1]
        }
        if (round == "all") {
            round = [1, 2]
        }
        if (round && !Array.isArray(round)){
            round = [Number(round)]
        }
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
        // console.log({ cargoId, cargoFilter })

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

        let indicatorData = await computeIndicator(indicator_id, cargoId, initialYear, finalYear, unidadesEleitorais, UF, partyId, exportcsv, round)
        // console.log({ indicatorData })

        if (exportcsv === "true") {
            indicatorData += footer
            console.log("Exportando CSV")
            res.header("Content-Type", "text/csv")
            res.attachment(`indicador_${indicator_id}.csv`)
            return res.send(indicatorData)
        }

        return res.status(200).json({
            success: true,
            data: indicatorData,
            message: `Indicador ${indicator.nome} do grupo ${type} para o cargo ${cargoFilter.name}`,
        })
    } catch (error) {
        // console.log({ error })
        logger.error(error)
        res.status(500).json({ message: error.message })
    }
}

const getAllIndicadorByType = async (req, res) => {
    try {
        const { type } = req.params

        // console.log({ type, data: indicatorsGroupsGlossary[type] })

        res.status(200).json({
            success: true,
            data: indicatorsGroupsGlossary[type],
            message: `Indicadores do grupo ${type}`,
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const computeIndicator = async (indicatorId, cargoId, initialYear, finalYear, unidadesEleitoraisIds, UF, partyId, exportcsv, round) => {
    // Expande cargo_id 1 (deputado estadual) para incluir cargo_id 6 (deputado distrital)
    const expandedCargoId = expandCargoIds(cargoId)

    switch (parseInt(indicatorId)) {
    case 1:
        const dataNepp = await indicadoresEleitoraisSvc.getNEPP(expandedCargoId, initialYear, finalYear, unidadesEleitoraisIds, round)
        if (exportcsv === "true") {
            return parser.parse(convertDecimalSeparatorInData(dataNepp)) // CSV direto do banco
        }
        return chartsUtil.parseDataToLineChart(
            dataNepp,
            seriesName = chartsUtil.indicatorsDetails[1].title,
            xAxisLabel = chartsUtil.indicatorsDetails[1].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[1].yAxisLabel,
            title = chartsUtil.indicatorsDetails[1].title,
            dataType = "float",
            xAxisKey = "ano",
            yAxisKey = "nepp",
            indicator_detail = 1,
        )
    case 2:
        const dataPersen = await indicadoresEleitoraisSvc.getVolatilidadeEleitoral(expandedCargoId, initialYear, finalYear, unidadesEleitoraisIds, round)
        if (exportcsv === "true") {
            return parser.parse(convertDecimalSeparatorInData(dataPersen)) // CSV direto do banco
        }
        return chartsUtil.parseDataToLineChart(
            dataPersen,
            seriesName = chartsUtil.indicatorsDetails[2].name,
            xAxisLabel = chartsUtil.indicatorsDetails[2].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[2].yAxisLabel,
            title = "Índice de Volatilidade Eleitoral (Pedersen)",
            dataType = "float",
            xAxisKey = "ano",
            yAxisKey = "volatilidade",
            indicator_detail = 2,
        )
    case 3:
        const dataQE = await indicadoresEleitoraisSvc.getQuocienteEleitoral(expandedCargoId, initialYear, finalYear, unidadesEleitoraisIds, round)
        if (exportcsv === "true") {
            return parser.parse(convertDecimalSeparatorInData(dataQE)) // CSV direto do banco
        }
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
    case 5:
        const data = await IndicatorCarreiraSvc.getTaxaDeRenovacaoLiquida(expandedCargoId, initialYear, finalYear, unidadesEleitoraisIds, round)
        if (exportcsv === "true") {
            return parser.parse(convertDecimalSeparatorInData(data)) // CSV direto do banco
        }
        return chartsUtil.parseDataToLineChart(
            data,
            seriesName = chartsUtil.indicatorsDetails[5].title,
            xAxisLabel = chartsUtil.indicatorsDetails[5].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[5].yAxisLabel,
            title = chartsUtil.indicatorsDetails[5].title,
            dataType = "float",
            "ano",
            "taxa_renovacao_liquida",
            indicator_detail = 5,
        )
    case 6:
        const dataReeleicao = await IndicatorCarreiraSvc.getTaxaReeleicao(expandedCargoId, initialYear, finalYear, unidadesEleitoraisIds, round)
        if (exportcsv === "true") {
            return parser.parse(convertDecimalSeparatorInData(dataReeleicao)) // CSV direto do banco
        }
        return chartsUtil.parseDataToLineChart(
            dataReeleicao,
            seriesName = chartsUtil.indicatorsDetails[6].title,
            xAxisLabel = chartsUtil.indicatorsDetails[6].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[6].yAxisLabel,
            title = chartsUtil.indicatorsDetails[6].title,
            dataType = "float",
            "ano",
            "taxa_reeleicao",
            indicator_detail = 6,
        )

    case 8:
        const dataIPEG = await IndicatorCarreiraSvc.getIndiceParidadeEleitoralGenero(expandedCargoId, initialYear, finalYear, unidadesEleitoraisIds, round)
        if (exportcsv === "true") {
            return parser.parse(convertDecimalSeparatorInData(dataIPEG)) // CSV direto do banco
        }
        const objectDataIPEG = chartsUtil.parseDataToBarChart2(
            dataIPEG, // data
            title = chartsUtil.indicatorsDetails[8].title,
            seriesName = chartsUtil.indicatorsDetails[8].yAxisLabel,
            itemKey = "ano",
            totalKey = "indice_paridade_eleitoral_genero",
            indicator_detail = 8,
        )

        return objectDataIPEG

    case 10:
        const dataConceGeoVotos = await indicadoresGeograficosSvc.getConcentracaoRegionalVotos(expandedCargoId, initialYear, finalYear, unidadesEleitoraisIds, UF, partyId, round)
        if (exportcsv === "true") {
            return parser.parse(convertDecimalSeparatorInData(dataConceGeoVotos)) // CSV direto do banco
        }
        return chartsUtil.parseDataToMultipleSeriesLineChart(
            dataConceGeoVotos,
            seriesName = chartsUtil.indicatorsDetails[10].title,
            xAxisLabel = chartsUtil.indicatorsDetails[10].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[10].yAxisLabel,
            title = chartsUtil.indicatorsDetails[10].title,
            dataType = "float",
            xAxisKey = "ano",
            yAxisKey = "percentual_votos",
            seriesKey = "regiao",
            indicator_detail = 10,
        )
    case 11:
        const dataDispereoVotos = splitPSDByYear(await indicadoresGeograficosSvc.getDispersaoRegionalVotos(expandedCargoId, initialYear, finalYear, unidadesEleitoraisIds, round))
        if (exportcsv === "true") {
            return parser.parse(convertDecimalSeparatorInData(dataDispereoVotos)) // CSV direto do banco
        }
        return chartsUtil.parseDataToMultipleSeriesLineChart(
            dataDispereoVotos,
            seriesName = chartsUtil.indicatorsDetails[11].title,
            xAxisLabel = chartsUtil.indicatorsDetails[11].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[11].yAxisLabel,
            title = chartsUtil.indicatorsDetails[11].title,
            dataType = "float",
            xAxisKey = "ano",
            yAxisKey = "coeficente_variacao",
            seriesKey = "sigla_atual",
            indicator_detail = 11,
        )

    case 14:
        const dataIEAR = await IndicatorCarreiraSvc.getIndiceIgualdadeAcessoRecursos(expandedCargoId, initialYear, finalYear, unidadesEleitoraisIds, round)
        if (exportcsv === "true") {
            return parser.parse(convertDecimalSeparatorInData(dataIEAR)) // CSV direto do banco
        }
        return chartsUtil.parseDataToLineChart(
            dataIEAR,
            seriesName = chartsUtil.indicatorsDetails[14].title,
            xAxisLabel = chartsUtil.indicatorsDetails[14].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[14].yAxisLabel,
            chartsUtil.indicatorsDetails[14].title,
            "float",
            "ano",
            "IDAR",
            indicator_detail = 14,
        )

    case 15:
        const dataDiversidadeEcon = await IndicatorCarreiraSvc.getIndiceDiversidadeEconomica(expandedCargoId, initialYear, finalYear, unidadesEleitoraisIds, round)
        if (exportcsv === "true") {
            return parser.parse(convertDecimalSeparatorInData(dataDiversidadeEcon)) // CSV direto do banco
        }
        return chartsUtil.parseDataToLineChart(
            dataDiversidadeEcon,
            chartsUtil.indicatorsDetails[15].title,
            chartsUtil.indicatorsDetails[15].xAxisLabel,
            chartsUtil.indicatorsDetails[15].yAxisLabel,
            chartsUtil.indicatorsDetails[15].title,
            "float",
            seriesKey = "ano_eleicao",
            "indice_concentracao_patrimonio",
            indicator_detail = 15,
        )
    case 16:
        const dataPatrimonio = await IndicatorCarreiraSvc.getMediaMedianaPatrimonio(expandedCargoId, initialYear, finalYear, unidadesEleitoraisIds, round)
        if (exportcsv === "true") {
            return parser.parse(convertDecimalSeparatorInData(dataPatrimonio)) // CSV direto do banco
        }
        return chartsUtil.generateLineChartDataForMultipleLines(
            dataPatrimonio, // data
            "ano", // xAxisLabel
            seriesName = chartsUtil.indicatorsDetails[16].title, // seriesName
            xAxisLabel = chartsUtil.indicatorsDetails[16].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[16].yAxisLabel,
            "float", // type
            indicator_detail = 16,
        )
    case 12:
        const dataUnparsed = await IndicatorCarreiraSvc.getGallagherLSq(expandedCargoId, initialYear, finalYear, unidadesEleitoraisIds, round)
        const dataGellagher = splitPSDByYear(dataUnparsed)
        if (exportcsv === "true") {
            return parser.parse(convertDecimalSeparatorInData(dataGellagher)) // CSV direto do banco
        }
        return chartsUtil.generateLineChartData(
            dataGellagher,
            "ano",
            "lsq",
            "sigla_atual",
            seriesName = chartsUtil.indicatorsDetails[12].title,
            xAxisLabel = chartsUtil.indicatorsDetails[12].xAxisLabel,
            yAxisLabel = chartsUtil.indicatorsDetails[12].yAxisLabel,
            chartsUtil.indicatorsDetails[12].title,

            indicator_detail = 12,
        )
    default:
        console.log("Indicador não implementado")
        logger.error("Indicador não implementado")
        return null
    }
}

const getUFVotes = async (req, res) => {
    try {
        let {
            cargoId,
        } = req.query
        let filteredUfForVotes = UfForVotes
        if (cargoId && parseInt(cargoId) !== 9) {
            filteredUfForVotes = UfForVotes.filter((uf) => uf.label !== "Exterior" && uf.label !== "Voto de Trânsito")
        }
        res.status(200).json({ success: true, data: filteredUfForVotes, message: "Siglas agrupadoras de locais de votação" })
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
