// ================ ИГРОВЫЕ КОНСТАНТЫ ================

/**
 * Типы поддерживаемых игр
 */
export const GAME_TYPES = {
  CHESS: 'chess',
  TICTACTOE: 'tictactoe'
};

/**
 * Настройки игр
 */
export const GAME_CONFIG = {
  [GAME_TYPES.CHESS]: {
    id: GAME_TYPES.CHESS,
    name: 'Шахматы',
    description: 'Классическая игра в шахматы против AI',
    icon: '♟️',
    minPlayers: 2,
    maxPlayers: 2,
    defaultPlayerSide: 'white',
    supportedAI: true,
    features: ['drag-drop', 'promotion', 'castling', 'en-passant'],
    route: '/chess'
  },
  [GAME_TYPES.TICTACTOE]: {
    id: GAME_TYPES.TICTACTOE,
    name: 'Крестики-нолики',
    description: 'Простая игра крестики-нолики против AI',
    icon: '⭕',
    minPlayers: 2,
    maxPlayers: 2,
    defaultPlayerSide: 'X',
    supportedAI: true,
    features: ['click-to-move'],
    route: '/tictactoe'
  }
};

// ================ AI КОНСТАНТЫ ================

/**
 * Доступные модели AI
 */
export const AI_MODELS = {
  GEMINI_2_5_PRO_PREVIEW_05_06: 'gemini-2.5-pro-preview-05-06',
  GEMINI_2_5_PRO_PREVIEW_06_05: 'gemini-2.5-pro-preview-06-05',
  GEMINI_2_5_FLASH_PREVIEW: 'gemini-2.5-flash-preview-05-20',
  GEMINI_1_5_PRO: 'gemini-1.5-pro'
};

/**
 * Уровни сложности AI
 */
export const AI_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert'
};

/**
 * Настройки уровней сложности
 */
export const AI_DIFFICULTY_CONFIG = {
  [AI_DIFFICULTY.EASY]: {
    name: 'Легкий',
    description: 'AI играет просто, подходит для начинающих',
    icon: '🟢',
    thinkingTime: 1000
  },
  [AI_DIFFICULTY.MEDIUM]: {
    name: 'Средний',
    description: 'Сбалансированная игра, хороший вызов',
    icon: '🟡',
    thinkingTime: 2000
  },
  [AI_DIFFICULTY.HARD]: {
    name: 'Сложный',
    description: 'AI играет агрессивно и тактично',
    icon: '🟠',
    thinkingTime: 3000
  },
  [AI_DIFFICULTY.EXPERT]: {
    name: 'Эксперт',
    description: 'Максимальная сложность, AI играет как профессионал',
    icon: '🔴',
    thinkingTime: 5000
  }
};

/**
 * Стратегии AI по умолчанию
 */
export const DEFAULT_AI_STRATEGIES = {
  [GAME_TYPES.CHESS]: {
    [AI_DIFFICULTY.EASY]: 'Играю спокойно, фокусируюсь на развитии фигур и простых тактиках.',
    [AI_DIFFICULTY.MEDIUM]: 'Играю сбалансированно, развиваю фигуры и ищу тактические возможности.',
    [AI_DIFFICULTY.HARD]: 'Играю агрессивно, создаю давление и ищу комбинации.',
    [AI_DIFFICULTY.EXPERT]: 'Применяю глубокий анализ позиции, строю долгосрочные планы и использую продвинутые тактики.'
  },
  [GAME_TYPES.TICTACTOE]: {
    [AI_DIFFICULTY.EASY]: 'Играю случайно, иногда делаю ошибки.',
    [AI_DIFFICULTY.MEDIUM]: 'Блокирую победные ходы противника и стремлюсь к победе.',
    [AI_DIFFICULTY.HARD]: 'Использую оптимальную стратегию для победы или ничьи.',
    [AI_DIFFICULTY.EXPERT]: 'Применяю идеальную игру согласно теории игр.'
  }
};

// ================ UI КОНСТАНТЫ ================

/**
 * Размеры компонентов
 */
export const UI_SIZES = {
  BOARD_MIN_SIZE: 300,
  BOARD_MAX_SIZE: 800,
  SIDEBAR_WIDTH: 350,
  HEADER_HEIGHT: 80,
  FOOTER_HEIGHT: 60
};

/**
 * Анимации
 */
export const ANIMATIONS = {
  MOVE_DURATION: 200,
  FADE_DURATION: 300,
  SLIDE_DURATION: 400,
  BOUNCE_DURATION: 600
};

/**
 * Цвета темы
 */
export const THEME_COLORS = {
  light: {
    primary: '#3b82f6',
    secondary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937'
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#818cf8',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb'
  }
};

// ================ МАРШРУТЫ ================

/**
 * Пути маршрутов приложения
 */
export const ROUTES = {
  HOME: '/',
  CHESS: '/chess',
  TICTACTOE: '/tictactoe',
  SETTINGS: '/settings',
  ABOUT: '/about',
  NOT_FOUND: '/404'
};

// ================ ВАЛИДАЦИЯ ================

/**
 * Регулярные выражения для валидации
 */
