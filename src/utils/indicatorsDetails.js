const indicatorsDetails = {
    1: {
        title: "Número Efetivo de Partidos",
        indicator_purpose:
      "O Número Efetivo de Partidos Parlamentares (NEPP) mede a fragmentação de um sistema partidário na casa legislativa, ponderando o número de partidos pela sua proporção de assentos, ou seja, pelo peso que ocupa no parlamento.",
        how_to_interpretate:
      "Valores mais próximos de 1 indicam concentração partidária, enquanto valores mais altos revelam maior fragmentação do sistema político. Eixo X (horizontal): Representa os anos das eleições legislativas. Eixo Y (vertical): Indica o NEPP, o número efetivo de partidos na arena legislativa.",
        unit: "Número efetivo de partidos parlamentares",
        party_indicator: false,
        indicator_t1: false,
        xAxisLabel: "Anos das eleições",
        yAxisLabel: "NEPP, número efetivo de partidos parlamentares",
    },
    2: {
        title: "Índice de Volatilidade Eleitoral",
        indicator_purpose:
      "Mede a estabilidade do sistema eleitoral, indicando o grau de lealdade dos eleitores aos partidos. O índice reflete as mudanças na proporção de votos de cada partido entre eleições ao longo do tempo.",
        how_to_interpretate:
      "Valores próximos de 0 indicam estabilidade eleitoral (pouca mudança nas preferências), enquanto valores mais altos revelam maior instabilidade e mudanças significativas em preferências eleitorais. Eixo X (horizontal): Tempo (anos ou eleições). Eixo Y (vertical): Índice de volatilidade eleitoral.",
        unit: "Volatilidade eleitoral",
        party_indicator: false,
        indicator_t1: true,
        xAxisLabel: "Anos das eleições",
        yAxisLabel: "Índice de volatilidade eleitoral",
    },
    3: {
        title: "Quociente Eleitoral",
        indicator_purpose:
      "Calcula quantos votos são necessários para conquistar uma cadeira em eleições proporcionais naquele distrito eleitoral. Para isso divide-se o total de votos válidos pelo número de vagas em disputa.",
        how_to_interpretate:
      "Valores mais altos indicam maior dificuldade para obter uma cadeira (mais votos necessários), enquanto valores menores representam menor barreira eleitoral para conquistar uma vaga. Eixo X (horizontal): Tempo (anos ou eleições). Eixo Y (vertical): Quociente eleitoral.",
        unit: "Quociente eleitoral",
        party_indicator: false,
        indicator_t1: false,
        xAxisLabel: "Anos das eleições",
        yAxisLabel: "Quociente eleitoral",
    },
    5: {
        title: "Taxa de Renovação Líquida",
        indicator_purpose:
      "Mede a renovação do corpo legislativo ao longo do tempo. O cálculo mede a renovação a partir da proporção de derrotados que foram capazes de capturar cadeiras de candidatos a reeleição. É a proporção dos primeiros sob a soma de derrotados e reeleitos.",
        how_to_interpretate:
      "Valores mais altos indicam maior renovação efetiva do parlamento (mais mandatários derrotados), enquanto valores menores revelam maior estabilidade na composição parlamentar entre mandatos.Eixo X (horizontal): Tempo (anos ou eleições). Eixo Y (horizontal): Taxa de renovação líquida (%).",
        unit: "Porcentagem",
        party_indicator: false,
        indicator_t1: false,
        xAxisLabel: "Anos das eleições",
        yAxisLabel: "Taxa de renovação líquida (%)",
    },
    6: {
        title: "Taxa de Reeleição",
        indicator_purpose:
      "Mede o percentual de políticos (mandatários) que conseguiram se reeleger entre aqueles que tentaram disputar novamente o mesmo cargo no pleito seguinte. É medida pela razão entre o total de candidatos que disputaram a eleição pelo total de vagas em jogo.",
        how_to_interpretate:
      "Valores mais altos indicam maior continuidade dos mandatários, enquanto valores menores revelam maior dificuldade de reeleição. Eixo X (horizontal): Tempo (anos ou eleições). Eixo Y (vertical): Taxa de reeleição (%).",
        unit: "Porcentagem",
        party_indicator: false,
        indicator_t1: false,
        xAxisLabel: "Anos das eleições",
        yAxisLabel: "Taxa de reeleição (%)",
    },
    8: {
        title: "Taxa de sucesso eleitoral feminino",
        indicator_purpose:
      "Mensura a capacidade de eleição de mulheres por cada candidata lançada. Para esse índice se divide o total de mulheres eleitas pelo total de mulheres candidatas.",
        how_to_interpretate:
      "Valores iguais a 1 indicam que as mulheres se elegem na mesma proporção em que se candidataram; valores menores que 1 revelam menor sucesso eleitoral feminino; valores maiores que 1 indicam que mulheres superam a expectativa inicial de suas candidaturas. Eixo Y: Índice de Eficiência Eleitoral de Gênero (IPEG). Barras: Cada barra representa uma eleição.",
        unit: "IEEG",
        party_indicator: false,
        indicator_t1: false,
        xAxisLabel: "Anos das eleições",
        yAxisLabel: "Taxa de Sucesso Eleitoral Feminino",
    },
    10: {
        title: "Índice de Concentração Regional do Voto",
        indicator_purpose:
      "Mede o grau de concentração geográfica dos votos de um partido, identificando se o apoio eleitoral está disperso nacionalmente ou concentrado em regiões específicas.",
        how_to_interpretate:
      "Valores próximos de 0 indicam distribuição uniforme dos votos entre regiões, enquanto valores próximos de 1 revelam alta concentração regional, sinalizando hegemonias eleitorais territoriais específicas. Eixo X (horizontal): Tempo (anos ou eleições). Eixo Y (vertical): Índice de Concentração Regional do Voto (HHI). Linhas: Cada linha representa uma região (Estado, Município).",
        unit: "Índice de Herfindahl-Hirschman (HHI)",
        party_indicator: false,
        indicator_t1: false,
        xAxisLabel: "Anos das eleições",
        yAxisLabel: "Índice de Concentração Regional do Voto (HHI)",
    },
    11: {
        title: "Índice de Desigualdade Regional do Voto",
        indicator_purpose:
      "Mede a variabilidade na distribuição geográfica dos votos de um partido entre regiões, identificando desigualdades territoriais no apoio eleitoral e possíveis concentrações regionais.",
        how_to_interpretate:
      "Valores próximos de 0 indicam distribuição uniforme dos votos entre regiões (baixa desigualdade), enquanto valores mais altos revelam concentrações regionais significativas e maior desigualdade territorial no apoio eleitoral. Eixo X (horizontal): Tempo (anos ou eleições). Eixo Y (vertical): Índice de Dispersão Regional do Voto.",
        unit: "Coeficiente de variação",
        party_indicator: true,
        indicator_t1: false,
        xAxisLabel: "Anos das eleições",
        yAxisLabel: "Índice de Desigualdade Regional do Voto",
    },
    14: {
        title: "Índice de Desigualdade no Acesso a Recursos",
        indicator_purpose:
      "Mede o grau de desigualdade na distribuição de recursos financeiros entre candidatos ao mesmo cargo, avaliando se a competição eleitoral é equilibrada em termos de financiamento de campanha.",
        how_to_interpretate:
      "Valores próximos de 0 indicam distribuição equilibrada de recursos entre candidatos (baixa desigualdade), enquanto valores mais altos revelam concentração financeira em poucos candidatos (maior desigualdade no acesso). Eixo X: Tempo (anos ou eleições). Eixo Y: Índice de Desigualdade de Acesso a Recursos.",
        unit: "IDAR",
        party_indicator: false,
        indicator_t1: false,
        xAxisLabel: "Anos das eleições",
        yAxisLabel: "Índice de Desigualdade no Acesso a Recursos (HHI)",
    },
    15: {
        title: "Índice de Concentração de Patrimônio",
        indicator_purpose:
      "Mede o grau de concentração da riqueza declarada entre candidatos ao mesmo cargo, identificando se poucos candidatos muito ricos dominam financeiramente a disputa eleitoral.",
        how_to_interpretate:
      "Valores próximos de 0 indicam patrimônios distribuídos uniformemente entre candidatos, enquanto valores próximos de 1 revelam alta concentração de bens/patrimônios em poucos candidatos da disputa ao cargo. Eixo X (horizontal): Tempo (anos ou eleições). Eixo Y (vertical): Índice de Diversidade Econômica entre Candidatos (IDEC).",
        unit: "ICP",
        party_indicator: false,
        indicator_t1: true,
        xAxisLabel: "Anos das eleições",
        yAxisLabel: "Índice de Concentração de Patrimônio (ICP)",
    },
    16: {
        title: "Média e Mediana de Patrimônio da Classe Política",
        indicator_purpose:
      "Analisa o perfil patrimonial dos políticos eleitos, permitindo identificar o nível socioeconômico da classe política e avaliar representatividade.",
        how_to_interpretate:
      "Quando a média é significativamente maior que a mediana, indica concentração de riqueza entre poucos políticos muito ricos; valores próximos entre si sugerem distribuição mais equilibrada de patrimônios na classe política.",
        unit: "Valor em real",
        party_indicator: false,
        indicator_t1: false,
        xAxisLabel: "Anos das eleições",
        yAxisLabel: "Média/Mediana do patrimônio (R$)",
    },
    12: {
        title: "Desproporcionalidade (Gellagher index)",
        indicator_purpose:
      "Mensura a desproporcionalidade de um sistema eleitoral através da diferença na proporção de cadeiras conquistadas e votos recebidos. Indicadores mais baixos mostram que a correspondência entre quantidade de votos e quantidade de cadeiras recebidas por um partido é equilibrada.",
        how_to_interpretate:
      "Quanto mais próximo de zero, menor a diferença entre votos e cadeiras.Quanto mais próximo de 100, maior a diferença entre votos amealhados e cadeiras recebidas por um partido político. Eixo X (horizontal): Tempo (anos ou eleições). Eixo Y (vertical): Índice de Eficiência do Voto (IEV). Linhas: Cada linha representa um partido ou coligação/federação.",
        unit: "EM",
        party_indicator: true,
        indicator_t1: false,
        xAxisLabel: "Anos das eleições",
        yAxisLabel: "Gellagher index",
    },
}

module.exports = { indicatorsDetails }
