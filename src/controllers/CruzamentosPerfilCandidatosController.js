const CruzamentosPerfilCandidatosSvc = require("../services/CruzamentosPerfilCandidatosSvc")

const getCandidatesByGender = async (req, res) => {
    try {
        const { dimension } = req.params

        return res.json({
            success: true,
            data: {
            },
            message: "Dados buscados com sucesso.",

        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar candidatos por gênero",
        })
    }
}



module.exports = {
    getCandidatesByGender,
}
