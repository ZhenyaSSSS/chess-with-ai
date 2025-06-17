/**
 * Фабрика для создания игровых движков и связанных компонентов
 * Инкапсулирует логику создания экземпляров для различных игр
 */
class GameFactory {
  constructor() {
    // Регистр поддерживаемых игр
    this.supportedGames = new Map();
    
    // Регистрируем поддерживаемые игры
    this.registerGame('chess', {
      engineClass: () => require('../gameEngines/ChessEngine'),
      promptBuilderClass: () => require('../promptBuilders/ChessPromptBuilder'),
      description: 'Классические шахматы 8x8'
    });

    this.registerGame('tictactoe', {
      engineClass: () => require('../gameEngines/TicTacToeEngine'),
      promptBuilderClass: () => require('../promptBuilders/TicTacToePromptBuilder'),
      description: 'Крестики-нолики 3x3'
    });
  }

  /**
   * Регистрирует новую игру в фабрике
   * @param {string} gameType - Тип игры
   * @param {Object} gameConfig - Конфигурация игры
   */
  registerGame(gameType, gameConfig) {
    this.supportedGames.set(gameType, gameConfig);
    console.log(`🎲 Зарегистрирована игра: ${gameType}`);
  }

  /**
   * Создает игровой движок для указанного типа игры
   * @param {string} gameType - Тип игры
   * @returns {GameEngine} Экземпляр игрового движка
   */
  createGameEngine(gameType) {
    const gameConfig = this.supportedGames.get(gameType);
    
    if (!gameConfig) {
      throw new Error(`Неподдерживаемый тип игры: ${gameType}. Доступные: ${this.getSupportedGamesList()}`);
    }

    try {
      const EngineClass = gameConfig.engineClass();
      return new EngineClass();
    } catch (error) {
      throw new Error(`Ошибка создания движка для игры ${gameType}: ${error.message}`);
    }
  }

  /**
   * Создает построитель промптов для указанного типа игры
   * @param {string} gameType - Тип игры
   * @returns {AIPromptBuilder} Экземпляр построителя промптов
   */
  createPromptBuilder(gameType) {
    const gameConfig = this.supportedGames.get(gameType);
    
    if (!gameConfig) {
      throw new Error(`Неподдерживаемый тип игры: ${gameType}. Доступные: ${this.getSupportedGamesList()}`);
    }

    try {
      const PromptBuilderClass = gameConfig.promptBuilderClass();
      return new PromptBuilderClass();
    } catch (error) {
      throw new Error(`Ошибка создания построителя промптов для игры ${gameType}: ${error.message}`);
    }
  }

  /**
   * Проверяет, поддерживается ли тип игры
   * @param {string} gameType - Тип игры
   * @returns {boolean} true если игра поддерживается
   */
  isGameSupported(gameType) {
    return this.supportedGames.has(gameType);
  }

  /**
   * Получает список всех поддерживаемых игр
   * @returns {Array} Массив типов игр
   */
  getSupportedGames() {
    return Array.from(this.supportedGames.keys());
  }

  /**
   * Получает список поддерживаемых игр в виде строки
   * @returns {string} Строка с перечислением игр
   */
  getSupportedGamesList() {
    return this.getSupportedGames().join(', ');
  }

  /**
   * Получает конфигурацию игры
   * @param {string} gameType - Тип игры
   * @returns {Object|null} Конфигурация игры или null
   */
  getGameConfig(gameType) {
    return this.supportedGames.get(gameType) || null;
  }

  /**
   * Получает информацию о всех поддерживаемых играх
   * @returns {Array} Массив объектов с информацией об играх
   */
  getGamesInfo() {
    const games = [];
    
    for (const [gameType, config] of this.supportedGames) {
      try {
        const engine = this.createGameEngine(gameType);
        const metadata = engine.getGameMetadata();
        
        games.push({
          type: gameType,
          ...metadata,
          description: config.description,
          available: true
        });
      } catch (error) {
        games.push({
          type: gameType,
          name: gameType,
          description: config.description,
          available: false,
          error: error.message
        });
      }
    }
    
    return games;
  }

  /**
   * Создает полный игровой контекст (движок + построитель промптов)
   * @param {string} gameType - Тип игры
   * @returns {Object} Объект с движком и построителем промптов
   */
  createGameContext(gameType) {
    return {
      gameType,
      engine: this.createGameEngine(gameType),
      promptBuilder: this.createPromptBuilder(gameType)
    };
  }

  /**
   * Валидирует конфигурацию игры перед регистрацией
   * @param {Object} gameConfig - Конфигурация игры
   * @returns {boolean} true если конфигурация валидна
   */
  validateGameConfig(gameConfig) {
    if (!gameConfig.engineClass || typeof gameConfig.engineClass !== 'function') {
      throw new Error('engineClass должен быть функцией');
    }
    
    if (!gameConfig.promptBuilderClass || typeof gameConfig.promptBuilderClass !== 'function') {
      throw new Error('promptBuilderClass должен быть функцией');
    }
    
    if (!gameConfig.description || typeof gameConfig.description !== 'string') {
      throw new Error('description должен быть строкой');
    }
    
    return true;
  }

  /**
   * Удаляет игру из реестра (для тестирования или динамического управления)
   * @param {string} gameType - Тип игры
   * @returns {boolean} true если игра была удалена
   */
  unregisterGame(gameType) {
    const removed = this.supportedGames.delete(gameType);
    if (removed) {
      console.log(`🗑️ Игра удалена из реестра: ${gameType}`);
    }
    return removed;
  }
}

module.exports = GameFactory; 