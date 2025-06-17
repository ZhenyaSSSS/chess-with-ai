import axios from 'axios';

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL: '/api', // Vite проксирует это на localhost:3001
  timeout: 30000, // 30 секунд на запрос (AI может думать долго)
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

class GameService {
  constructor() {
    // Vite использует import.meta.env.DEV для определения режима разработки
    this.baseUrl = import.meta.env.DEV
      ? 'http://localhost:3001'
      : '';
  }

  /**
   * Получает ход от AI
   * @param {Object} gameData - Данные игры
   * @param {string} apiKey - API ключ Gemini
   * @returns {Promise<Object>} Результат с ходом AI
   */
  async getAIMove(gameData, apiKey) {
    try {
      const response = await api.post('/get-ai-move', {
        ...gameData,
        apiKey
      });

      return {
        move: response.data.move,
        newStrategy: response.data.newStrategy,
        attempts: response.data.attempts || 1,
        model: response.data.model
      };

    } catch (error) {
      console.error('API Error:', error);
      
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            throw new Error('Неверные данные игры. Проверьте корректность позиции.');
          case 401:
            throw new Error('Неверный API ключ. Проверьте ключ и попробуйте снова.');
          case 429:
            throw new Error('Превышен лимит запросов к Gemini API. Подождите немного.');
          case 500:
            throw new Error(data?.error || 'Ошибка сервера при получении хода AI.');
          default:
            throw new Error(data?.error || `Неизвестная ошибка (${status})`);
        }
      } else if (error.request) {
        throw new Error('Нет соединения с сервером. Проверьте интернет-подключение.');
      } else {
        throw new Error(`Ошибка запроса: ${error.message}`);
      }
    }
  }

  /**
   * Получает список доступных моделей Gemini
   * @param {string} apiKey - API ключ Gemini
   * @param {string} apiVersion - Версия API (опционально)
   * @returns {Promise<Array>} Список моделей
   */
  async getAvailableModels(apiKey, apiVersion = 'v1beta') {
    try {
      const response = await fetch(`${this.baseUrl}/api/get-models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey, apiVersion })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Ошибка получения моделей:', error);
      throw error;
    }
  }

  /**
   * Проверяет работоспособность сервера
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

  async setApiVersion(version) {
    try {
      const response = await fetch('/api/set-api-version', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ version })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Ошибка смены версии API:', error);
      throw error;
    }
  }

  // === ОТЛАДКА AI ===

  async toggleDebugMode(enabled) {
    try {
      const response = await fetch('/api/debug/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Ошибка переключения режима отладки:', error);
      throw error;
    }
  }

  async getDebugLogs() {
    try {
      const response = await fetch('/api/debug/logs');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.logs || [];
    } catch (error) {
      console.error('Ошибка получения логов отладки:', error);
      throw error;
    }
  }

  async clearDebugLogs() {
    try {
      const response = await fetch('/api/debug/logs', {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Ошибка очистки логов отладки:', error);
      throw error;
    }
  }
}

// Создаем единственный экземпляр сервиса
export const gameService = new GameService();

/**
 * Проверяет здоровье backend сервера
 * @returns {Promise<Object>} Статус сервера
 */
export async function checkServerHealth() {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error(`Сервер недоступен: ${error.message}`);
  }
}

/**
 * Получает ход от AI (legacy функция для обратной совместимости)
 * @param {Object} gameData - Данные о текущей игре
 * @returns {Promise<Object>} Ход AI и обновленная стратегия
 */
export async function getAiMove(gameData) {
  return gameService.getAIMove(gameData, gameData.apiKey);
}

/**
 * Проверяет валидность API ключа (отправляя тестовый запрос)
 * @param {string} apiKey - API ключ для проверки
 * @returns {Promise<boolean>} true если ключ валидный
 */
export async function validateApiKey(apiKey) {
  try {
    // Отправляем запрос с тестовой позицией
    await getAiMove({
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      history: '',
      strategy: 'Test strategy',
      apiKey: apiKey
    });
    
    return true;
  } catch (error) {
    if (error.message.includes('Неверный API ключ')) {
      return false;
    }
    // Другие ошибки не связаны с валидностью ключа
    throw error;
  }
}

export default gameService; 