import { GAME_TYPES, GAME_CONFIG, VALIDATION_REGEX, LIMITS } from './constants';

// ================ ИГРОВЫЕ УТИЛИТЫ ================

/**
 * Проверить поддерживается ли тип игры
 * @param {string} gameType - Тип игры
 * @returns {boolean} true если игра поддерживается
 */
export function isGameTypeSupported(gameType) {
  return Object.values(GAME_TYPES).includes(gameType);
}

/**
 * Получить конфигурацию игры
 * @param {string} gameType - Тип игры
 * @returns {Object|null} Конфигурация игры или null
 */
export function getGameConfig(gameType) {
  return GAME_CONFIG[gameType] || null;
}

/**
 * Получить имя игры
 * @param {string} gameType - Тип игры
 * @returns {string} Имя игры
 */
export function getGameName(gameType) {
  const config = getGameConfig(gameType);
  return config?.name || 'Неизвестная игра';
}

/**
 * Получить иконку игры
 * @param {string} gameType - Тип игры
 * @returns {string} Иконка игры
 */
export function getGameIcon(gameType) {
  const config = getGameConfig(gameType);
  return config?.icon || '🎮';
}

/**
 * Получить маршрут игры
 * @param {string} gameType - Тип игры
 * @returns {string} Путь к игре
 */
export function getGameRoute(gameType) {
  const config = getGameConfig(gameType);
  return config?.route || '/';
}

/**
 * Определить противоположную сторону
 * @param {string} side - Текущая сторона ('white', 'black', 'X', 'O')
 * @returns {string} Противоположная сторона
 */
export function getOppositeSide(side) {
  const opposites = {
    'white': 'black',
    'black': 'white',
    'X': 'O',
    'O': 'X'
  };
  return opposites[side] || side;
}

/**
 * Определить является ли сторона стороной игрока
 * @param {string} side - Сторона для проверки
 * @param {string} playerSide - Сторона игрока
 * @returns {boolean} true если это сторона игрока
 */
export function isPlayerSide(side, playerSide) {
  return side === playerSide;
}

/**
 * Определить чей сейчас ход
 * @param {Object} gameState - Состояние игры
 * @param {string} gameType - Тип игры
 * @returns {string} Сторона, которая должна ходить
 */
export function getCurrentTurn(gameState, gameType) {
  if (gameType === GAME_TYPES.CHESS) {
    // В шахматах используется FEN notation
    return gameState.fen ? (gameState.fen.split(' ')[1] === 'w' ? 'white' : 'black') : 'white';
  } else if (gameType === GAME_TYPES.TICTACTOE) {
    // В крестиках-ноликах чередуются ходы
    const moveCount = gameState.moveHistory?.length || 0;
    return moveCount % 2 === 0 ? 'X' : 'O';
  }
  return null;
}

/**
 * Проверить завершена ли игра
 * @param {Object} gameState - Состояние игры
 * @returns {boolean} true если игра завершена
 */
export function isGameOver(gameState) {
  return gameState.gameEnd?.isGameOver || false;
}

/**
 * Получить результат игры
 * @param {Object} gameState - Состояние игры
 * @returns {Object} Объект с результатом игры
 */
export function getGameResult(gameState) {
  if (!isGameOver(gameState)) {
    return { isGameOver: false };
  }

  const gameEnd = gameState.gameEnd;
  return {
    isGameOver: true,
    winner: gameEnd.winner,
    reason: gameEnd.reason,
    isDraw: gameEnd.isDraw || false,
    isCheckmate: gameEnd.isCheckmate || false,
    isStalemate: gameEnd.isStalemate || false
  };
}

// ================ ВАЛИДАЦИЯ ================

/**
 * Валидировать API ключ
 * @param {string} apiKey - API ключ для проверки
 * @returns {Object} Результат валидации
 */
export function validateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return { isValid: false, error: 'API ключ не указан' };
  }

  if (apiKey.length < LIMITS.API_KEY_MIN_LENGTH) {
    return { isValid: false, error: `API ключ слишком короткий (минимум ${LIMITS.API_KEY_MIN_LENGTH} символов)` };
  }

  if (apiKey.length > LIMITS.API_KEY_MAX_LENGTH) {
    return { isValid: false, error: `API ключ слишком длинный (максимум ${LIMITS.API_KEY_MAX_LENGTH} символов)` };
  }

  if (!VALIDATION_REGEX.API_KEY.test(apiKey)) {
    return { isValid: false, error: 'API ключ содержит недопустимые символы' };
  }

  return { isValid: true };
}

/**
 * Валидировать ID сессии
 * @param {string} sessionId - ID сессии
 * @returns {boolean} true если ID валидный
 */
export function validateSessionId(sessionId) {
  return sessionId && VALIDATION_REGEX.SESSION_ID.test(sessionId);
}

/**
 * Валидировать шахматный ход
 * @param {string} move - Ход в формате a2a4
 * @returns {boolean} true если ход валидный
 */
export function validateChessMove(move) {
  return move && VALIDATION_REGEX.CHESS_MOVE.test(move);
}

/**
 * Валидировать FEN строку
 * @param {string} fen - FEN строка
 * @returns {boolean} true если FEN валидная
 */
export function validateChessFen(fen) {
  return fen && VALIDATION_REGEX.CHESS_FEN.test(fen);
}

// ================ ФОРМАТИРОВАНИЕ ================

/**
 * Форматировать время в удобочитаемый вид
 * @param {number} timestamp - Временная метка
 * @returns {string} Отформатированное время
 */
