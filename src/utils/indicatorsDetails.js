const indicatorsDetails = {
    1: {
        title: "Número Efetivo de Partidos",
        indicator_purpose:
      "O Número Efetivo de Partidos Parlamentares (NEPP) serve para medir a fragmentação de um sistema partidário em um legislativo, ponderando o número de partidos pela sua proporção de assentos. ",
        how_to_interpretate:
      "Valores mais próximos de 1 indicam concentração partidária, enquanto valores mais altos revelam maior fragmentação do sistema político.\nEixo X (horizontal): Representa os anos das eleições legislativas.\nEixo Y (vertical): Indica o NEPP, o número efetivo de partidos na arena legislativa.",
        unit: "Número efetivo de partidos",
        party_indicator: false,
        indicator_t1: false,
        xAxisLabel: "Anos das eleições legislativas",
        yAxisLabel: "NEPP, número efetivo de partidos",
    },
    2: {
        title: "Índice de Volatilidade Eleitoral",
        indicator_purpose:
      "Mede a instabilidade do sistema eleitoral, indicando o grau de fidelidade dos eleitores aos partidos. O índice reflete as mudanças na proporção de votos de cada partido entre eleições.",
        how_to_interpretate:
      "Valores próximos de 0 indicam estabilidade eleitoral (pouca mudança nas preferências), enquanto valores mais altos revelam maior instabilidade e mudanças significativas em preferências eleitorais. Eixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Índice de volatilidade eleitoral.",
        unit: "Volatilidade eleitoral",
        party_indicator: false,
        indicator_t1: true,
        xAxisLabel: "Tempo (anos ou eleições)",
        yAxisLabel: "Índice de volatilidade eleitoral",
    },
    3: {
        title: "Quociente Eleitoral",
        indicator_purpose:
      "Calcula quantos votos são necessários para conquistar uma cadeira em eleições proporcionais, dividindo o total de votos válidos pelo número de vagas em disputa.",
        how_to_interpretate:
      "Valores mais altos indicam maior dificuldade para obter uma cadeira (mais votos necessários), enquanto valores menores representam menor 'custo' eleitoral por vaga disponível.\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Quociente eleitoral.",
        unit: "Votos",
        party_indicator: false,
        indicator_t1: false,
        xAxisLabel: "Tempo (anos ou eleições)",
        yAxisLabel: "Quociente eleitoral",
    },
    4: {
        title: "Quociente Partidário",
        indicator_purpose:
      "Determina quantas cadeiras cada partido ou coligação conquistou na distribuição inicial, dividindo os votos válidos recebidos pelo partido pelo quociente eleitoral.",
        how_to_interpretate:
      "O resultado representa a quantidade de vagas que o partido garantiu diretamente, antes da distribuição das sobras pelos votos remanescentes.\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Quociente partidário.",
        unit: "Quociente partidário",
        party_indicator: true,
        indicator_t1: false,
        xAxisLabel: "Tempo (anos ou eleições)",
        yAxisLabel: "Quociente partidário",
    },
    5: {
        title: "Taxa de Renovação Líquida",
        indicator_purpose:
      "Mede a renovação do corpo legislativo ao longo do tempo. O cálculo considera todos os candidatos que tentaram a reeleição, destacando tanto os que foram reeleitos quanto os que não obtiveram sucesso.",
        how_to_interpretate:
      "Valores mais altos indicam maior renovação efetiva do parlamento (mais incumbentes derrotados), enquanto valores menores revelam maior estabilidade na composição parlamentar entre mandatos.\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (horizontal): Taxa de renovação líquida (%).",
        unit: "Porcentagem",
        party_indicator: false,
        indicator_t1: false,
        xAxisLabel: "Tempo (anos ou eleições)",
        yAxisLabel: "Taxa de renovação líquida (%)",
    },
    6: {
        title: "Taxa de Reeleição",
        indicator_purpose:
      "Mede o percentual de políticos (incumbentes) que conseguiram se reeleger entre aqueles que tentaram disputar novamente o mesmo cargo no pleito seguinte.",
        how_to_interpretate:
      "Valores mais altos indicam maior continuidade dos incumbentes, enquanto valores menores revelam maior dificuldade de reeleição.\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Taxa de reeleição (%).",
        unit: "Porcentagem",
        party_indicator: false,
        indicator_t1: false,
        xAxisLabel: "Tempo (anos ou eleições)",
        yAxisLabel: "Taxa de reeleição (%)",
    },
    7: {
        title: "Taxa de Migração Partidária",
        indicator_purpose:
      "Mede a média com que políticos mudam de partido ao longo de suas carreiras. Esse indicador reflete a fidelidade partidária e ajuda a entender o impacto de reformas eleitorais na estabilidade dos partidos e carreiras parlamentares.",
        how_to_interpretate:
      "Valores mais altos indicam maior troca de partidos entre os políticos, enquanto valores mais baixos sugerem maior fidelidade partidária.\n\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Taxa de migração partidária (média de mudanças por político).",
        unit: "Média de migrações partidárias",
        party_indicator: false,
        indicator_t1: true,
        xAxisLabel: "Tempo (anos ou eleições)",
        yAxisLabel: "Taxa de migração partidária (média de mudanças por político)",
    },
    8: {
        title: "Índice de Paridade Eleitoral de Gênero",
        indicator_purpose:
      "Mede a eficiência relativa das candidaturas femininas comparando a proporção de mulheres eleitas com a proporção de candidatas mulheres, identificando as dificuldades no processo eleitoral.",
        how_to_interpretate:
      "Valor igual a 1 indica eficiência igual entre gêneros; valores menores que 1 revelam menor sucesso eleitoral feminino; valores maiores que 1 indicam que mulheres superam a expectativa inicial de suas candidaturas.\nEixo Y: Índice de Paridade Eleitoral de Gênero (IPEG).\nBarras: Cada barra representa uma eleição.",
        unit: "IPEG",
        party_indicator: false,
        indicator_t1: false,
        xAxisLabel: "Eleição",
        yAxisLabel: "Índice de Paridade Eleitoral de Gênero (IPEG)",
    },
    9: {
        title: "Distribuição de Votos por Região",
        indicator_purpose:
      "Mede as diferenças regionais nas preferências políticas e eleitorais com base na concentração de votos em cada região. Esse indicador ajuda a entender desigualdades regionais e a influência de fatores locais nas eleições.",
        how_to_interpretate:
      "Valores mais altos indicam maior concentração de votos em uma região específica. Valores mais baixos sugerem uma distribuição mais equilibrada dos votos entre regiões. A evolução ao longo do tempo pode mostrar mudanças nas bases eleitorais dos partidos e candidatos.\n\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Índice de Concentração Regional do Voto (%).\nLinhas: Cada linha representa uma região.",
        unit: "Porcentagem",
        party_indicator: false,
        indicator_t1: false,
        xAxisLabel: "Tempo (anos ou eleições)",
        yAxisLabel: "Índice de Concentração Regional do Voto (%)",
    },
    10: {
        title: "Índice de Concentração Regional do Voto",
        indicator_purpose:
      "Mede o grau de concentração geográfica dos votos de um partido, identificando se o apoio eleitoral está disperso nacionalmente ou concentrado em regiões específicas.",
        how_to_interpretate:
      "Valores próximos de 0 indicam distribuição uniforme dos votos entre regiões, enquanto valores próximos de 1 revelam alta concentração regional, sinalizando hegemonias eleitorais territoriais específicas.\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Índice de Concentração Regional do Voto (HHI).\nLinhas: Cada linha representa uma região (Estado, Município).",
        unit: "Índice de Herfindahl-Hirschman (HHI)",
        party_indicator: false,
        indicator_t1: false,
        xAxisLabel: "Tempo (anos ou eleições)",
        yAxisLabel: "Índice de Concentração Regional do Voto (HHI)",
    },
    11: {
        title: "Índice de Desigualdade Regional do Voto",
        indicator_purpose:
      "Mede a variabilidade na distribuição geográfica dos votos de um partido entre regiões, identificando desigualdades territoriais no apoio eleitoral e possíveis concentrações regionais.",
        how_to_interpretate: "Valores próximos de 0 indicam distribuição uniforme dos votos entre regiões (baixa desigualdade), enquanto valores mais altos revelam concentrações regionais significativas e maior desigualdade territorial no apoio eleitoral.\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Índice de Dispersão Regional do Voto.\nLinhas: Cada linha representa uma região.",
        unit: "Coeficiente de variação",
        party_indicator: true,
        indicator_t1: false,
        xAxisLabel: "Tempo (anos ou eleições)",
        yAxisLabel: "Índice de Dispersão Regional do Voto",
    },
    12: {
        title: "Índice de Eficiência do Voto",
        indicator_purpose:
      "Mede a eficiência de um partido em converter votos recebidos em cadeiras conquistadas, comparando sua proporção de assentos com sua proporção de votos no sistema proporcional. É especialmente útil para analisar se partidos pequenos são prejudicados pela cláusula de barreira ou se partidos grandes são beneficiados por efeitos de magnitude distrital.",
        how_to_interpretate:
      "Valor igual a 1 indica proporcionalidade perfeita; valores maiores que 1 revelam super-representação (partido mais eficiente); valores menores que 1 indicam sub-representação (partido menos eficiente na conversão).\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Índice de Eficiência do Voto (IEV).\nLinhas: Cada linha representa um partido ou coligação/federação.",
        unit: "IEV",
        party_indicator: true,
        indicator_t1: false,
        xAxisLabel: "Tempo (anos ou eleições)",
        yAxisLabel: "Índice de Eficiência do Voto (IEV)",
    },
    13: {
        title: "Taxa de Custo por Voto",
        indicator_purpose:
      "Mede a eficiência financeira dos partidos políticos em campanhas eleitorais, calculando quanto cada partido gasta em média para obter cada voto recebido em determinada eleição.",
        how_to_interpretate:
      "Valores mais baixos indicam maior eficiência partidária (menos gastos por voto obtido), enquanto valores mais altos revelam menor eficiência na conversão de recursos financeiros em apoio eleitoral.\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Valor em reais do custo por voto.\nLinhas: Cada linha representa um candidato ou partido.",
        unit: "money",
        party_indicator: true,
        indicator_t1: true,
        xAxisLabel: "Tempo (anos ou eleições)",
        yAxisLabel: "Valor em reais do custo por voto",
    },
    14: {
        title: "Índice de Igualdade de Acesso a Recursos",
        indicator_purpose:
      "Mede o grau de desigualdade na distribuição de recursos financeiros entre candidatos ao mesmo cargo, avaliando se a competição eleitoral é equilibrada em termos de financiamento de campanha.",
        how_to_interpretate:
      "Valores próximos de 0 indicam distribuição equilibrada de recursos entre candidatos (maior igualdade), enquanto valores mais altos revelam concentração financeira em poucos candidatos (maior desigualdade no acesso).\nEixo X: Tempo (anos ou eleições).\nEixo Y: Índice de Igualdade de Acesso a Recursos (IEAR).",
        unit: "IEAR",
        party_indicator: false,
        indicator_t1: false,
        xAxisLabel: "Tempo (anos ou eleições)",
        yAxisLabel: "Índice de Igualdade de Acesso a Recursos (IEAR)",
    },
    15: {
        title: "Índice de Concentração de Patrimônio",
        indicator_purpose:
      "Mede o grau de concentração da riqueza declarada entre candidatos ao mesmo cargo, identificando se poucos candidatos muito ricos dominam financeiramente a disputa eleitoral.",
        how_to_interpretate:
      "Valores próximos de 0 indicam patrimônios distribuídos uniformemente entre candidatos, enquanto valores próximos de 1 revelam alta concentração de riqueza em poucos candidatos da disputa.\nEixo X (horizontal): Tempo (anos ou eleições).\nEixo Y (vertical): Índice de Diversidade Econômica entre Candidatos (IDEC).",
        unit: "IDEC",
        party_indicator: false,
        indicator_t1: true,
        xAxisLabel: "Tempo (anos ou eleições)",
        yAxisLabel: "Índice de Diversidade Econômica entre Candidatos (IDEC)",
    },
    16: {
        title: "Média e Mediana de Patrimônio da Classe Política",
        indicator_purpose:
      "Analisa o perfil patrimonial dos políticos eleitos, permitindo identificar o nível socioeconômico da classe política e comparar com a renda da população geral para avaliar representatividade.",
        how_to_interpretate:
      "Quando a média é significativamente maior que a mediana, indica concentração de riqueza entre poucos políticos muito ricos; valores próximos entre si sugerem distribuição mais equilibrada de patrimônios na classe política.",
        unit: "money",
        party_indicator: false,
        indicator_t1: false,
        xAxisLabel: "Ano",
        yAxisLabel: "Média/Mediana do patrimônio (R$)",
    },
}

module.exports = { indicatorsDetails }
