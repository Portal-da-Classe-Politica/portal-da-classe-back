-- Query para buscar candidatos das profissões específicas COM origem da receita
-- Gera múltiplas linhas por candidato-eleição se houver múltiplas origens de receita
-- Valores monetários formatados em Real brasileiro (sem separador de milhar, vírgula decimal, 2 casas)

SELECT 
    c.cpf,
    ce.numero_sequencial,
    e.ano_eleicao,
    e.turno,
    ue.nome AS unidade_eleitoral,
    ue.sigla_unidade_federacao AS uf_unidade_eleitoral,
    car.nome_cargo,
    c.nome AS nome_candidato,
    nu.nome_urna AS nome_urna_candidato,
    c.data_nascimento,
    ce.idade_data_da_posse AS idade_na_data_posse,
    g.nome_genero,
    r.nome AS nome_raca,
    gi.nome_instrucao AS grau_de_instrucao,
    o.nome_ocupacao AS ocupacao,
    ce.coligacao AS nome_coligacao,
    sc.nome AS situacao_candidatura,
    st.nome AS situacao_turno,
    COALESCE(SUM(vcm.quantidade_votos), 0) AS quantidade_votos,
    REPLACE(TO_CHAR(COALESCE(SUM(dce.valor), 0), 'FM999999999999990.00'), '.', ',') AS receita,
    orec.nome AS origem_receita
FROM 
    candidato_eleicaos ce
INNER JOIN candidatos c ON ce.candidato_id = c.id
INNER JOIN eleicaos e ON ce.eleicao_id = e.id
INNER JOIN unidade_eleitorals ue ON ce.unidade_eleitoral_id = ue.id
INNER JOIN cargos car ON ce.cargo_id = car.id
INNER JOIN nome_urnas nu ON ce.nome_urna_id = nu.id
INNER JOIN generos g ON c.genero_id = g.id
INNER JOIN racas r ON c.raca_id = r.id
INNER JOIN grau_de_instrucaos gi ON ce.grau_de_instrucao_id = gi.id
INNER JOIN ocupacaos o ON ce.ocupacao_id = o.id
INNER JOIN situacao_candidaturas sc ON ce.situacao_candidatura_id = sc.id
INNER JOIN situacao_turnos st ON ce.situacao_turno_id = st.id
LEFT JOIN votacao_candidato_municipios vcm ON vcm.candidato_eleicao_id = ce.id
LEFT JOIN doacoes_candidato_eleicoes dce ON dce.candidato_eleicao_id = ce.id
LEFT JOIN origem_receitas orec ON dce.origem_receita_id = orec.id
WHERE ce.ocupacao_id IN (262, 415, 185, 375, 237, 443, 54, 238, 175, 44, 348, 349, 11, 155, 40, 341, 444, 203, 347, 143, 2, 146, 27, 138, 6)
GROUP BY 
    c.cpf,
    ce.numero_sequencial,
    e.ano_eleicao,
    e.turno,
    ue.nome,
    ue.sigla_unidade_federacao,
    car.nome_cargo,
    c.nome,
    nu.nome_urna,
    c.data_nascimento,
    ce.idade_data_da_posse,
    g.nome_genero,
    r.nome,
    gi.nome_instrucao,
    o.nome_ocupacao,
    ce.coligacao,
    sc.nome,
    st.nome,
    orec.nome,
    ce.id
ORDER BY 
    c.cpf,
    e.ano_eleicao,
    e.turno,
    orec.nome;

-- IDs das profissões incluídas:
-- 262, 415, 185, 375, 237, 443, 54, 238, 175, 44, 348, 349, 11, 155, 40, 341, 444, 203, 347, 143, 2, 146, 27, 138, 6
--
-- Profissões: BOMBEIRO MILITAR, MAGISTRADO, MEMBRO DAS FORÇAS ARMADAS, 
--              MEMBRO DO MINISTÉRIO PÚBLICO, MILITAR REFORMADO, POLICIAL CIVIL,
--              POLICIAL MILITAR, PROFESSORES (diversos níveis), SERVIDORES PÚBLICOS (diversos)
