/**
 *Tabela 1737 - IPCA - Série histórica com número-índice, variação mensal e variações acumuladas em 3 meses, em 6 meses, no ano e em 12 meses (a partir de dezembro/1979)
Variável - IPCA - Número-índice (base: dezembro de 1993 = 100) (Número-índice)
o valor é calculado atraves do numero indice de dezembro de 2023 / numero indice do mes de dezembro de referencia

 *  */
const fatoresDeCorreção = {
    "1998": 4.64495268138801,
    "2000": 4.02339810035225,
    "2002": 3.32058849483768,
    "2004": 2.82346639321028,
    "2006": 2.59011108774211,
    "2008": 2.34137497148151,
    "2010": 2.11936893948165,
    "2012": 1.88017909983733,
    "2014": 1.66835063278044,
    "2016": 1.41827794878238,
    "2018": 1.32793332562184,
    "2020": 1.21808477157999,
    "2022": 1.04621190005082,
}

function atualizarValor(valorOriginal, anoDoacao) {
    const fatorCorrecao = fatoresDeCorreção[anoDoacao]
    return valorOriginal * fatorCorrecao
}

module.exports = {
    atualizarValor,
    fatoresDeCorreção,
}
