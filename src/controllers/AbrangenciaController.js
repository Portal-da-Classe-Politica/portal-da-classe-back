const abrangenciaService = require("../services/AbrangenciaSvc")

const getAllAbrangencies = async (req, res) => {
    try {
        const abrancies = await abrangenciaService.getAllAbrancies()
        res.status(200).json({
            success: true,
            message: "abrangencias encontradas.",
            data: abrancies,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erro ao encontrar abrangencias",
            data: error.message,
        })
    }
}

module.exports = {
    getAllAbrangencies,
}
