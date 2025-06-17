const GameFactory = require('./GameFactory');

/**
 * Центральный менеджер всех игр
 * Управляет жизненным циклом игровых сессий и координирует работу движков
 */
class GameManager {
  constructor() {
    this.activeSessions = new Map(); // gameId -> sessionData
    this.gameFactory = new GameFactory();
  }

  /**
   * Создает новую игровую сессию
   * @param {string} gameType - Тип игры ('chess', 'tictactoe', etc.)
   * @param {Object} options - Опции игры
   * @returns {Object} Данные созданной сессии
   */
  createGameSession(gameType, options = {}) {
    const gameId = this.generateGameId();
    const gameEngine = this.gameFactory.createGameEngine(gameType);
    const promptBuilder = this.gameFactory.createPromptBuilder(gameType);

    const session = {
      gameId,
      gameType,
      gameEngine,
      promptBuilder,
      gameState: gameEngine.getInitialState(),
      players: options.players || ['human', 'ai'],
      aiConfig: options.aiConfig || {},
      createdAt: Date.now(),
      lastActivity: Date.now(),
      moveHistory: [],
      status: 'active' // active, paused, finished
    };

    this.activeSessions.set(gameId, session);
    
    console.log(`🎮 Создана новая игровая сессия: ${gameType} (ID: ${gameId})`);
    return {
      gameId,
      gameType,
      gameState: session.gameState,
      players: session.players,
      status: session.status
    };
  }

  /**
   * Получает игровую сессию по ID
   * @param {string} gameId - Идентификатор игры
   * @returns {Object|null} Данные сессии или null
   */
  getGameSession(gameId) {
    return this.activeSessions.get(gameId) || null;
  }

  /**
   * Валидирует ход игрока
   * @param {string} gameId - Идентификатор игры
   * @param {Object} move - Ход для валидации
   * @param {string} player - Идентификатор игрока
   * @returns {boolean} true если ход валидный
   */
  validateMove(gameId, move, player) {
    const session = this.getGameSession(gameId);
    if (!session) {
      throw new Error(`Игровая сессия не найдена: ${gameId}`);
    }

    return session.gameEngine.validateMove(session.gameState, move, player);
  }

  /**
   * Выполняет ход игрока
   * @param {string} gameId - Идентификатор игры
   * @param {Object} move - Ход для выполнения
   * @param {string} player - Идентификатор игрока
   * @returns {Object} Результат выполнения хода
   */
  makeMove(gameId, move, player) {
    const session = this.getGameSession(gameId);
    if (!session) {
      throw new Error(`Игровая сессия не найдена: ${gameId}`);
    }

    // Валидация хода
    if (!session.gameEngine.validateMove(session.gameState, move, player)) {
      throw new Error('Невалидный ход');
    }

    // Выполнение хода
    const newGameState = session.gameEngine.makeMove(session.gameState, move, player);
    
    // Обновляем состояние сессии
    session.gameState = newGameState;
    session.lastActivity = Date.now();
    session.moveHistory.push({
      move,
      player,
      timestamp: Date.now(),
      gameState: session.gameEngine.cloneState(newGameState)
    });

    // Проверяем завершение игры
    const gameEnd = session.gameEngine.checkGameEnd(newGameState);
    if (gameEnd.isGameOver) {
      session.status = 'finished';
      console.log(`🏁 Игра завершена: ${gameId}, победитель: ${gameEnd.winner}`);
    }

    return {
      gameState: newGameState,
      gameEnd,
      moveHistory: session.moveHistory.map(h => ({
        move: h.move,
        player: h.player,
        timestamp: h.timestamp
      }))
    };
  }

