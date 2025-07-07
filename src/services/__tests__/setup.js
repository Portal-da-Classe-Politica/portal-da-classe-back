// Global test setup and utilities

// Helper function to create mock database results
global.createMockCandidateResult = (overrides = {}) => ({
    candidato_id: 1,
    eleicao_id: 1,
    nome_candidato: 'João Silva',
    nome_urna: 'JOAO SILVA',
    ano_eleicao: 2022,
    candidato_eleicao_id: 101,
    partido_sigla: 'PT',
    situacao_candidatura: 'DEFERIDO',
    cargo: 'PREFEITO',
    score: 95,
    ...overrides
});

// Helper function to create multiple mock results
global.createMockCandidateResults = (count, baseOverrides = {}) => {
    return Array.from({ length: count }, (_, i) => 
        createMockCandidateResult({
            candidato_id: i + 1,
            candidato_eleicao_id: i + 101,
            nome_candidato: `Candidato ${i + 1}`,
            nome_urna: `CANDIDATO_${i + 1}`,
            ...baseOverrides
        })
    );
};
global.createMockCandidateResults = (count, baseOverrides = {}) => {
    return Array.from({ length: count }, (_, i) => 
        createMockCandidateResult({
            candidato_id: i + 1,
            candidato_eleicao_id: i + 101,
            nome_candidato: `Candidato ${i + 1}`,
            nome_urna: `CANDIDATO_${i + 1}`,
            ...baseOverrides
        })
    );
};

// Reset all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(async () => {
    if (sequelize && typeof sequelize.close === 'function') {
        await sequelize.close();
    }
});
