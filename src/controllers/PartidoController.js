const partidoService = require("../services/PartidoSvc")

const getAllParties = async (req, res) => {
    try {
        const parties = await partidoService.getAllPartidos()
        res.status(200).json({
            data: parties,
            success: true,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

module.exports = {
    getAllParties,
}
