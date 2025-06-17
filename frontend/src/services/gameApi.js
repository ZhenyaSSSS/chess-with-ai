import axios from 'axios';

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL: '/api',
  timeout: 180000, // 3 минуты для thinking моделей
  headers: {
    'Content-Type': 'application/json'
  }
});

// Интерсептор для логирования запросов в dev режиме
if (import.meta.env.DEV) {
  api.interceptors.request.use(
    (config) => {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data ? { ...config.data, apiKey: '[HIDDEN]' } : undefined
      });
      return config;
    },
    (error) => {
      console.error('❌ API Request Error:', error);
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      console.log(`✅ API Response: ${response.status}`, response.data);
      return response;
    },
    (error) => {
      console.error('❌ API Response Error:', error.response?.data || error.message);
      return Promise.reject(error);
    }
  );
}

/**
 * Универсальный API сервис для всех игр
 */
class UniversalGameAPI {
  
  // ================ НОВЫЕ УНИВЕРСАЛЬНЫЕ МЕТОДЫ ================
  
  /**
   * Получить список поддерживаемых игр
   * @returns {Promise<Array>} Список игр
   */
  async getSupportedGames() {
    try {
      const response = await api.get('/games');
      return response.data.games || [];
    } catch (error) {
      console.error('Error getting supported games:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Создать новую игровую сессию
   * @param {string} gameType - Тип игры ('chess', 'tictactoe')
   * @param {Object} config - Конфигурация игры
   * @returns {Promise<Object>} Данные созданной сессии
   */
  async createGameSession(gameType, config = {}) {
    try {
      const response = await api.post(`/games/${gameType}/sessions`, {
        playerConfig: config.playerConfig || { side: 'white' },
        aiConfig: config.aiConfig || { 
          side: 'black',
          difficulty: 'medium',
          strategy: 'balanced'
        }
      });

      return {
        sessionId: response.data.sessionId,
        gameState: response.data.gameState,
        gameType: response.data.gameType
      };
    } catch (error) {
      console.error('Error creating game session:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Получить состояние игровой сессии
   * @param {string} sessionId - ID сессии
   * @returns {Promise<Object>} Состояние игры
   */
  async getGameSession(sessionId) {
    try {
      const response = await api.get(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting game session:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Сделать ход игрока
   * @param {string} sessionId - ID сессии
   * @param {Object} move - Ход для выполнения
   * @returns {Promise<Object>} Результат хода
   */
  async makePlayerMove(sessionId, move) {
    try {
      const response = await api.post(`/sessions/${sessionId}/moves`, {
        move
      });

      return {
        gameState: response.data.gameState,
        gameEnd: response.data.gameEnd,
        moveHistory: response.data.moveHistory
      };
    } catch (error) {
      console.error('Error making player move:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Получить ход от AI
   * @param {string} sessionId - ID сессии
   * @param {Object} aiConfig - Конфигурация AI
   * @returns {Promise<Object>} Ход AI
   */
  async getAIMove(sessionId, aiConfig) {
    try {
      const response = await api.post(`/sessions/${sessionId}/ai-move`, {
        apiKey: aiConfig.apiKey,
        model: aiConfig.model || 'gemini-2.5-pro-preview-05-06',
        difficulty: aiConfig.difficulty || 'medium'
      });

      return {
        move: response.data.move,
        reasoning: response.data.reasoning,
        newStrategy: response.data.newStrategy,
        availableMoves: response.data.availableMoves,
        aiSide: response.data.aiSide
      };
    } catch (error) {
      console.error('Error getting AI move:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Удалить игровую сессию
   * @param {string} sessionId - ID сессии
   * @returns {Promise<boolean>} Успешность удаления
   */
  async deleteGameSession(sessionId) {
    try {
      await api.delete(`/sessions/${sessionId}`);
      return true;
    } catch (error) {
      console.error('Error deleting game session:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Получить аналитику игры
   * @param {string} sessionId - ID сессии
   * @returns {Promise<Object>} Аналитика игры
   */
  async getGameAnalysis(sessionId) {
    try {
      const response = await api.get(`/sessions/${sessionId}/analysis`);
      return response.data.analysis;
    } catch (error) {
      console.error('Error getting game analysis:', error);
      throw this.handleError(error);
    }
  }

  // ================ LEGACY МЕТОДЫ ДЛЯ СОВМЕСТИМОСТИ ================

  /**
   * Получить ход от AI (legacy метод для шахмат)
   * @param {Object} gameData - Данные игры (FEN, история и т.д.)
   * @param {string} apiKey - API ключ
   * @returns {Promise<Object>} Ход AI
   */
  async getAiMove(gameData) {
    try {
      const response = await api.post('/get-ai-move', {
        fen: gameData.fen,
        apiKey: gameData.apiKey,
        strategy: gameData.strategy,
        model: gameData.model,
        aiSide: gameData.aiSide
      });

      return {
        move: response.data.move,
        newStrategy: response.data.newStrategy,
        attempts: response.data.attempts || 1,
        model: response.data.model
      };
    } catch (error) {
      console.error('Legacy AI move error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Получить доступные модели Gemini (legacy)
   * @param {string} apiKey - API ключ
   * @returns {Promise<Array>} Список моделей
   */
  async getAvailableModels(apiKey) {
    try {
      const response = await api.post('/get-models', { apiKey });
      return response.data.models || [];
    } catch (error) {
      console.error('Models API Error:', error);
      
      // Возвращаем базовый список моделей в случае ошибки
      return [
        {
          id: 'gemini-2.5-pro-preview-05-06',
          name: 'Gemini 2.5 Pro Preview 05-06',
          description: 'Лучшая версия 2.5 Pro (стабильная)',
          available: true
        },
        {
          id: 'gemini-2.5-pro-preview-06-05',
          name: 'Gemini 2.5 Pro Preview 06-05',
          description: 'Новая версия (могут быть проблемы)',
          available: true
        },
        {
          id: 'gemini-2.5-flash-preview-05-20',
          name: 'Gemini 2.5 Flash Preview',
          description: 'Быстрая модель Gemini 2.5',
          available: true
        },
        {
          id: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro (Legacy)',
          description: 'Устаревшая, но стабильная',
          available: true
        }
      ];
    }
  }

  /**
   * Проверка здоровья backend сервера
   * @returns {Promise<Object>} Статус сервера
   */
  async healthCheck() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Сервер недоступен');
    }
  }

  // ================ ОБРАБОТКА ОШИБОК ================

  /**
   * Универсальная обработка ошибок API
   * @param {Error} error - Ошибка от axios
   * @returns {Error} Обработанная ошибка
   */
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data?.error || 'Неверные данные запроса');
        case 401:
          return new Error('Неверный API ключ. Проверьте ключ и попробуйте снова.');
        case 404:
          return new Error('Сессия не найдена или была удалена');
        case 429:
          return new Error('Превышен лимит запросов к API. Подождите немного.');
        case 500:
          return new Error(data?.error || 'Ошибка сервера. Попробуйте позже.');
        default:
          return new Error(data?.error || `Неизвестная ошибка (${status})`);
      }
    } else if (error.request) {
      return new Error('Нет соединения с сервером. Проверьте интернет-подключение.');
    } else {
      return new Error(`Ошибка запроса: ${error.message}`);
    }
  }
}

// Создаем единственный экземпляр сервиса
export const gameAPI = new UniversalGameAPI();

// ================ LEGACY ЭКСПОРТЫ ДЛЯ СОВМЕСТИМОСТИ ================

export const gameService = gameAPI;
export const getAiMove = (gameData) => gameAPI.getAiMove(gameData);
export const checkServerHealth = () => gameAPI.healthCheck();
export const validateApiKey = async (apiKey) => {
  try {
    await getAiMove({
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      strategy: 'Test strategy',
      apiKey: apiKey
    });
    return true;
  } catch (error) {
    if (error.message.includes('Неверный API ключ')) {
      return false;
    }
    throw error;
  }
};

export default gameAPI; 