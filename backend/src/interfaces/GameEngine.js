/**
 * Базовый класс для всех игровых движков
 * Определяет общий интерфейс для любых настольных игр
 */
class GameEngine {
  constructor(gameType) {
    if (this.constructor === GameEngine) {
      throw new Error('GameEngine является абстрактным классом');
    }
    this.gameType = gameType;
  }

  /**
   * Валидирует ход игрока
   * @param {Object} gameState - Текущее состояние игры
   * @param {Object} move - Ход для валидации
   * @param {string} player - Идентификатор игрока ('human', 'ai', 'white', 'black')
   * @returns {boolean} true если ход валидный
   */
  validateMove(gameState, move, player) {
    throw new Error('validateMove() должен быть реализован в дочернем классе');
  }

  /**
   * Выполняет ход и возвращает новое состояние игры
   * @param {Object} gameState - Текущее состояние игры
   * @param {Object} move - Ход для выполнения
   * @param {string} player - Идентификатор игрока
   * @returns {Object} Новое состояние игры
   */
  makeMove(gameState, move, player) {
    throw new Error('makeMove() должен быть реализован в дочернем классе');
  }

  /**
   * Получает список всех возможных ходов для игрока
   * @param {Object} gameState - Текущее состояние игры
   * @param {string} player - Идентификатор игрока
   * @returns {Array} Массив возможных ходов
   */
  getAvailableMoves(gameState, player) {
    throw new Error('getAvailableMoves() должен быть реализован в дочернем классе');
  }

  /**
   * Проверяет, завершена ли игра
   * @param {Object} gameState - Текущее состояние игры
   * @returns {Object} { isGameOver: boolean, winner: string|null, reason: string }
   */
  checkGameEnd(gameState) {
    throw new Error('checkGameEnd() должен быть реализован в дочернем классе');
  }

  /**
   * Возвращает начальное состояние игры
   * @returns {Object} Начальное состояние
   */
  getInitialState() {
    throw new Error('getInitialState() должен быть реализован в дочернем классе');
  }

  /**
   * Возвращает текущий счет игры (опционально)
   * @param {Object} gameState - Текущее состояние игры
   * @returns {Object|null} Объект со счетом или null
   */
  getScore(gameState) {
    return null; // По умолчанию нет счета
  }

  /**
   * Возвращает представление доски для отображения
   * @param {Object} gameState - Текущее состояние игры
   * @returns {Object} Представление доски
   */
  getBoardRepresentation(gameState) {
    return gameState; // По умолчанию возвращаем состояние как есть
  }

  /**
   * Определяет, чей сейчас ход
   * @param {Object} gameState - Текущее состояние игры
   * @returns {string} Идентификатор игрока, чей ход
   */
  getCurrentPlayer(gameState) {
    throw new Error('getCurrentPlayer() должен быть реализован в дочернем классе');
  }

  /**
   * Сериализует состояние игры в строку
   * @param {Object} gameState - Состояние игры
   * @returns {string} Сериализованное состояние
   */
  serialize(gameState) {
    return JSON.stringify(gameState);
  }

  /**
   * Десериализует состояние игры из строки
   * @param {string} serialized - Сериализованное состояние
   * @returns {Object} Состояние игры
   */
  deserialize(serialized) {
    return JSON.parse(serialized);
  }

  /**
   * Клонирует состояние игры
   * @param {Object} gameState - Состояние для клонирования
   * @returns {Object} Клон состояния
   */
  cloneState(gameState) {
    return this.deserialize(this.serialize(gameState));
  }

  /**
   * Возвращает метаданные игры (название, описание, правила)
   * @returns {Object} Метаданные игры
   */
  getGameMetadata() {
    return {
      type: this.gameType,
      name: 'Неизвестная игра',
      description: 'Описание не задано',
      minPlayers: 2,
      maxPlayers: 2,
      estimatedDuration: 'Неизвестно'
    };
  }
}

module.exports = GameEngine; 