export const VALIDATION_REGEX = {
  API_KEY: /^[A-Za-z0-9\-_]+$/,
  SESSION_ID: /^[a-f0-9\-]{36}$/i, // UUID формат
  CHESS_MOVE: /^[a-h][1-8][a-h][1-8][qrbn]?$/,
  CHESS_FEN: /^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+\s[bw]\s[KQkq-]+\s[a-h][1-8]|-\s\d+\s\d+$/
};

/**
 * Лимиты
 */
export const LIMITS = {
  API_KEY_MIN_LENGTH: 20,
  API_KEY_MAX_LENGTH: 200,
  MAX_GAME_SESSIONS: 10,
  MAX_MOVE_HISTORY: 1000,
  AI_TIMEOUT: 30000, // 30 секунд
  SESSION_TIMEOUT: 3600000 // 1 час
};

// ================ СООБЩЕНИЯ ================

/**
 * Стандартные сообщения пользователю
 */
export const MESSAGES = {
  LOADING: {
    CREATING_SESSION: 'Создание игровой сессии...',
    AI_THINKING: 'AI думает...',
    LOADING_GAMES: 'Загрузка списка игр...',
    LOADING_MODELS: 'Загрузка моделей AI...'
  },
  
  SUCCESS: {
    SESSION_CREATED: 'Игровая сессия создана успешно',
    MOVE_MADE: 'Ход выполнен',
    SETTINGS_SAVED: 'Настройки сохранены',
    API_KEY_SAVED: 'API ключ сохранен'
  },
  
  ERROR: {
    INVALID_API_KEY: 'Неверный API ключ. Проверьте правильность ввода.',
    SESSION_NOT_FOUND: 'Игровая сессия не найдена',
    INVALID_MOVE: 'Неверный ход. Попробуйте еще раз.',
    NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
    AI_ERROR: 'Ошибка AI. Попробуйте еще раз.',
    TIMEOUT_ERROR: 'Превышено время ожидания. Попробуйте еще раз.'
  },
  
  GAME_STATUS: {
    YOUR_TURN: 'Ваш ход',
    AI_TURN: 'Ход AI',
    CHECKMATE: 'Мат!',
    DRAW: 'Ничья!',
    STALEMATE: 'Пат!',
    CHECK: 'Шах!',
    GAME_OVER: 'Игра окончена'
  }
};

// ================ ЛОКАЛЬНОЕ ХРАНИЛИЩЕ ================

/**
 * Ключи для localStorage
 */
export const STORAGE_KEYS = {
  API_KEY: 'chess_ai_api_key',
  SELECTED_MODEL: 'chess_ai_selected_model',
  USER_PREFERENCES: 'chess_ai_user_preferences',
  GAME_SETTINGS: 'chess_ai_game_settings',
  ACTIVE_SESSIONS: 'chess_ai_active_sessions',
  LAST_GAME_TYPE: 'chess_ai_last_game_type'
};

// ================ СОБЫТИЯ ================

/**
 * Кастомные события приложения
 */
export const EVENTS = {
  GAME_CREATED: 'game:created',
  GAME_ENDED: 'game:ended',
  MOVE_MADE: 'game:move',
  AI_MOVE: 'game:ai-move',
  ERROR_OCCURRED: 'app:error',
  SETTINGS_CHANGED: 'app:settings-changed'
};

// ================ ШАХМАТНЫЕ КОНСТАНТЫ ================

/**
 * Шахматные фигуры
 */
export const CHESS_PIECES = {
  PAWN: 'p',
  ROOK: 'r',
  KNIGHT: 'n',
  BISHOP: 'b',
  QUEEN: 'q',
  KING: 'k'
};

/**
 * Цвета шахматных фигур
 */
export const CHESS_COLORS = {
  WHITE: 'white',
  BLACK: 'black'
};

/**
 * Начальная позиция в шахматах
 */
export const CHESS_INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// ================ КРЕСТИКИ-НОЛИКИ КОНСТАНТЫ ================

/**
 * Символы крестиков-ноликов
 */
export const TICTACTOE_SYMBOLS = {
  X: 'X',
  O: 'O',
  EMPTY: ''
};

/**
 * Размеры доски крестиков-ноликов
 */
export const TICTACTOE_BOARD_SIZES = {
  SMALL: 3,
  MEDIUM: 4,
  LARGE: 5
};

// ================ ЭКСПОРТ ПО УМОЛЧАНИЮ ================

export default {
  GAME_TYPES,
  GAME_CONFIG,
  AI_MODELS,
  AI_DIFFICULTY,
  AI_DIFFICULTY_CONFIG,
  DEFAULT_AI_STRATEGIES,
  UI_SIZES,
  ANIMATIONS,
  THEME_COLORS,
  ROUTES,
  VALIDATION_REGEX,
  LIMITS,
  MESSAGES,
  STORAGE_KEYS,
  EVENTS,
  CHESS_PIECES,
  CHESS_COLORS,
  CHESS_INITIAL_FEN,
  TICTACTOE_SYMBOLS,
  TICTACTOE_BOARD_SIZES
}; 