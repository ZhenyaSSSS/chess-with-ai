import { createContext, useContext, useReducer, useCallback } from 'react';
import { gameAPI } from '../services/gameApi';

// Начальное состояние
const initialState = {
  // Активные игровые сессии
  activeSessions: new Map(),
  
  // Текущая выбранная игра и сессия
  currentGameType: null,
  currentSessionId: null,
  
  // Настройки AI
  aiConfig: {
    apiKey: null,
    model: 'gemini-2.5-pro-preview-05-06',
    difficulty: 'medium',
    strategy: 'Играю сбалансированно, фокусируясь на развитии и контроле центра.'
  },
  
  // Настройки игрока
  playerConfig: {
    side: 'white', // Может быть 'white', 'black' или null для автовыбора
    name: 'Игрок'
  },
  
  // Состояние UI
  isLoading: false,
  error: null,
  
  // Список поддерживаемых игр
  supportedGames: []
};

// Типы действий
const ACTIONS = {
  // Сессии
  SET_ACTIVE_SESSIONS: 'SET_ACTIVE_SESSIONS',
  ADD_SESSION: 'ADD_SESSION',
  UPDATE_SESSION: 'UPDATE_SESSION',
  REMOVE_SESSION: 'REMOVE_SESSION',
  
  // Текущая игра
  SET_CURRENT_GAME: 'SET_CURRENT_GAME',
  CLEAR_CURRENT_GAME: 'CLEAR_CURRENT_GAME',
  
  // Конфигурации
  UPDATE_AI_CONFIG: 'UPDATE_AI_CONFIG',
  UPDATE_PLAYER_CONFIG: 'UPDATE_PLAYER_CONFIG',
  
  // UI состояние
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Поддерживаемые игры
  SET_SUPPORTED_GAMES: 'SET_SUPPORTED_GAMES'
};

// Reducer для управления состоянием
function gameReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_ACTIVE_SESSIONS:
      return {
        ...state,
        activeSessions: new Map(action.payload)
      };
      
    case ACTIONS.ADD_SESSION:
      const newSessions = new Map(state.activeSessions);
      newSessions.set(action.payload.sessionId, action.payload);
      return {
        ...state,
        activeSessions: newSessions
      };
      
    case ACTIONS.UPDATE_SESSION:
      const updatedSessions = new Map(state.activeSessions);
      const existingSession = updatedSessions.get(action.payload.sessionId);
      if (existingSession) {
        updatedSessions.set(action.payload.sessionId, {
          ...existingSession,
          ...action.payload.updates
        });
      }
      return {
        ...state,
        activeSessions: updatedSessions
      };
      
    case ACTIONS.REMOVE_SESSION:
      const filteredSessions = new Map(state.activeSessions);
      filteredSessions.delete(action.payload);
      return {
        ...state,
        activeSessions: filteredSessions,
        // Если удаляемая сессия была текущей, очищаем её
        currentSessionId: state.currentSessionId === action.payload ? null : state.currentSessionId
      };
      
    case ACTIONS.SET_CURRENT_GAME:
      return {
        ...state,
        currentGameType: action.payload.gameType,
        currentSessionId: action.payload.sessionId
      };
      
    case ACTIONS.CLEAR_CURRENT_GAME:
      return {
        ...state,
        currentGameType: null,
        currentSessionId: null
      };
      
    case ACTIONS.UPDATE_AI_CONFIG:
      return {
        ...state,
        aiConfig: {
          ...state.aiConfig,
          ...action.payload
        }
      };
      
    case ACTIONS.UPDATE_PLAYER_CONFIG:
      return {
        ...state,
        playerConfig: {
          ...state.playerConfig,
          ...action.payload
        }
      };
      
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
      
    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    case ACTIONS.SET_SUPPORTED_GAMES:
      return {
        ...state,
        supportedGames: action.payload
      };
      
    default:
      return state;
  }
}

// Создаем контекст
const GameContext = createContext();

