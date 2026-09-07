const INITIAL_ELECTION_YEAR = 1998

/**
 * Valida se o ano de eleição pode ser exibido nos filtros.
 * O ano inicial é sempre 1998 e o final é sempre a última eleição
 * disponível na base, por isso não há limite superior fixo.
 */
const filterElectionYear = (year) => Number(year) >= INITIAL_ELECTION_YEAR

module.exports = {
    INITIAL_ELECTION_YEAR,
    filterElectionYear,
}