  /**
   * Получает ход от AI
   * @param {string} gameId - Идентификатор игры
   * @param {Object} aiConfig - Конфигурация AI
   * @returns {Promise<Object>} Ход AI и дополнительная информация
   */
  async getAIMove(gameId, aiConfig) {
    const session = this.getGameSession(gameId);
    if (!session) {
      throw new Error(`Игровая сессия не найдена: ${gameId}`);
    }

    const { gameEngine, promptBuilder, gameState } = session;
    
    // Определяем сторону AI
    const aiSide = aiConfig.aiSide || this.determineAISide(session);
    
    // Получаем доступные ходы
    const availableMoves = gameEngine.getAvailableMoves(gameState, aiSide);
    if (availableMoves.length === 0) {
      throw new Error('Нет доступных ходов для AI');
    }

    // Создаем промпт для AI
    const prompt = promptBuilder.buildFullPrompt({
      gameState,
      strategy: aiConfig.strategy || 'Играй лучший ход',
      aiSide,
      availableMoves
    });

    // Получаем ответ от AI через внешний сервис
    const aiService = require('../services/aiService');
    const aiResponse = await aiService.queryAI(prompt, aiConfig);
    
    // Парсим ответ
    const parsedResponse = promptBuilder.parseAIResponse(aiResponse);
    
    // Валидируем ход AI
    if (!gameEngine.validateMove(gameState, parsedResponse.move, aiSide)) {
      throw new Error(`AI предложил невалидный ход: ${parsedResponse.move}`);
    }

    return {
      move: parsedResponse.move,
      reasoning: parsedResponse.reasoning,
      newStrategy: parsedResponse.newStrategy,
      availableMoves: availableMoves.length,
      aiSide
    };
  }

  /**
   * Получает список всех активных сессий
   * @returns {Array} Массив данных сессий
   */
  getActiveSessions() {
    return Array.from(this.activeSessions.values()).map(session => ({
      gameId: session.gameId,
      gameType: session.gameType,
      players: session.players,
      status: session.status,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      moveCount: session.moveHistory.length
    }));
  }

  /**
   * Удаляет завершенную игровую сессию
   * @param {string} gameId - Идентификатор игры
   * @returns {boolean} true если сессия была удалена
   */
  removeGameSession(gameId) {
    const success = this.activeSessions.delete(gameId);
    if (success) {
      console.log(`🗑️ Удалена игровая сессия: ${gameId}`);
    }
    return success;
  }

  /**
   * Очищает старые неактивные сессии
   * @param {number} maxInactiveTime - Максимальное время неактивности в мс
   */
  cleanupInactiveSessions(maxInactiveTime = 24 * 60 * 60 * 1000) { // 24 часа
    const now = Date.now();
    const toRemove = [];

    for (const [gameId, session] of this.activeSessions) {
      if (now - session.lastActivity > maxInactiveTime) {
        toRemove.push(gameId);
      }
    }

    toRemove.forEach(gameId => this.removeGameSession(gameId));
    
    if (toRemove.length > 0) {
      console.log(`🧹 Очищено ${toRemove.length} неактивных сессий`);
    }

    return toRemove.length;
  }

  /**
   * Генерирует уникальный ID для игры
   * @returns {string} Уникальный идентификатор
   */
  generateGameId() {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Определяет сторону AI на основе конфигурации игры
   * @param {Object} session - Игровая сессия
   * @returns {string} Сторона AI
   */
  determineAISide(session) {
    // Логика определения стороны AI в зависимости от типа игры
    if (session.gameType === 'chess') {
      return session.players.indexOf('ai') === 0 ? 'white' : 'black';
    } else if (session.gameType === 'tictactoe') {
      return session.players.indexOf('ai') === 0 ? 'x' : 'o';
    }
    
    return 'ai'; // Дефолтное значение
  }

  /**
   * Получает метаданные игры
   * @param {string} gameType - Тип игры
   * @returns {Object} Метаданные игры
   */
  getGameMetadata(gameType) {
    try {
      const gameEngine = this.gameFactory.createGameEngine(gameType);
      return gameEngine.getGameMetadata();
    } catch (error) {
      return null;
    }
  }

  /**
   * Получает список поддерживаемых игр
   * @returns {Array} Массив типов игр
   */
  getSupportedGames() {
    return this.gameFactory.getSupportedGames();
  }
}

// Экспортируем единственный глобальный instance GameManager
module.exports = new GameManager(); 