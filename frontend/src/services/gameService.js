class GameService {
  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? '' 
      : 'http://localhost:3001';
  }

  // Создать новую игровую сессию
  async createGameSession(gameType, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/games/${gameType}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка создания игровой сессии:', error);
      throw error;
    }
  }

  // Получить состояние игровой сессии
  async getGameSession(sessionId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка получения игровой сессии:', error);
      throw error;
    }
  }

  // Сделать ход игрока
  async makePlayerMove(sessionId, move) {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/moves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ move })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка выполнения хода игрока:', error);
      throw error;
    }
  }

  // Получить ход AI
  async getAIMove(sessionId, aiConfig) {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/ai-move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiConfig)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка получения хода AI:', error);
      throw error;
    }
  }

  // Удалить игровую сессию
  async deleteGameSession(sessionId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка удаления игровой сессии:', error);
      throw error;
    }
  }

  // Получить аналитику игры
  async getGameAnalysis(sessionId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/analysis`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка получения аналитики игры:', error);
      throw error;
    }
  }

  // === ОТЛАДКА ===

  // Включить/выключить режим отладки
  async toggleDebugMode(enabled) {
    try {
      const response = await fetch(`${this.baseUrl}/api/debug/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка переключения режима отладки:', error);
      throw error;
    }
  }

  // Получить логи отладки
  async getDebugLogs() {
    try {
      const response = await fetch(`${this.baseUrl}/api/debug/logs`);

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

  // Очистить логи отладки
  async clearDebugLogs() {
    try {
      const response = await fetch(`${this.baseUrl}/api/debug/logs`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка очистки логов отладки:', error);
      throw error;
    }
  }
}

// Экспортируем единственный экземпляр
export const gameService = new GameService();
export default gameService; 