const {
    verifyIfIndicatorIsInGroup, getIndicatorByID, getCargoFilterByID, verifyIfCargoIsAllowedForIndicator, indicatorsGroupsGlossary,
} = require("../utils/filterParsers")
const indicadoresEleitoraisSvc = require("../services/indicadores/indicadoresEleitoraisSvc")
const IndicatorCarreiraSvc = require("../services/indicadores/indicadorCarreira")
const indicadoresGeograficosSvc = require("../services/indicadores/indicadoresGeograficosSvc")
const chartsUtil = require("../utils/chartParsers")

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
            if (typeof unidadesEleitorais === 'string') {
                unidadesEleitorais = unidadesEleitorais.split(',').map(Number);
            }
            // If it's not already an array, wrap it in an array
            else if (!Array.isArray(unidadesEleitorais)) {
                unidadesEleitorais = [Number(unidadesEleitorais)];
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
                seriesName = 'Número Efetivo de Partidos',
                xAxisLabel = 'Ano',
                yAxisLabel = 'NEPP',
                title = 'Número Efetivo de Partidos',
                dataType = 'float',
                xAxisKey = 'year',
                yAxisKey = 'sum'
            )
        case 2:
            const dataPersen = await indicadoresEleitoraisSvc.getVolatilidadeEleitoral(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
            return chartsUtil.parseDataToLineChart(
                dataPersen,
                seriesName = 'Índice de Volatilidade Eleitoral (Pedersen)',
                xAxisLabel = 'Ano',
                yAxisLabel = 'Volatilidade',
                title = 'Índice de Volatilidade Eleitoral (Pedersen)',
                dataType = 'float',
                xAxisKey = 'year',
                yAxisKey = 'volatility'
            )
        case 3:
            const dataQE = await indicadoresEleitoraisSvc.getQuocienteEleitoral(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
            return chartsUtil.parseDataToLineChart(
                dataQE,
                seriesName = 'Quociente Eleitoral (QE)',
                xAxisLabel = 'Ano',
                yAxisLabel = 'QE',
                title = 'Quociente Eleitoral (QE)',
                dataType = 'integer',
                xAxisKey = 'ano',
                yAxisKey = 'quociente_eleitoral'
            )
        case 4:
            const dataQP = await indicadoresEleitoraisSvc.getQuocientePartidario(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
            return chartsUtil.parseDataToMultipleSeriesLineChart(
                dataQP,
                seriesName = 'Quociente Partidário (QP)',
                xAxisLabel = 'Ano',
                yAxisLabel = 'QP',
                title = 'Quociente Partidário (QP)',
                dataType = 'integer',
                xAxisKey = 'ano',
                yAxisKey = 'quociente_partidario',
                seriesKey = "sigla"
            )
        case 5:
            // Gráfico de linhas:
            // Eixo X: Tempo (por ano ou eleição)
            // Eixo Y: Taxa de renovação líquida
            const data = await IndicatorCarreiraSvc.getTaxaDeRenovacaoLiquida(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
            return chartsUtil.parseDataToLineChart(
                data,
                "Taxa de Renovação Líquida",
                "Ano",
                "Taxa de Renovação Líquida (%)",
                "Taxa de Renovação Líquida",
                "float",
            )
        case 6:
            const dataReeleicao = await IndicatorCarreiraSvc.getTaxaReeleicao(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
            // Gráfico de linhas:
            // Eixo X: Tempo (por ano ou eleição)
            // Eixo Y: Taxa de reeleição
            return chartsUtil.parseDataToLineChart(
                dataReeleicao,
                "Taxa de Reeleição",
                "Ano",
                "Taxa de Reeleição (%)",
                "Taxa de Reeleição",
                "float",
            )
        /**
         * @AcacioTelechi
         * Taxa de Migração Partidária teria que passar um determinado candidato e isso não esta previsto nos filtros
         */
        case 7:
            // Taxa de Migração Partidária
            // TMP = (NMP / TCP)
            // NMP é o número de mudanças de partido que o candidato realizou ao longo de sua carreira
            // TCP é o tempo de carreira política do candidato (em anos)
            return // JOCA TODO
        case 8:
            const dataIPEG = await IndicatorCarreiraSvc.getIndiceParidadeEleitoralGenero(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
            // Gráfico de linhas:
            // Eixo X: Tempo (por ano ou eleição)
            // Eixo Y: Índice de Paridade Eleitoral de Gênero
            // console.log({ dataIPEG })
            return chartsUtil.parseDataToBarChart2(
                dataIPEG, // data
                "Índice de Paridade Eleitoral de Gênero", // ttile
                "Ano", // seriesName
                "ano", // itemKey
                "total", // totalKey
            )

        case 9:
            const dataDistribGeoVotos = await indicadoresGeograficosSvc.getDistribGeoVotos(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
            return chartsUtil.parseDataToMultipleSeriesLineChart(
                dataDistribGeoVotos,
                seriesName = 'Distribuição de Votos por Região',
                xAxisLabel = 'Ano',
                yAxisLabel = 'Distribuição de Votos por Região',
                title = 'Distribuição de Votos por Região',
                dataType = 'integer',
                xAxisKey = 'year',
                yAxisKey = 'percentual_votos',
                seriesKey = "regiao"
            )
        case 10:
            const dataConceGeoVotos = await indicadoresGeograficosSvc.getConcentracaoRegionalVotos(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
            return chartsUtil.parseDataToLineChart(
                dataConceGeoVotos,
                seriesName = 'Índice de Concentração Regional do Voto',
                xAxisLabel = 'Ano',
                yAxisLabel = 'Índice de Concentração Regional do Voto',
                title = 'Índice de Concentração Regional do Voto',
                dataType = 'float',
                xAxisKey = 'year',
                yAxisKey = 'sum'
            )
        case 11:
            const dataDispereoVotos = await indicadoresGeograficosSvc.getDispersaoRegionalVotos(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
            return chartsUtil.parseDataToMultipleSeriesLineChart(
                dataDispereoVotos,
                seriesName = 'Índice de Dispersão do Voto',
                xAxisLabel = 'Ano',
                yAxisLabel = 'Índice de Dispersão do Voto',
                title = 'Índice de Dispersão do Voto',
                dataType = 'float',
                xAxisKey = 'year',
                yAxisKey = 'coefficient_variation',
                seriesKey = "nome"
            )
        case 12:
            const dataEficienciaVotos = await indicadoresGeograficosSvc.getEficienciaVotos(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
            return chartsUtil.parseDataToMultipleSeriesLineChart(
                dataEficienciaVotos,
                seriesName = 'Índice de Eficiência do Voto',
                xAxisLabel = 'Ano',
                yAxisLabel = 'Índice de Eficiência do Voto',
                title = 'Índice de Eficiência do Voto',
                dataType = 'float',
                xAxisKey = 'year',
                yAxisKey = 'iev',
                seriesKey = 'sigla'
            )
        case 13:
            const dataCustoVoto = await IndicatorCarreiraSvc.getTaxaCustoPorVoto(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
            // Gráfico de Linhas:
            // Eixo X: Tempo (por ano, eleição)
            // Eixo Y: Taxa de Custo por Voto
            // Linhas: partido
            return chartsUtil.generateLineChartData(
                dataCustoVoto, // data
                "ano", // xAxisLabel
                "TCV", // yAxisLabel
                "partido", // Campo categórico (Exemplo: 'partido')
                "Taxa de Custo por Voto", // Título do gráfico
                "Ano", /// / Rótulo do eixo X
                "TCV (Taxa de Custo por Voto)", // Rótulo do eixo Y
                "float", // type
            )

        case 14:
            // Gráfico de Linhas:
            // Eixo X: Tempo (por ano, eleição)
            // Eixo Y: Índice de Igualdade de Acesso a Recursos
            const dataIEAR = await IndicatorCarreiraSvc.getIndiceIgualdadeAcessoRecursos(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
            return chartsUtil.parseDataToLineChart(
                dataIEAR,
                "Índice de Igualdade de Acesso a Recursos",
                "Ano",
                "Índice de Igualdade de Acesso a Recursos",
                "Índice de Igualdade de Acesso a Recursos",
                "float",
                "ano",
                "IEAR",
            )

        /**
         * @AcacioTelechi
         * Índice de Diversidade Econômica entre Candidatos teria que passar um determinado candidato e isso não esta previsto nos filtros
         */
        case 15:
            // Índice de Diversidade Econômica entre Candidatos
            // HHI = ∑(Si)^2
            // Si é a participação dos recursos financeiros do candidato i no total de recursos (como uma fração ou porcentagem)
            // n é o número total de candidatos

            const dataDiversidadeEcon = await IndicatorCarreiraSvc.getIndiceDiversidadeEconomica(cargoId, initialYear, finalYear, unidadesEleitoraisIds)
            return chartsUtil.parseDataToLineChart(
                dataDiversidadeEcon,
                "Índice de Diversidade Econômica",
                "Ano",
                "Índice de Diversidade Econômica",
                "Índice de Diversidade Econômica",
                "float",
                "ano_eleicao",
                "sum",
            )
        case 16:
            // Média e Mediana de Patrimônio da Classe Política
            // Média e mediana dos patrimônios declarados pelos candidatos
            const dataPatrimonio = await IndicatorCarreiraSvc.getMediaMedianaPatrimonio(cargoId, initialYear, finalYear, unidadesEleitoraisIds)

            return chartsUtil.generateLineChartDataForMultipleLines(
                dataPatrimonio, // data
                "ano", // xAxisLabel
                "Média e Mediana de Patrimônio da Classe Política",
                "Ano",
                "Valor (R$)",
                "float", // type
            )
        default:
            return null
    }
}

module.exports = {
    getIndicador, getAllIndicadorByType,
}
