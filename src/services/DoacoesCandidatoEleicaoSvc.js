const DoacoesCandidatoEleicao = require("../models/DoacoesCandidatoEleicao")
const DoadorModel = require("../models/Doador")
const { Op, where, QueryTypes } = require("sequelize")

const getBiggestDonors = async (candidateElectionsIds, skip, limit, page) => {
    try {
        const finder = {
            where: {
                candidato_eleicao_id: {
                    [Op.in]: candidateElectionsIds,
                },
            },
            attributes: [
                "doador_id",
                [sequelize.fn("sum", sequelize.col("valor")), "total"],
            ],
            group: ["doador_id", sequelize.col("doadore.id")],
            order: [[sequelize.literal("total"), "DESC"]],
            limit,
            offset: skip,
            include: [
                {
                    model: DoadorModel,
                    attributes: ["nome"],
                },
            ],
            raw: true,
        }
        const donors = await DoacoesCandidatoEleicao.findAll(finder)
        const count = await DoacoesCandidatoEleicao.count(finder)
        if (!donors || donors.length === 0) {
            return new Error("Nenhum doador encontrado")
        }

        const parsedDonors = donors.map((donor) => {
            return {
                nome: donor["doadore.nome"],
                total: donor.total,
            }
        })

        return {
            results: parsedDonors,
            totalResults: count.length || 1,
            currentPage: page,
            totalPages: Math.ceil((count.length || 1) / limit),
        }
    } catch (error) {
        console.error("Error fetching donors:", error)
        throw error
    }
}

module.exports = {
    getBiggestDonors,
}
