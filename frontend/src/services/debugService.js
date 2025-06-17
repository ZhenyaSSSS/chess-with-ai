// Этот сервис будет содержать только функции для работы с API отладки,
// чтобы избежать проблем с API управления игрой.

class DebugApiService {
  constructor() {
    this.baseUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';
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
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
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
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
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
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    } catch (error)
    {
      console.error('Ошибка очистки логов отладки:', error);
      throw error;
    }
  }
}

const debugService = new DebugApiService();
export default debugService; 