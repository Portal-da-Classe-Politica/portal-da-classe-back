/**
 *Tabela 1737 - IPCA - Série histórica com número-índice, variação mensal e variações acumuladas em 3 meses, em 6 meses, no ano e em 12 meses (a partir de dezembro/1979)
Variável - IPCA - Número-índice (base: dezembro de 1993 = 100) (Número-índice)
o valor é calculado atraves do numero indice de dezembro de 2024 / numero indice do mes de dezembro de referencia
https://sidra.ibge.gov.br/tabela/1737

 *  */
const fatoresDeCorreção = {
    "1998": 4.86935948429571,
    "2000": 4.21777637855144,
    "2002": 3.48101265822785,
    "2004": 2.95987360979107,
    "2006": 2.71524445039292,
    "2008": 2.45449140297145,
    "2010": 2.22175982277237,
    "2012": 1.97101425137267,
    "2014": 1.74895193430315,
    "2016": 1.48679774692715,
    "2018": 1.39208839727013,
    "2020": 1.27693284345726,
    "2022": 1.09675645534739,
    "2024": 1.00000000000000,
}

function atualizarValor(valorOriginal, anoDoacao) {
    const fatorCorrecao = fatoresDeCorreção[anoDoacao]
    return valorOriginal * fatorCorrecao
}

module.exports = {
    atualizarValor,
    fatoresDeCorreção,
}
