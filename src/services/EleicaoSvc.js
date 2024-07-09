const EleicaoModel = require("../models/Eleicao")

const getLastElectionFirstTurn = async (ano, turno) => {
    try {
        const election = await EleicaoModel.findOne({
            where: {
                ano_eleicao: ano,
                turno,
            },
            raw: true,
        })
        return election
    } catch (error) {
        console.error("Error fetching election:", error)
        throw error
    }
}

module.exports = {
    getLastElectionFirstTurn,
}
