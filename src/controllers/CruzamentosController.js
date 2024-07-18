const cruzamentosSvc = require("../services/CruzamentosSvc")


const getPossibilities = async (req, res) => {
    try {
        const {
            dimension
        } = req.query
        console.log(dimension)

        const resp = await cruzamentosSvc.getPossibilities(dimension)
        return res.json({
            success: true,
            data: {
                resp
            },
            message: "Dados buscados com sucesso.",

        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar possibilidades de cruzamento",
        })
    }
}


module.exports = {
    getPossibilities,
}
