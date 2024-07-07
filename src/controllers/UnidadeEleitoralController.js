const unidadeEleitoralSvc = require("../services/UnidateEleitoralService")

/**
 * Retrieves federative units by abrangency.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const getByAbrangency = async (req, res) => {
    try {
        let { UF, abrangencyId } = req.query

        if (Number(abrangencyId) === 2) {
            if (!UF) {
                return res.status(400).json({
                    success: false,
                    message: "UF é obrigatório para abrangência Municipal.",
                    data: {},
                })
            }
        }
        if (UF) {
            UF = UF.toUpperCase()
        }
        const unidadeEleitoral = await unidadeEleitoralSvc.getFederativeUnitsByAbrangency(parseInt(abrangencyId), "ufAndId", UF)
        res.status(200).json({
            success: true,
            message: "Unidades eleitorais encontradas.",
            data: unidadeEleitoral,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erro ao encontrar unidades eleitorais",
            data: error.message,
        })
    }
}

/**
 * Retrieves federative units.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the federative units are retrieved.
 */
const getFederativeUnits = async (req, res) => {
    try {
        const unidadeEleitoral = await unidadeEleitoralSvc.getFederativeUnitsByAbrangency(1, "onlyUF")
        res.status(200).json({
            success: true,
            message: "Unidades eleitorais encontradas.",
            data: unidadeEleitoral,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erro ao encontrar unidades eleitorais",
            data: error.message,
        })
    }
}

module.exports = {
    getByAbrangency,
    getFederativeUnits,
}
