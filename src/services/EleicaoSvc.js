const { sequelize } = require("../db/sequelize-connection")
const EleicaoModel = require("../models/Eleicao")
const { Sequelize, or } = require("sequelize")

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

const getAllElectionsYears = async () => {
    try {
        const elections = await EleicaoModel.findAll({
            where: {
                turno: 1,
            },
            attributes: [Sequelize.fn("DISTINCT", Sequelize.col("ano_eleicao")), "ano_eleicao"],
            raw: true,
            order: [["ano_eleicao", "ASC"]],
        })
        return elections
    } catch (error) {
        console.error("Error fetching election:", error)
        throw error
    }
}

const getElectionsByYearInterval = async (initialYear, finalYear, round = 1) => {
    try {
        if (round === "all"){
            round = { [Sequelize.Op.in]: [1, 2] }
        }
        const election = await EleicaoModel.findAll({
            where: {
                ano_eleicao: {
                    [Sequelize.Op.gte]: initialYear,
                    [Sequelize.Op.lte]: finalYear,
                },
                turno: round,
            },
            attributes: ["id"],
            raw: true,
        })
        return election
    } catch (error) {
        console.error("Error fetching election:", error)
        throw error
    }
}

const getElectionsByYearIntervalAndAbragency = async (initialYear, finalYear, round = 1, abrangency) => {
    try {
        if (round === "all"){
            round = { [Sequelize.Op.in]: [1, 2] }
        }
        const election = await EleicaoModel.findAll({
            where: {
                ano_eleicao: {
                    [Sequelize.Op.gte]: initialYear,
                    [Sequelize.Op.lte]: finalYear,
                },
                abrangencium_id: abrangency,
                turno: round,
            },
            attributes: ["id"],
            raw: true,
        })
        return election
    } catch (error) {
        console.error("Error fetching election:", error)
        throw error
    }
}

const getAllElectionsYearsByAbragencyForFilters = async (abrangency) => {
    try {
        const election = await EleicaoModel.findAll({
            where: {
                turno: 1,
                abrangencium_id: abrangency,
            },
            attributes: ["ano_eleicao"],
            order: [["ano_eleicao", "ASC"]],
            raw: true,
        })
        return election
    } catch (error) {
        console.error("Error fetching election:", error)
        throw error
    }
}

const getInitialAndLastElections = async (initialYear, finalYear, round = 1) => {
    try {
        if (round === "all"){
            round = { [Sequelize.Op.in]: [1, 2] }
        }
        const election = await EleicaoModel.findAll({
            where: {
                ano_eleicao: {
                    [Sequelize.Op.in]: [initialYear, finalYear],
                },
                turno: round,
            },
            attributes: ["id", "ano_eleicao"],
            raw: true,
        })
        return election
    } catch (error) {
        console.error("Error fetching election:", error)
        throw error
    }
}

module.exports = {
    getAllElectionsYearsByAbragencyForFilters,
    getElectionsByYearIntervalAndAbragency,
    getInitialAndLastElections,
    getLastElectionFirstTurn,
    getElectionsByYearInterval,
    getAllElectionsYears,
}
