const abrangenciaModel = require("../models/Abrangencia")


const getPossibilities = async (dimension) => {
    const POSSIBILITIES = {
        "candidateProfile": {
            "possibilites": [
                {
                    "key": "freq",
                    "label": "Quantidade de Candidatos",
                    "filters": "" //chamar getCandidatesForSearch
                },
                { "key": "votes", "label": "Votos" },
                { "key": "bens", "label": "Bens Declarados" },

            ]
        }
    }
    // implementar para puxar os parametros de cada cruzamento (possibilidades de cruzamento e anos e FILTROS POSSÍVEIS)
    return { oi: 'oi' }
}



module.exports = {
    getPossibilities,
}
