import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingService } from './embedding.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(async () => {
    process.env.ZHIPU_API_KEY = 'mock-key';
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmbeddingService],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);
  });

  afterEach(() => {
    delete process.env.ZHIPU_API_KEY;
  });

  it('should generate embeddings via API', async () => {
    const text = 'hello world';
    const mockEmbedding = Array(1024).fill(0.1);
    
    mockedAxios.post.mockResolvedValue({
      data: {
        data: [{ embedding: mockEmbedding }]
      }
    });

    const result = await service.generateEmbedding(text);

    expect(result).toEqual(mockEmbedding);
    expect(mockedAxios.post).toHaveBeenCalled();
  });

  it('should throw on API error', async () => {
    mockedAxios.post.mockRejectedValue(new Error('API Down'));

    await expect(service.generateEmbedding('text')).rejects.toThrow('API Down');
  });
});