export function formatTime(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Форматировать дату
 * @param {number} timestamp - Временная метка
 * @returns {string} Отформатированная дата
 */
export function formatDate(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Форматировать длительность
 * @param {number} milliseconds - Миллисекунды
 * @returns {string} Отформатированная длительность
 */
export function formatDuration(milliseconds) {
  if (!milliseconds || milliseconds < 0) return '0 сек';

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours} ч ${minutes % 60} мин`;
  } else if (minutes > 0) {
    return `${minutes} мин ${seconds % 60} сек`;
  } else {
    return `${seconds} сек`;
  }
}

/**
 * Получить относительное время (например, "2 минуты назад")
 * @param {number} timestamp - Временная метка
 * @returns {string} Относительное время
 */
export function getRelativeTime(timestamp) {
  if (!timestamp) return '';

  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) { // Меньше минуты
    return 'только что';
  } else if (diff < 3600000) { // Меньше часа
    const minutes = Math.floor(diff / 60000);
    return `${minutes} мин назад`;
  } else if (diff < 86400000) { // Меньше дня
    const hours = Math.floor(diff / 3600000);
    return `${hours} ч назад`;
  } else {
    return formatDate(timestamp);
  }
}

// ================ СТАТИСТИКА ================

/**
 * Подсчитать статистику ходов
 * @param {Array} moveHistory - История ходов
 * @param {string} playerSide - Сторона игрока
 * @returns {Object} Статистика ходов
 */
export function calculateMoveStats(moveHistory, playerSide) {
  if (!moveHistory || !Array.isArray(moveHistory)) {
    return { playerMoves: 0, aiMoves: 0, totalMoves: 0 };
  }

  const playerMoves = moveHistory.filter(move => 
    move.player === 'human' || move.side === playerSide
  ).length;

  const aiMoves = moveHistory.filter(move => 
    move.player === 'AI' || move.side !== playerSide
  ).length;

  return {
    playerMoves,
    aiMoves,
    totalMoves: moveHistory.length
  };
}

/**
 * Получить последний ход
 * @param {Array} moveHistory - История ходов
 * @returns {Object|null} Последний ход или null
 */
export function getLastMove(moveHistory) {
  if (!moveHistory || !Array.isArray(moveHistory) || moveHistory.length === 0) {
    return null;
  }
  return moveHistory[moveHistory.length - 1];
}

/**
 * Проверить можно ли отменить ход
 * @param {Array} moveHistory - История ходов
 * @param {boolean} isAiThinking - Думает ли AI
 * @returns {boolean} true если можно отменить ход
 */
export function canUndoMove(moveHistory, isAiThinking = false) {
  return !isAiThinking && moveHistory && moveHistory.length > 0;
}

// ================ УТИЛИТЫ ДЛЯ СЕССИЙ ================

/**
 * Создать уникальный ID сессии
 * @returns {string} Уникальный ID
 */
export function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Проверить активность сессии
 * @param {Object} session - Объект сессии
 * @param {number} timeoutMs - Тайм-аут в миллисекундах
 * @returns {boolean} true если сессия активна
 */
export function isSessionActive(session, timeoutMs = LIMITS.SESSION_TIMEOUT) {
  if (!session || !session.lastActivity) return false;
  
  const now = Date.now();
  return (now - session.lastActivity) < timeoutMs;
}

/**
 * Получить возраст сессии в миллисекундах
 * @param {Object} session - Объект сессии
 * @returns {number} Возраст сессии
 */
export function getSessionAge(session) {
  if (!session || !session.createdAt) return 0;
  return Date.now() - session.createdAt;
}

// ================ ОБРАБОТКА ОШИБОК ================

/**
 * Создать стандартный объект ошибки
 * @param {string} message - Сообщение об ошибке
 * @param {string} code - Код ошибки
 * @param {Object} details - Дополнительные детали
 * @returns {Object} Объект ошибки
 */
export function createError(message, code = 'UNKNOWN_ERROR', details = {}) {
  return {
    message,
    code,
    details,
    timestamp: Date.now()
  };
}

/**
 * Получить дружественное сообщение об ошибке
 * @param {Error|Object} error - Объект ошибки
 * @returns {string} Дружественное сообщение
 */
export function getFriendlyErrorMessage(error) {
  if (!error) return 'Неизвестная ошибка';
  
  const message = error.message || error.toString();
  
  // Сопоставляем с известными ошибками
  if (message.includes('API key') || message.includes('API ключ')) {
    return 'Проблема с API ключом. Проверьте правильность ввода.';
  }
  
  if (message.includes('network') || message.includes('сети')) {
    return 'Проблема с сетевым соединением. Проверьте интернет.';
  }
  
  if (message.includes('timeout') || message.includes('время')) {
    return 'Превышено время ожидания. Попробуйте еще раз.';
  }
  
  if (message.includes('session') || message.includes('сессия')) {
    return 'Проблема с игровой сессией. Начните новую игру.';
  }
  
  return message;
}

// ================ ЭКСПОРТ ПО УМОЛЧАНИЮ ================

export default {
  // Игровые утилиты
  isGameTypeSupported,
  getGameConfig,
  getGameName,
  getGameIcon,
  getGameRoute,
  getOppositeSide,
  isPlayerSide,
  getCurrentTurn,
  isGameOver,
  getGameResult,
  
  // Валидация
  validateApiKey,
  validateSessionId,
  validateChessMove,
  validateChessFen,
  
  // Форматирование
  formatTime,
  formatDate,
  formatDuration,
  getRelativeTime,
  
  // Статистика
  calculateMoveStats,
  getLastMove,
  canUndoMove,
  
  // Сессии
  generateSessionId,
  isSessionActive,
  getSessionAge,
  
  // Ошибки
  createError,
  getFriendlyErrorMessage
};