/**
 * Provider для игрового контекста
 */
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // ================ API МЕТОДЫ ================
  
  /**
   * Загрузить список поддерживаемых игр
   */
  const loadSupportedGames = useCallback(async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      const games = await gameAPI.getSupportedGames();
      dispatch({ type: ACTIONS.SET_SUPPORTED_GAMES, payload: games });
    } catch (error) {
      console.error('Ошибка загрузки списка игр:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  /**
   * Создать новую игровую сессию
   */
  const createGameSession = useCallback(async (gameType, customConfig = {}) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      const config = {
        playerConfig: { ...state.playerConfig, ...customConfig.playerConfig },
        aiConfig: { ...state.aiConfig, ...customConfig.aiConfig }
      };

      const sessionData = await gameAPI.createGameSession(gameType, config);
      
      // Добавляем дополнительную информацию к сессии
      const enrichedSession = {
        ...sessionData,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        moveCount: 0,
        playerConfig: config.playerConfig,
        aiConfig: config.aiConfig
      };

      dispatch({ type: ACTIONS.ADD_SESSION, payload: enrichedSession });
      dispatch({ 
        type: ACTIONS.SET_CURRENT_GAME, 
        payload: { 
          gameType, 
          sessionId: sessionData.sessionId 
        } 
      });

      return enrichedSession;
    } catch (error) {
      console.error('Ошибка создания игровой сессии:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.playerConfig, state.aiConfig]);

  /**
   * Сделать ход игрока
   */
  const makePlayerMove = useCallback(async (sessionId, move) => {
    try {
      const result = await gameAPI.makePlayerMove(sessionId, move);
      
      // Обновляем сессию
      dispatch({
        type: ACTIONS.UPDATE_SESSION,
        payload: {
          sessionId,
          updates: {
            gameState: result.gameState,
            lastActivity: Date.now(),
            moveCount: result.moveHistory?.length || 0,
            gameEnd: result.gameEnd
          }
        }
      });

      return result;
    } catch (error) {
      console.error('Ошибка хода игрока:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  /**
   * Получить ход от AI
   */
  const getAIMove = useCallback(async (sessionId, customAiConfig = {}) => {
    try {
      const aiConfig = { ...state.aiConfig, ...customAiConfig };
      
      if (!aiConfig.apiKey) {
        throw new Error('API ключ не установлен');
      }

      const result = await gameAPI.getAIMove(sessionId, aiConfig);
      
      // Обновляем стратегию AI если получили новую
      if (result.newStrategy) {
        dispatch({
          type: ACTIONS.UPDATE_AI_CONFIG,
          payload: { strategy: result.newStrategy }
        });
      }

      return result;
    } catch (error) {
      console.error('Ошибка хода AI:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.aiConfig]);

  /**
   * Удалить игровую сессию
   */
  const deleteGameSession = useCallback(async (sessionId) => {
    try {
      await gameAPI.deleteGameSession(sessionId);
      dispatch({ type: ACTIONS.REMOVE_SESSION, payload: sessionId });
    } catch (error) {
      console.error('Ошибка удаления сессии:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  /**
   * Переключиться на другую игру
   */
  const switchToGame = useCallback((gameType, sessionId = null) => {
    dispatch({ 
      type: ACTIONS.SET_CURRENT_GAME, 
      payload: { gameType, sessionId } 
    });
  }, []);

  /**
   * Очистить текущую игру
   */
  const clearCurrentGame = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_CURRENT_GAME });
  }, []);

  // ================ CONFIG МЕТОДЫ ================

  /**
   * Обновить конфигурацию AI
   */
  const updateAIConfig = useCallback((updates) => {
    dispatch({ type: ACTIONS.UPDATE_AI_CONFIG, payload: updates });
  }, []);

  /**
   * Обновить конфигурацию игрока
   */
  const updatePlayerConfig = useCallback((updates) => {
    dispatch({ type: ACTIONS.UPDATE_PLAYER_CONFIG, payload: updates });
  }, []);

  /**
   * Очистить ошибку
   */
  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  }, []);

  // ================ ГЕТТЕРЫ ================

  /**
   * Получить текущую сессию
   */
  const getCurrentSession = useCallback(() => {
    if (!state.currentSessionId) return null;
    return state.activeSessions.get(state.currentSessionId) || null;
  }, [state.currentSessionId, state.activeSessions]);

  /**
   * Получить все сессии определенного типа игры
   */
  const getSessionsByGameType = useCallback((gameType) => {
    return Array.from(state.activeSessions.values())
      .filter(session => session.gameType === gameType);
  }, [state.activeSessions]);

  // Значение контекста
  const contextValue = {
    // Состояние
    ...state,
    
    // API методы
    loadSupportedGames,
    createGameSession,
    makePlayerMove,
    getAIMove,
    deleteGameSession,
    
    // Навигация
    switchToGame,
    clearCurrentGame,
    
    // Конфигурация
    updateAIConfig,
    updatePlayerConfig,
    
    // UI
    clearError,
    
    // Геттеры
    getCurrentSession,
    getSessionsByGameType
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

/**
 * Хук для использования игрового контекста
 */
export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext должен использоваться внутри GameProvider');
  }
  return context;
}

export default GameContext; 