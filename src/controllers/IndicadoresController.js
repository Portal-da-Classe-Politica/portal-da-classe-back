const { parse } = require("dotenv")
const {
    verifyIfIndicatorIsInGroup, getIndicatorByID, getCargoFilterByID, verifyIfCargoIsAllowedForIndicator, indicatorsGroupsGlossary,
} = require("../utils/filterParsers")

const getIndicador = async (req, res) => {
    try {
        const { type, indicator_id } = req.params
        let { cargoId, initialYear, finalYear } = req.query
        const isIndicatorInGroup = verifyIfIndicatorIsInGroup(indicator_id, type)
        const indicator = getIndicatorByID(indicator_id)
        if (!indicator) {
            return res.status(400).json({ success: false, message: `Indicador ${indicator_id} não encontrado` })
        }
        if (!isIndicatorInGroup) {
            return res.status(400).json({ success: false, message: `Indicador ${indicator.nome} não pertence ao grupo ${type}` })
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

        res.status(200).json({
            success: true,
            data: {
                possibilitiesByGroup: indicatorsGroupsGlossary[type],
            },
            message: `Indicador ${indicator} do grupo ${type} para o cargo ${cargoFilter}`,
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
    getIndicador,
}
