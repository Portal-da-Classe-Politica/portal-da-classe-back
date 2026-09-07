const availableYearsByOrigin = {
    "candidates": { initialYear: 1998, finalYear: 2024 },
    "donations": { initialYear: 2002, finalYear: 2024 },
    "elections": { initialYear: 1998, finalYear: 2024 },

}

const filterElectionYearByOrigin = (origin, year) => {
    const yearsPossibilitiesForOrigin = availableYearsByOrigin[origin]
    if (year > yearsPossibilitiesForOrigin.finalYear){
        return false
    }
    if (year < yearsPossibilitiesForOrigin.initialYear){
        return false
    }
    return true
}

module.exports = {
    filterElectionYearByOrigin,
}
