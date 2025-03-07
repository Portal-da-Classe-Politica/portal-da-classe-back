const municipiosVotacaoModel = require("../models/MunicipiosVotacao")

const getMunicipiosByUF = async (uf) => {
    try {
        const municipios = await municipiosVotacaoModel.findAll({
            where: {
                estado: uf,
            },
            attributes: ["id", "nome"],
            order: [
                ["nome", "ASC"],
            ],
            raw: true,
        })
        return municipios
    } catch (error) {
        console.error("Error fetching municipios by UF:", error)
        throw error
    }
}

module.exports = {
    getMunicipiosByUF,
}
