// Mock dependencies before importing
jest.mock('../../db/sequelize-connection', () => ({
    sequelize: {
        query: jest.fn(),
        QueryTypes: {
            SELECT: 'SELECT'
        }
    }
}));

jest.mock('../../models/CandidatoEleicao', () => ({
    findOne: jest.fn()
}));

jest.mock('../../models/NomeUrna', () => ({}));
jest.mock('../../models/Candidato', () => ({}));

const NomeUrnaSvc = require('../NomeUrnaSvc');
const { sequelize } = require('../../db/sequelize-connection');
const candidatoEleicaoModel = require('../../models/CandidatoEleicao');

describe('NomeUrnaSvc', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getCandidatesIdsByNomeUrnaOrName', () => {
        const mockQueryResult = [
            {
                candidato_id: 1,
                eleicao_id: 1,
                nome_candidato: 'João Silva'
            },
            {
                candidato_id: 2,
                eleicao_id: 1,
                nome_candidato: 'Maria Santos'
            }
        ];

        const mockCountResult = [{ count: 2 }];

        it('should return candidate IDs and count for valid search', async () => {
            // Mock database queries
            sequelize.query
                .mockResolvedValueOnce(mockQueryResult) // Main query
                .mockResolvedValueOnce(mockCountResult); // Count query

            // Mock candidato_eleicao findOne calls
            candidatoEleicaoModel.findOne
                .mockResolvedValueOnce({ id: 101 })
                .mockResolvedValueOnce({ id: 102 });

            const result = await NomeUrnaSvc.getCandidatesIdsByNomeUrnaOrName(
                'João',
                0,
                10,
                ['1', '2']
            );

            expect(result).toEqual({
                ids: [101, 102],
                count: 2
            });

            expect(sequelize.query).toHaveBeenCalledTimes(2);
            expect(candidatoEleicaoModel.findOne).toHaveBeenCalledTimes(2);
        });

        it('should handle electoral unities filter correctly', async () => {
            sequelize.query
                .mockResolvedValueOnce(mockQueryResult)
                .mockResolvedValueOnce(mockCountResult);

            candidatoEleicaoModel.findOne
                .mockResolvedValueOnce({ id: 101 })
                .mockResolvedValueOnce({ id: 102 });

            await NomeUrnaSvc.getCandidatesIdsByNomeUrnaOrName(
                'João',
                0,
                10,
                ['1', '2', '3']
            );

            const queryCall = sequelize.query.mock.calls[0];
            const query = queryCall[0];
            
            expect(query).toContain("AND ce.unidade_eleitoral_id IN ('1','2','3')");
        });

        it('should work without electoral unities filter', async () => {
            sequelize.query
                .mockResolvedValueOnce(mockQueryResult)
                .mockResolvedValueOnce(mockCountResult);

            candidatoEleicaoModel.findOne
                .mockResolvedValueOnce({ id: 101 })
                .mockResolvedValueOnce({ id: 102 });

            await NomeUrnaSvc.getCandidatesIdsByNomeUrnaOrName(
                'João',
                0,
                10,
                null
            );

            const queryCall = sequelize.query.mock.calls[0];
            const query = queryCall[0];
            
            expect(query).not.toContain("AND ce.unidade_eleitoral_id IN");
        });

        it('should return error when no candidates found', async () => {
            sequelize.query
                .mockResolvedValueOnce([]) // Empty result
                .mockResolvedValueOnce([{ count: 0 }]);

            const result = await NomeUrnaSvc.getCandidatesIdsByNomeUrnaOrName(
                'NonExistent',
                0,
                10
            );

            expect(result).toBeInstanceOf(Error);
            expect(result.message).toBe('Nenhum candidato encontrado');
        });

        it('should handle database errors', async () => {
            sequelize.query.mockRejectedValueOnce(new Error('Database connection failed'));

            await expect(
                NomeUrnaSvc.getCandidatesIdsByNomeUrnaOrName('João', 0, 10)
            ).rejects.toThrow('Database connection failed');
        });

        it('should use correct replacements in query', async () => {
            sequelize.query
                .mockResolvedValueOnce(mockQueryResult)
                .mockResolvedValueOnce(mockCountResult);

            candidatoEleicaoModel.findOne
                .mockResolvedValueOnce({ id: 101 })
                .mockResolvedValueOnce({ id: 102 });

            await NomeUrnaSvc.getCandidatesIdsByNomeUrnaOrName(
                'João Silva',
                5,
                15
            );

            const queryCall = sequelize.query.mock.calls[0];
            const options = queryCall[1];
            
            expect(options.replacements).toEqual({
                nomeUrnaOrName: '%João Silva%',
                limit: 15,
                skip: 5
            });
        });
    });

    describe('searchCandidatesByNomeUrnaOrNamePaginated', () => {
        const mockSearchResult = [
            {
                candidato_id: 1,
                eleicao_id: 1,
                nome_candidato: 'João Silva',
                nome_urna: 'JOAO SILVA',
                ano_eleicao: 2022,
                candidato_eleicao_id: 101,
                partido_sigla: 'PT',
                situacao_candidatura: 'DEFERIDO',
                cargo: 'PREFEITO'
            }
        ];

        const mockCountResult = [{ count: 1 }];

        it('should return paginated search results', async () => {
            sequelize.query
                .mockResolvedValueOnce(mockSearchResult)
                .mockResolvedValueOnce(mockCountResult);

            const result = await NomeUrnaSvc.searchCandidatesByNomeUrnaOrNamePaginated(
                'João',
                0,
                10
            );

            expect(result).toEqual({
                totalResults: 1,
                currentPage: 1,
                totalPages: 1,
                results: [{
                    lastCandidatoEleicaoId: 101,
                    partido: 'PT',
                    nomeCandidato: 'João Silva',
                    candidatoId: 1,
                    ultimaEleicao: 2022,
                    situacao: 'DEFERIDO',
                    cargo: 'PREFEITO',
                    nomeUrna: 'JOAO SILVA'
                }]
            });
        });

        it('should calculate pagination correctly', async () => {
            const mockLargeCountResult = [{ count: 95 }];
            
            sequelize.query
                .mockResolvedValueOnce(mockSearchResult)
                .mockResolvedValueOnce(mockLargeCountResult);

            const result = await NomeUrnaSvc.searchCandidatesByNomeUrnaOrNamePaginated(
                'João',
                20, // skip
                10  // limit
            );

            expect(result.totalResults).toBe(95);
            expect(result.currentPage).toBe(3); // (20/10) + 1
            expect(result.totalPages).toBe(10); // Math.ceil(95/10)
        });

        it('should handle empty results', async () => {
            sequelize.query
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([{ count: 0 }]);

            const result = await NomeUrnaSvc.searchCandidatesByNomeUrnaOrNamePaginated(
                'NonExistent',
                0,
                10
            );

            expect(result.totalResults).toBe(0);
            expect(result.results).toEqual([]);
        });

        it('should use correct bind parameters', async () => {
            sequelize.query
                .mockResolvedValueOnce(mockSearchResult)
                .mockResolvedValueOnce(mockCountResult);

            await NomeUrnaSvc.searchCandidatesByNomeUrnaOrNamePaginated(
                'João Silva',
                5,
                15
            );

            const queryCall = sequelize.query.mock.calls[0];
            const options = queryCall[1];
            
            expect(options.bind).toEqual(['%João Silva%', 15, 5]);
        });

        it('should throw error on database failure', async () => {
            sequelize.query.mockRejectedValueOnce(new Error('Connection timeout'));

            await expect(
                NomeUrnaSvc.searchCandidatesByNomeUrnaOrNamePaginated('João', 0, 10)
            ).rejects.toThrow('Erro ao buscar candidatos: Connection timeout');
        });
    });

    describe('fuzzySearchCandidatesByName', () => {
        const mockFuzzyResult = [
            {
                candidato_id: 1,
                eleicao_id: 1,
                nome_candidato: 'João Silva Santos',
                nome_urna: 'JOAO SILVA',
                ano_eleicao: 2022,
                candidato_eleicao_id: 101,
                partido_sigla: 'PT',
                situacao_candidatura: 'DEFERIDO',
                cargo: 'PREFEITO',
                score: 95
            }
        ];

        const mockCountResult = [{ count: 1 }];

        it('should perform fuzzy search with multiple words', async () => {
            sequelize.query
                .mockResolvedValueOnce(mockFuzzyResult)
                .mockResolvedValueOnce(mockCountResult);

            const result = await NomeUrnaSvc.fuzzySearchCandidatesByName(
                'João Silva',
                0,
                10
            );

            expect(result.results[0]).toEqual({
                lastCandidatoEleicaoId: 101,
                partido: 'PT',
                nomeCandidato: 'João Silva Santos',
                candidatoId: 1,
                ultimaEleicao: 2022,
                situacao: 'DEFERIDO',
                cargo: 'PREFEITO',
                nomeUrna: 'JOAO SILVA',
                score: 95
            });
        });

        it('should handle single word search', async () => {
            sequelize.query
                .mockResolvedValueOnce(mockFuzzyResult)
                .mockResolvedValueOnce(mockCountResult);

            await NomeUrnaSvc.fuzzySearchCandidatesByName('João', 0, 10);

            const queryCall = sequelize.query.mock.calls[0];
            const bindParams = queryCall[1].bind;
            
            // Should have main pattern, limit, skip, and word parameters
            expect(bindParams).toEqual(['%joão%', 10, 0, '%joão%']);
        });

        it('should handle multiple words in search term', async () => {
            sequelize.query
                .mockResolvedValueOnce(mockFuzzyResult)
                .mockResolvedValueOnce(mockCountResult);

            await NomeUrnaSvc.fuzzySearchCandidatesByName('João Silva Santos', 0, 10);

            const queryCall = sequelize.query.mock.calls[0];
            const bindParams = queryCall[1].bind;
            
            // Should include parameters for each word
            expect(bindParams).toEqual([
                '%joão silva santos%',
                10,
                0,
                '%joão%',
                '%silva%',
                '%santos%'
            ]);
        });

        it('should trim and handle extra spaces in search term', async () => {
            sequelize.query
                .mockResolvedValueOnce(mockFuzzyResult)
                .mockResolvedValueOnce(mockCountResult);

            await NomeUrnaSvc.fuzzySearchCandidatesByName('  João   Silva  ', 0, 10);

            const queryCall = sequelize.query.mock.calls[0];
            const bindParams = queryCall[1].bind;
            
            expect(bindParams[0]).toBe('%joão   silva%'); // Main pattern preserves spacing after trim
            expect(bindParams[3]).toBe('%joão%');
            expect(bindParams[4]).toBe('%silva%');
        });

        it('should handle empty search results', async () => {
            sequelize.query
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([{ count: 0 }]);

            const result = await NomeUrnaSvc.fuzzySearchCandidatesByName('XYZ123', 0, 10);

            expect(result.totalResults).toBe(0);
            expect(result.results).toEqual([]);
        });

        it('should throw error on database failure', async () => {
            sequelize.query.mockRejectedValueOnce(new Error('Query failed'));

            await expect(
                NomeUrnaSvc.fuzzySearchCandidatesByName('João', 0, 10)
            ).rejects.toThrow('Erro ao buscar candidatos com busca difusa: Query failed');
        });

        it('should calculate pagination for fuzzy search', async () => {
            const mockLargeCount = [{ count: 50 }];
            
            sequelize.query
                .mockResolvedValueOnce(mockFuzzyResult)
                .mockResolvedValueOnce(mockLargeCount);

            const result = await NomeUrnaSvc.fuzzySearchCandidatesByName(
                'João',
                30, // skip
                10  // limit
            );

            expect(result.totalResults).toBe(50);
            expect(result.currentPage).toBe(4); // (30/10) + 1
            expect(result.totalPages).toBe(5); // Math.ceil(50/10)
        });
    });

    describe('Integration scenarios', () => {
        it('should handle performance with large datasets', async () => {
            const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                candidato_id: i + 1,
                eleicao_id: 1,
                nome_candidato: `Candidato ${i + 1}`,
                nome_urna: `CANDIDATO_${i + 1}`,
                ano_eleicao: 2022,
                candidato_eleicao_id: i + 100,
                partido_sigla: 'PT',
                situacao_candidatura: 'DEFERIDO',
                cargo: 'VEREADOR',
                score: 80 - (i * 0.1)
            }));

            sequelize.query
                .mockResolvedValueOnce(largeDataset.slice(0, 100)) // Simulate pagination
                .mockResolvedValueOnce([{ count: 1000 }]);

            const startTime = Date.now();
            const result = await NomeUrnaSvc.fuzzySearchCandidatesByName('Candidato', 0, 100);
            const endTime = Date.now();

            expect(result.results).toHaveLength(100);
            expect(result.totalResults).toBe(1000);
            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        });

        it('should handle special characters in search terms', async () => {
            sequelize.query
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([{ count: 0 }]);

            await expect(
                NomeUrnaSvc.searchCandidatesByNomeUrnaOrNamePaginated("José da Silva's", 0, 10)
            ).resolves.toBeDefined();

            const queryCall = sequelize.query.mock.calls[0];
            const bindParams = queryCall[1].bind;
            
            expect(bindParams[0]).toBe("%José da Silva's%");
        });

        it('should handle concurrent search requests', async () => {
            const mockResult = [{
                candidato_id: 1,
                eleicao_id: 1,
                nome_candidato: 'Test',
                nome_urna: 'TEST',
                ano_eleicao: 2022,
                candidato_eleicao_id: 101,
                partido_sigla: 'PT',
                situacao_candidatura: 'DEFERIDO',
                cargo: 'PREFEITO'
            }];

            sequelize.query
                .mockResolvedValue(mockResult)
                .mockResolvedValue([{ count: 1 }]);

            const promises = Array.from({ length: 5 }, (_, i) =>
                NomeUrnaSvc.searchCandidatesByNomeUrnaOrNamePaginated(`Search ${i}`, 0, 10)
            );

            const results = await Promise.all(promises);
            
            expect(results).toHaveLength(5);
            results.forEach(result => {
                expect(result.totalResults).toBe(1);
                expect(result.results).toHaveLength(1);
            });
        });
    });
});
