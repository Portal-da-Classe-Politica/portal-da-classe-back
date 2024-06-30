const cargoService = require("../services/CargoService")
const generoSvc = require("../services/GeneroService")
const unidadeEleitoralSvc = require("../services/UnidateEleitoralService")

const getFiltersForSearch = async (req, res) => {
    try {
        const [cargos, generos, estados] = await Promise.all(
            [
                cargoService.getAllCargos(),
                generoSvc.getAllGenders(),
                unidadeEleitoralSvc.getFederativeUnitsByAbrangency(1),
            ],
        )
        return res.json({
            success: true,
            data: {
                cargos,
                generos,
                estados,
            },
            message: "Dados buscados com sucesso.",

        })
    } catch (error) {
        console.log(error)
        return res.json({
            success: false,
            data: {},
            message: "Erro ao buscar os filtros dos candidatos",
        })
    }
}

module.exports = {
    getFiltersForSearch,
}
