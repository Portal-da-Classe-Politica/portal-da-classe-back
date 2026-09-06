const { Sequelize } = require("sequelize")
const config = require("../config/config")
const logger = require("../utils/logger")
const { sendAlert } = require("../utils/alert/alertTelegram")

const isDevelopment = config.environment === "development"
const databaseName = isDevelopment ? "eleicao_v2" : "eleicao_v3"

const objectDB = {
    username: "postgres",
    password: config.secretdb,
    host: config.urldb,
    database: databaseName,
    dialect: "postgres",
    port: 5432,
    logging: false,
    dialectOptions: {
        statement_timeout: 120000, // 30 segundos (valor em milissegundos)
    },
    pool: {
        max: 30, // Ajuste conforme necessário
        min: 0,
        acquire: 120000,
        idle: 10000,
    },
}

if (isDevelopment) {
    objectDB.dialectOptions.ssl = {
        require: true,
        rejectUnauthorized: false,
    }
}

const sequelize = new Sequelize(objectDB)

// Versao de schema que este codigo espera encontrar no banco.
//
// BUMP OBRIGATORIO quando uma migration nova de
// novo_script_eleicoes/db/migrations/ for aplicada em producao. E de proposito
// que isso seja manual: o acoplamento entre o codigo e a estrutura do banco
// fica visivel no diff, em vez de descoberto meses depois.
const MIGRATION_ESPERADA = "001_baseline"

// O `sequelize.sync()` que ficava no connect() criava tabela ausente mas nunca
// corrigia coluna divergente. Foi assim que este back passou meses com metade
// do codigo esperando `candidatos.raca_id` e a outra metade
// `candidato_eleicaos.raca_id`, sem nenhum aviso. A estrutura agora vem de
// migrations; aqui a gente so confere se o banco esta na versao certa.
const verificarSchema = async () => {
    let aplicadas
    try {
        const [linhas] = await sequelize.query(
            "select versao from public.schema_migrations where versao = :versao",
            { replacements: { versao: MIGRATION_ESPERADA } },
        )
        aplicadas = linhas.length
    } catch (error) {
        throw new Error(
            `O banco ${databaseName} nao tem a tabela public.schema_migrations. `
            + "Rode `node db/migrate.js mark 001` (ou `up`) no repositorio "
            + "novo_script_eleicoes antes de subir o back.",
        )
    }
    if (!aplicadas) {
        throw new Error(
            `O banco ${databaseName} nao esta na migration ${MIGRATION_ESPERADA}. `
            + "Aplique as migrations pendentes (`node db/migrate.js up`) ou "
            + "corrija MIGRATION_ESPERADA se o back e que esta atrasado.",
        )
    }
}

const connect = async () => {
    try {
        await sequelize.authenticate()
        await verificarSchema()
        logger.info(`Conexão com o banco de dados ${databaseName} estabelecida com sucesso.`)
    } catch (error) {
        logger.error("Não foi possível conectar ao banco de dados:", error)
        await sendAlert(`[❌] Back nao subiu: ${error.message}`)
        process.exit(1)
    }
}

module.exports = {
    sequelize,
    connect,
}
