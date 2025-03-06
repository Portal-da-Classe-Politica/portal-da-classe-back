const partidos = [
    {
        id: 54, sigla: "AGIR", nome_atual: "Agir", sigla_atual: "AGIR", cor: "(26, 47, 94)",
    },
    {
        id: 48, sigla: "AVANTE", nome_atual: "AVANTE", sigla_atual: "AVANTE", cor: "(55, 99, 133)",
    },
    {
        id: 50, sigla: "CIDADANIA", nome_atual: "Cidadania", sigla_atual: "CIDADANIA", cor: "(65, 116, 150)",
    },
    {
        id: 51, sigla: "DC", nome_atual: "Democracia Cristã", sigla_atual: "DC", cor: "(18, 22, 127)",
    },
    {
        id: 36, sigla: "DEM", nome_atual: "União", sigla_atual: "DEM", cor: "(14, 11, 142)",
    },
    {
        id: 46, sigla: "MDB", nome_atual: "MDB", sigla_atual: "MDB", cor: "(55, 99, 133)",
    },
    {
        id: 45, sigla: "NOVO", nome_atual: "NOVO", sigla_atual: "NOVO", cor: "(11, 4, 150)",
    },
    {
        id: 30, sigla: "PAN", nome_atual: "PTB", sigla_atual: "PAN", cor: "(24, 41, 102)",
    },
    {
        id: 40, sigla: "PATRIOTA", nome_atual: "Patriota", sigla_atual: "PATRIOTA", cor: "(12, 7, 147)",
    },
    {
        id: 14, sigla: "PC do B", nome_atual: "PC do B", sigla_atual: "PC do B", cor: "(223, 52, 64)",
    },
    {
        id: 24, sigla: "PCB", nome_atual: "PCB", sigla_atual: "PCB", cor: "(162, 6, 8)",
    },
    {
        id: 26, sigla: "PCO", nome_atual: "PCO", sigla_atual: "PCO", cor: "(155, 1, 1)",
    },
    {
        id: 15, sigla: "PDT", nome_atual: "PDT", sigla_atual: "PDT", cor: "(190, 73, 84)",
    },
    {
        id: 22, sigla: "PFL", nome_atual: "União", sigla_atual: "PFL", cor: "(14, 11, 142)",
    },
    {
        id: 25, sigla: "PGT", nome_atual: "PL", sigla_atual: "PGT", cor: "(10, 0, 157)",
    },
    {
        id: 31, sigla: "PHS", nome_atual: "Podemos", sigla_atual: "PHS", cor: "(28, 52, 87)",
    },
    {
        id: 3, sigla: "PL", nome_atual: "PL", sigla_atual: "PL", cor: "(10, 0, 157)",
    },
    {
        id: 44, sigla: "PMB", nome_atual: "PMB", sigla_atual: "PMB", cor: "(32, 58, 92)",
    },
    {
        id: 1, sigla: "PMDB", nome_atual: "MDB", sigla_atual: "PMDB", cor: "(55, 99, 133)",
    },
    {
        id: 20, sigla: "PMN", nome_atual: "PMN", sigla_atual: "PMN", cor: "(48, 86, 120)",
    },
    {
        id: 43, sigla: "PODE", nome_atual: "Podemos", sigla_atual: "PODE", cor: "(28, 52, 87)",
    },
    {
        id: 32, sigla: "PP", nome_atual: "Progressistas", sigla_atual: "PP", cor: "(18, 24, 124)",
    },
    {
        id: 2, sigla: "PPB", nome_atual: "Progressistas", sigla_atual: "PPB", cor: "(18, 24, 124)",
    },
    {
        id: 38, sigla: "PPL", nome_atual: "PC do B", sigla_atual: "PPL", cor: "(223, 52, 64)",
    },
    {
        id: 23, sigla: "PPS", nome_atual: "Cidadania", sigla_atual: "PPS", cor: "(65, 116, 150)",
    },
    {
        id: 37, sigla: "PR", nome_atual: "PL", sigla_atual: "PR", cor: "(10, 0, 157)",
    },
    {
        id: 35, sigla: "PRB", nome_atual: "Republicanos", sigla_atual: "PRB", cor: "(16, 17, 133)",
    },
    {
        id: 28, sigla: "PRN", nome_atual: "Agir", sigla_atual: "PRN", cor: "(26, 47, 94)",
    },
    {
        id: 18, sigla: "PRONA", nome_atual: "PL", sigla_atual: "PRONA", cor: "(10, 0, 157)",
    },
    {
        id: 41, sigla: "PROS", nome_atual: "Solidariedade", sigla_atual: "PROS", cor: "(28, 51, 89)",
    },
    {
        id: 11, sigla: "PRP", nome_atual: "Patriota", sigla_atual: "PRP", cor: "(12, 7, 147)",
    },
    {
        id: 17, sigla: "PRTB", nome_atual: "PRTB", sigla_atual: "PRTB", cor: "(27, 49, 91)",
    },
    {
        id: 10, sigla: "PSB", nome_atual: "PSB", sigla_atual: "PSB", cor: "(215, 97, 46)",
    },
    {
        id: 8, sigla: "PSC", nome_atual: "Podemos", sigla_atual: "PSC", cor: "(15, 14, 137)",
    },
    {
        id: 27, sigla: "PSD", nome_atual: "PSD", sigla_atual: "PSD", cor: "(42, 76, 110)",
    },
    {
        id: 6, sigla: "PSDB", nome_atual: "PSDB", sigla_atual: "PSDB", cor: "(47, 85, 119)",
    },
    {
        id: 5, sigla: "PSDC", nome_atual: "Democracia Cristã", sigla_atual: "PSDC", cor: "(18, 22, 127)",
    },
    {
        id: 21, sigla: "PSL", nome_atual: "União", sigla_atual: "PSL", cor: "(14, 11, 142)",
    },
    {
        id: 19, sigla: "PSN", nome_atual: "Podemos", sigla_atual: "PSN", cor: "(28, 52, 87)",
    },
    {
        id: 34, sigla: "PSOL", nome_atual: "PSOL", sigla_atual: "PSOL", cor: "(202, 36, 44)",
    },
    {
        id: 9, sigla: "PST", nome_atual: "PL", sigla_atual: "PST", cor: "(10, 0, 157)",
    },
    {
        id: 7, sigla: "PSTU", nome_atual: "PSTU", sigla_atual: "PSTU", cor: "(154, 0, 0)",
    },
    {
        id: 4, sigla: "PT", nome_atual: "PT", sigla_atual: "PT", cor: "(239, 97, 29)",
    },
    {
        id: 13, sigla: "PT do B", nome_atual: "AVANTE", sigla_atual: "PT do B", cor: "(55, 99, 133)",
    },
    {
        id: 16, sigla: "PTB", nome_atual: "PTB", sigla_atual: "PTB", cor: "(24, 41, 102)",
    },
    {
        id: 33, sigla: "PTC", nome_atual: "Agir", sigla_atual: "PTC", cor: "(26, 47, 94)",
    },
    {
        id: 29, sigla: "PTN", nome_atual: "Podemos", sigla_atual: "PTN", cor: "(28, 52, 87)",
    },
    {
        id: 12, sigla: "PV", nome_atual: "PV", sigla_atual: "PV", cor: "(165, 49, 121)",
    },
    {
        id: 42, sigla: "REDE", nome_atual: "REDE", sigla_atual: "REDE", cor: "(206, 88, 60)",
    },
    {
        id: 49, sigla: "REPUBLICANOS", nome_atual: "Republicanos", sigla_atual: "REPUBLICANOS", cor: "(16, 17, 133)",
    },
    {
        id: 39, sigla: "SD", nome_atual: "Solidariedade", sigla_atual: "SDD", cor: "(70, 120, 157)",
    },
    {
        id: 47, sigla: "SOLIDARIEDADE", nome_atual: "Solidariedade", sigla_atual: "SDD", cor: "(70, 120, 157)",
    },
    {
        id: 52, sigla: "UNIÃO", nome_atual: "União", sigla_atual: "UNIÃO", cor: "(14, 11, 142)",
    },
    {
        id: 53, sigla: "UP", nome_atual: "Unidade Popular", sigla_atual: "UP", cor: "(214, 45, 56)",
    },
]

module.exports = { partidos }
