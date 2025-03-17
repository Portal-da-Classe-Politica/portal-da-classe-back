const partidoService = require("../services/PartidoSvc")
const { logger } = require("../utils/logger")

const getAllParties = async (req, res) => {
    try {
        const parties = await partidoService.getAllPartidos()
        res.status(200).json({
            data: parties,
            success: true,
        })
    } catch (error) {
        logger.error("Erro ao encontrar partidos:", error.message)
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

module.exports = {
    getAllParties,
}
