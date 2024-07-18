const candidatoEleicaoModel = require("../models/CandidatoEleicao")

const getPossibilities = async (dimension) => {
    try {

        if (!id) throw new Error("ID do candidato é obrigatório")
        const candidate = await candidatoSvc.getCandidateDetailById(id)
        if (!candidate) throw new Error("Candidato não encontrado")
        return res.json({
            success: true,
            data: candidate,
            message: "Candidato encontrado com sucesso.",
        })
    } catch (error) {
        // console.log(error)
        return res.status(500).json({
            success: false,
            data: {},
            message: "Erro ao buscar o candidato",
        })
    }
}

module.exports = {
    getPossibilities,
}
