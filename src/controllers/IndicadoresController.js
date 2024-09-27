const {
    verifyIfIndicatorIsInGroup, getIndicatorByID, getCargoFilterByID, verifyIfCargoIsAllowedForIndicator, indicatorsGroupsGlossary,
} = require("../utils/filterParsers")
const IndicatorsSvc = require("../services/IndicatorsSvc")
const IndicatorCarreiraSvc = require("../services/indicadores/indicadorCarreira")
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

        if (unidadesEleitorais && !Array.isArray(unidadesEleitorais)) {
            unidadesEleitorais = [unidadesEleitorais]
        }

        const indicatorData = await computeIndicator(indicator_id, cargoId, initialYear, finalYear, unidadesEleitorais)
        console.log({ indicatorData })

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
        return IndicatorsSvc.getNEPP(cargoId, initialYear, finalYear)
    case 2:
        return //  acacio TODO
    case 3:
        return //  acacio TODO
    case 4:
        return //  acacio TODO
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
    case 7:
        // Taxa de Migração Partidária
        // TMP = (NMP / TCP)
        // NMP é o número de mudanças de partido que o candidato realizou ao longo de sua carreira
        // TCP é o tempo de carreira política do candidato (em anos)
        return // JOCA TODO
    case 8:
        // Índice de Paridade Eleitoral de Gênero
        // IPEG = (PME / PCM) * 100
        // PME é a proporção de mulheres eleitas (nº de mulheres eleitas pelo nº total de eleitos)
        // PCM é proporção de candidatas mulheres (nº de candidatas mulheres pelo nº total de candidatos)
        return // JOCA TODO
    case 9:
        return //  acacio TODO
    case 10:
        return //  acacio TODO
    case 11:
        return //  acacio TODO
    case 12:
        return //  acacio TODO
    case 13:
        // Taxa de Custo por Voto
        // TCV = (C / V)
        // C é o custo da campanha
        // V é o número de votos obtidos
        return // JOCA TODO
    case 14:
        // Índice de Igualdade de Acesso a Recursos
        // IEAR = (R / A)
        // R é a variância dos recursos disponíveis entre os candidatos
        // R é a média dos recursos disponíveis entre os candidatos
        return // JOCA TODO
    case 15:
        // Índice de Diversidade Econômica entre Candidatos
        // HHI = ∑(Si)^2
        // Si é a participação dos recursos financeiros do candidato i no total de recursos (como uma fração ou porcentagem)
        // n é o número total de candidatos
        return // JOCA TODO
    case 16:
        // Média e Mediana de Patrimônio da Classe Política
        // Média e mediana dos patrimônios declarados pelos candidatos
        return // JOCA TODO
    default:
        return null
    }
}

module.exports = {
    getIndicador, getAllIndicadorByType,
}
