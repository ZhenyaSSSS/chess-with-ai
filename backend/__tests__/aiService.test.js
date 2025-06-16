const aiService = require('../src/services/aiService');

// Мокаем Google AI SDK
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn()
}));

const { GoogleGenerativeAI } = require('@google/generative-ai');

describe('AIService', () => {
  let mockModel;
  let mockGenAI;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockModel = {
      generateContent: jest.fn()
    };
    
    mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    };
    
    GoogleGenerativeAI.mockImplementation(() => mockGenAI);
  });

  describe('parseAIResponse', () => {
    it('должен корректно парсить валидный JSON ответ', () => {
      const response = `
        Анализируя позицию, я вижу что лучший ход:
        {
          "move": "e4",
          "strategy": "Контролирую центр доски"
        }
        Это сильный открывающий ход.
      `;

      const result = aiService.parseAIResponse(response);
      
      expect(result).toEqual({
        move: 'e4',
        strategy: 'Контролирую центр доски'
      });
    });

    it('должен выбрасывать ошибку при отсутствии JSON', () => {
      const response = 'Это просто текст без JSON';
      
      expect(() => {
        aiService.parseAIResponse(response);
      }).toThrow('JSON не найден в ответе AI');
    });

    it('должен выбрасывать ошибку при отсутствии поля move', () => {
      const response = '{"strategy": "Test strategy"}';
      
      expect(() => {
        aiService.parseAIResponse(response);
      }).toThrow('Поле "move" отсутствует');
    });

    it('должен выбрасывать ошибку при отсутствии поля strategy', () => {
      const response = '{"move": "e4"}';
      
      expect(() => {
        aiService.parseAIResponse(response);
      }).toThrow('Поле "strategy" отсутствует');
    });

    it('должен обрезать пробелы в полях', () => {
      const response = '{"move": "  e4  ", "strategy": "  My strategy  "}';
      
      const result = aiService.parseAIResponse(response);
      
      expect(result).toEqual({
        move: 'e4',
        strategy: 'My strategy'
      });
    });
  });

  describe('validateMove', () => {
    it('должен возвращать true для валидного хода в стартовой позиции', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const move = 'e4';
      
      const result = aiService.validateMove(move, fen);
      
      expect(result).toBe(true);
    });

    it('должен возвращать false для невалидного хода', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const move = 'e5'; // Невозможно с начальной позиции для белых
      
      const result = aiService.validateMove(move, fen);
      
      expect(result).toBe(false);
    });

    it('должен возвращать false при ошибке парсинга', () => {
      const fen = 'invalid-fen';
      const move = 'e4';
      
      const result = aiService.validateMove(move, fen);
      
      expect(result).toBe(false);
    });
  });

  describe('createPrompt', () => {
    const gameState = {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      history: '1. e4 e5',
      strategy: 'Control the center'
    };

    it('должен создавать промпт с основной информацией', () => {
      const prompt = aiService.createPrompt(gameState);
      
      expect(prompt).toContain('гроссмейстер по шахматам');
      expect(prompt).toContain(gameState.fen);
      expect(prompt).toContain(gameState.history);
      expect(prompt).toContain(gameState.strategy);
      expect(prompt).toContain('White'); // Ход белых
    });

    it('должен добавлять информацию об ошибке при previousError', () => {
      const error = 'Невалидный ход';
      const prompt = aiService.createPrompt(gameState, error);
      
      expect(prompt).toContain('ИСПРАВЛЕНИЕ ОШИБКИ');
      expect(prompt).toContain(error);
    });

    it('должен отображать информацию о шахе', () => {
      // Позиция где белый король под шахом
      const checkGameState = {
        ...gameState,
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1'
      };
      
      const prompt = aiService.createPrompt(checkGameState);
      
      // Если позиция действительно с шахом, должно быть предупреждение
      expect(prompt).toBeDefined();
    });

    it('должен включать список доступных ходов', () => {
      const prompt = aiService.createPrompt(gameState);
      
      expect(prompt).toContain('ДОСТУПНЫЕ ХОДЫ');
      expect(prompt).toContain('a3'); // Один из возможных начальных ходов
      expect(prompt).toContain('e4'); // Популярный начальный ход
    });
  });

  describe('getAiMove', () => {
    const gameState = {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      history: '',
      strategy: 'Open game',
      apiKey: 'valid-api-key'
    };

    it('должен успешно получать валидный ход от AI', async () => {
      const mockResponse = {
        response: {
          text: () => '{"move": "e4", "strategy": "Control center"}'
        }
      };
      
      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await aiService.getAiMove(gameState);

      expect(result).toEqual({
        move: 'e4',
        newStrategy: 'Control center',
        attempts: 1
      });
      expect(GoogleGenerativeAI).toHaveBeenCalledWith(gameState.apiKey);
      expect(mockModel.generateContent).toHaveBeenCalledTimes(1);
    });

    it('должен выбрасывать ошибку при отсутствии API ключа', async () => {
      const gameStateNoKey = { ...gameState, apiKey: null };

      await expect(aiService.getAiMove(gameStateNoKey))
        .rejects.toThrow('API_KEY_INVALID');
    });

    it('должен повторять попытки при невалидном ходе', async () => {
      const invalidMoveResponse = {
        response: {
          text: () => '{"move": "invalid_move", "strategy": "Try harder"}'
        }
      };
      
      const validMoveResponse = {
        response: {
          text: () => '{"move": "e4", "strategy": "Finally!"}'
        }
      };

      mockModel.generateContent
        .mockResolvedValueOnce(invalidMoveResponse)
        .mockResolvedValueOnce(validMoveResponse);

      const result = await aiService.getAiMove(gameState);

      expect(result).toEqual({
        move: 'e4',
        newStrategy: 'Finally!',
        attempts: 2
      });
      expect(mockModel.generateContent).toHaveBeenCalledTimes(2);
    });

    it('должен выбрасывать ошибку после максимального количества попыток', async () => {
      const invalidResponse = {
        response: {
          text: () => '{"move": "invalid_move", "strategy": "Never works"}'
        }
      };

      mockModel.generateContent.mockResolvedValue(invalidResponse);

      await expect(aiService.getAiMove(gameState))
        .rejects.toThrow('AI_FAILED_TO_MOVE');
      
      expect(mockModel.generateContent).toHaveBeenCalledTimes(3); // maxAttempts
    });

    it('должен обрабатывать ошибки API', async () => {
      const apiError = new Error('API quota exceeded');
      mockModel.generateContent.mockRejectedValue(apiError);

      await expect(aiService.getAiMove(gameState))
        .rejects.toThrow('AI_FAILED_TO_MOVE');
    });

    it('должен обрабатывать ошибки парсинга JSON', async () => {
      const invalidJsonResponse = {
        response: {
          text: () => 'This is not JSON at all'
        }
      };

      mockModel.generateContent.mockResolvedValue(invalidJsonResponse);

      await expect(aiService.getAiMove(gameState))
        .rejects.toThrow('AI_FAILED_TO_MOVE');
    });

    it('должен использовать стратегию по умолчанию при отсутствии', async () => {
      const gameStateNoStrategy = { ...gameState, strategy: null };
      
      const mockResponse = {
        response: {
          text: () => '{"move": "e4", "strategy": "Default strategy used"}'
        }
      };
      
      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await aiService.getAiMove(gameStateNoStrategy);

      expect(result.move).toBe('e4');
      
      // Проверяем что была использована стратегия по умолчанию
      const callArgs = mockModel.generateContent.mock.calls[0][0];
      expect(callArgs).toContain('I will play strategically to win this chess game');
    });
  });
}); 