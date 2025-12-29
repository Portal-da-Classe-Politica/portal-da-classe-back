const cargoModel = require("../models/Cargo")
const { Op } = require("sequelize")

const getAllCargos = () => {
    // Filtra o deputado distrital (id 6) pois ele é agregado com deputado estadual (id 1)
    return cargoModel.findAll({
        where: {
            id: {
                [Op.ne]: 6, // Exclui deputado distrital da lista
            },
        },
        order: [["nome_cargo", "ASC"]],
        raw: true,
    })
}

const getAbragencyByCargoID = (id) => {
    return cargoModel.findOne({
        where: {
            id,
        },
        attributes: [["abrangencium_id", "abrangencia"]],
        raw: true,
    })
}

// Função auxiliar para expandir cargo_id 1 (deputado estadual) incluindo 6 (deputado distrital)
const expandCargoIds = (cargoIds) => {
    if (!cargoIds) return cargoIds
    
    if (Array.isArray(cargoIds)) {
        // Se contém o id 1 (deputado estadual), adiciona o id 6 (deputado distrital)
        if (cargoIds.includes(1) && !cargoIds.includes(6)) {
            return [...cargoIds, 6]
        }
        return cargoIds
    } else if (cargoIds === 1) {
        // Se é apenas o id 1, retorna array com 1 e 6
        return [1, 6]
    }
    
    return cargoIds
}

module.exports = {
    getAllCargos,
    getAbragencyByCargoID,
    expandCargoIds,
}
