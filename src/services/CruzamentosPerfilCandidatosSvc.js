const { Sequelize, where } = require("sequelize")
const candidatoModel = require('../models/Candidato');
const candidatoEleicaoModel = require('../models/CandidatoEleicao');
const generoModel = require("../models/Genero");

const getCandidatesByGender = async (query) => {
    try {
        const genderCounts = await candidatoModel.findAll({
            attributes: [Sequelize.fn('COUNT', 'id'), 'count'],
            include: [
                { model: generoModel, }
            ],
            group: ['genero.id'],
            raw: true,
        });


        return genderCounts;
    } catch (error) {
        console.error("Error fetching candidate:", error)
        throw error
    }
};

module.exports = {
    getCandidatesByGender,
}
