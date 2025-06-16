const request = require('supertest');
const app = require('../src/index');

// Мокаем AI сервис
jest.mock('../src/services/aiService', () => ({
  getAiMove: jest.fn()
}));

const aiService = require('../src/services/aiService');

describe('Chess AI Backend API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('должен возвращать статус здоровья сервера', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        version: '1.0.0'
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('POST /api/get-ai-move', () => {
    const validRequestBody = {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      history: '1. e4 e5',
      apiKey: 'valid-api-key-12345',
      strategy: 'Control the center'
    };

    it('должен успешно возвращать ход AI при валидных данных', async () => {
      const mockAiResponse = {
        move: 'Nf3',
        newStrategy: 'Develop pieces quickly',
        attempts: 1
      };

      aiService.getAiMove.mockResolvedValue(mockAiResponse);

      const response = await request(app)
        .post('/api/get-ai-move')
        .send(validRequestBody)
        .expect(200);

      expect(response.body).toEqual(mockAiResponse);
      expect(aiService.getAiMove).toHaveBeenCalledWith({
        fen: validRequestBody.fen,
        history: validRequestBody.history,
        strategy: validRequestBody.strategy,
        apiKey: validRequestBody.apiKey,
        model: 'gemini-2.5-pro-preview-05-06'
      });
    });

    it('должен возвращать 400 при отсутствии FEN', async () => {
      const response = await request(app)
        .post('/api/get-ai-move')
        .send({ ...validRequestBody, fen: undefined })
        .expect(400);

      expect(response.body.error).toContain('FEN string is required');
    });

    it('должен возвращать 400 при неверном типе FEN', async () => {
      const response = await request(app)
        .post('/api/get-ai-move')
        .send({ ...validRequestBody, fen: 123 })
        .expect(400);

      expect(response.body.error).toContain('FEN string is required');
    });

    it('должен возвращать 400 при отсутствии API ключа', async () => {
      const response = await request(app)
        .post('/api/get-ai-move')
        .send({ ...validRequestBody, apiKey: undefined })
        .expect(400);

      expect(response.body.error).toContain('API key is required');
    });

    it('должен возвращать 401 при неверном API ключе', async () => {
      aiService.getAiMove.mockRejectedValue(new Error('API_KEY_INVALID'));

      const response = await request(app)
        .post('/api/get-ai-move')
        .send(validRequestBody)
        .expect(401);

      expect(response.body.error).toContain('Invalid API key');
    });

    it('должен возвращать 429 при превышении квоты', async () => {
      aiService.getAiMove.mockRejectedValue(new Error('QUOTA_EXCEEDED'));

      const response = await request(app)
        .post('/api/get-ai-move')
        .send(validRequestBody)
        .expect(429);

      expect(response.body.error).toContain('API quota exceeded');
    });

    it('должен возвращать 500 когда AI не может сделать ход', async () => {
      aiService.getAiMove.mockRejectedValue(new Error('AI_FAILED_TO_MOVE'));

      const response = await request(app)
        .post('/api/get-ai-move')
        .send(validRequestBody)
        .expect(500);

      expect(response.body.error).toContain('AI failed to provide a valid move');
    });

    it('должен обрабатывать неизвестные ошибки', async () => {
      aiService.getAiMove.mockRejectedValue(new Error('Неизвестная ошибка'));

      const response = await request(app)
        .post('/api/get-ai-move')
        .send(validRequestBody)
        .expect(500);

      expect(response.body.error).toContain('Internal server error');
    });

    it('должен работать с минимальными данными', async () => {
      const minimalBody = {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        apiKey: 'valid-api-key'
      };

      const mockAiResponse = {
        move: 'e4',
        newStrategy: 'Open game',
        attempts: 1
      };

      aiService.getAiMove.mockResolvedValue(mockAiResponse);

      const response = await request(app)
        .post('/api/get-ai-move')
        .send(minimalBody)
        .expect(200);

      expect(response.body).toEqual(mockAiResponse);
      expect(aiService.getAiMove).toHaveBeenCalledWith({
        fen: minimalBody.fen,
        history: '',
        strategy: 'Начинаю партию с фокусом на развитие фигур и контроль центра. План: быстрое развитие, безопасность короля, затем тактические возможности.',
        apiKey: minimalBody.apiKey,
        model: 'gemini-2.5-pro-preview-05-06'
      });
    });
  });

  describe('404 Handler', () => {
    it('должен возвращать 404 для несуществующих эндпоинтов', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Endpoint not found');
    });
  });
}); 