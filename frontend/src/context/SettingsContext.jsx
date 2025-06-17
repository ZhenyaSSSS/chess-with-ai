import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

// Ключи для localStorage
const STORAGE_KEYS = {
  API_KEY: 'chess_ai_api_key',
  SELECTED_MODEL: 'chess_ai_selected_model',
  USER_PREFERENCES: 'chess_ai_user_preferences',
  GAME_SETTINGS: 'chess_ai_game_settings'
};

// Начальное состояние настроек
const initialState = {
  // API настройки
  apiKey: null,
  selectedModel: 'gemini-2.5-pro-preview-05-06',
  availableModels: [],
  
  // Пользовательские предпочтения
  userPreferences: {
    theme: 'light', // light, dark, auto
    language: 'ru', // ru, en
    soundEnabled: true,
    animationsEnabled: true,
    boardOrientation: 'white', // white, black, auto
    showCoordinates: true,
    showLastMove: true,
    showPossibleMoves: true
  },
  
  // Игровые настройки по умолчанию
  defaultGameSettings: {
    chess: {
      timeControl: null, // null для безлимитной игры
      playerSide: 'white',
      aiDifficulty: 'medium',
      enableHints: false
    },
    tictactoe: {
      playerSide: 'X',
      aiDifficulty: 'medium',
      boardSize: 3
    }
  },
  
  // UI состояние
  isFirstLaunch: true,
  settingsLoaded: false
};

// Типы действий
const ACTIONS = {
  // API
  SET_API_KEY: 'SET_API_KEY',
  SET_SELECTED_MODEL: 'SET_SELECTED_MODEL',
  SET_AVAILABLE_MODELS: 'SET_AVAILABLE_MODELS',
  
  // Предпочтения
  UPDATE_USER_PREFERENCES: 'UPDATE_USER_PREFERENCES',
  RESET_USER_PREFERENCES: 'RESET_USER_PREFERENCES',
  
  // Игровые настройки
  UPDATE_GAME_SETTINGS: 'UPDATE_GAME_SETTINGS',
  RESET_GAME_SETTINGS: 'RESET_GAME_SETTINGS',
  
  // Системные
  SET_FIRST_LAUNCH: 'SET_FIRST_LAUNCH',
  SET_SETTINGS_LOADED: 'SET_SETTINGS_LOADED',
  RESET_ALL_SETTINGS: 'RESET_ALL_SETTINGS'
};

// Reducer для управления настройками
function settingsReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_API_KEY:
      return {
        ...state,
        apiKey: action.payload
      };
      
    case ACTIONS.SET_SELECTED_MODEL:
      return {
        ...state,
        selectedModel: action.payload
      };
      
    case ACTIONS.SET_AVAILABLE_MODELS:
      return {
        ...state,
        availableModels: action.payload
      };
      
    case ACTIONS.UPDATE_USER_PREFERENCES:
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload
        }
      };
      
    case ACTIONS.RESET_USER_PREFERENCES:
      return {
        ...state,
        userPreferences: initialState.userPreferences
      };
      
    case ACTIONS.UPDATE_GAME_SETTINGS:
      const { gameType, settings } = action.payload;
      return {
        ...state,
        defaultGameSettings: {
          ...state.defaultGameSettings,
          [gameType]: {
            ...state.defaultGameSettings[gameType],
            ...settings
          }
        }
      };
      
    case ACTIONS.RESET_GAME_SETTINGS:
      return {
        ...state,
        defaultGameSettings: initialState.defaultGameSettings
      };
      
    case ACTIONS.SET_FIRST_LAUNCH:
      return {
        ...state,
        isFirstLaunch: action.payload
      };
      
    case ACTIONS.SET_SETTINGS_LOADED:
      return {
        ...state,
        settingsLoaded: action.payload
      };
      
    case ACTIONS.RESET_ALL_SETTINGS:
      return {
        ...initialState,
        settingsLoaded: true
      };
      
    default:
      return state;
  }
}

// Вспомогательные функции для работы с localStorage
const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Ошибка чтения из localStorage (${key}):`, error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Ошибка записи в localStorage (${key}):`, error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Ошибка удаления из localStorage (${key}):`, error);
    }
  }
};

// Создаем контекст
const SettingsContext = createContext();

/**
 * Provider для контекста настроек
 */
export function SettingsProvider({ children }) {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  // ================ ЗАГРУЗКА НАСТРОЕК ИЗ LOCALSTORAGE ================
  
  const loadSettings = useCallback(() => {
    try {
      // Загружаем API настройки
      const apiKey = storage.get(STORAGE_KEYS.API_KEY);
      const selectedModel = storage.get(STORAGE_KEYS.SELECTED_MODEL, initialState.selectedModel);
      
      // Загружаем пользовательские предпочтения
      const userPreferences = storage.get(STORAGE_KEYS.USER_PREFERENCES, initialState.userPreferences);
      
      // Загружаем игровые настройки
      const gameSettings = storage.get(STORAGE_KEYS.GAME_SETTINGS, initialState.defaultGameSettings);
      
      // Проверяем первый запуск
      const isFirstLaunch = !localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);

      // Применяем загруженные настройки
      if (apiKey) {
        dispatch({ type: ACTIONS.SET_API_KEY, payload: apiKey });
      }
      
      dispatch({ type: ACTIONS.SET_SELECTED_MODEL, payload: selectedModel });
      dispatch({ type: ACTIONS.UPDATE_USER_PREFERENCES, payload: userPreferences });
      dispatch({ type: ACTIONS.RESET_GAME_SETTINGS });
      
      // Обновляем игровые настройки
      Object.entries(gameSettings).forEach(([gameType, settings]) => {
        dispatch({ 
          type: ACTIONS.UPDATE_GAME_SETTINGS, 
          payload: { gameType, settings } 
        });
      });
      
      dispatch({ type: ACTIONS.SET_FIRST_LAUNCH, payload: isFirstLaunch });
      dispatch({ type: ACTIONS.SET_SETTINGS_LOADED, payload: true });
      
      console.log('📚 Настройки загружены из localStorage');
      
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
      dispatch({ type: ACTIONS.SET_SETTINGS_LOADED, payload: true });
    }
  }, []);

  // Загружаем настройки при инициализации
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ================ СОХРАНЕНИЕ НАСТРОЕК ================
  
  // Сохраняем API ключ
  useEffect(() => {
    if (state.settingsLoaded) {
      if (state.apiKey) {
        storage.set(STORAGE_KEYS.API_KEY, state.apiKey);
      } else {
        storage.remove(STORAGE_KEYS.API_KEY);
      }
    }
  }, [state.apiKey, state.settingsLoaded]);

  // Сохраняем выбранную модель
  useEffect(() => {
    if (state.settingsLoaded) {
      storage.set(STORAGE_KEYS.SELECTED_MODEL, state.selectedModel);
    }
  }, [state.selectedModel, state.settingsLoaded]);

  // Сохраняем пользовательские предпочтения
  useEffect(() => {
    if (state.settingsLoaded) {
      storage.set(STORAGE_KEYS.USER_PREFERENCES, state.userPreferences);
    }
  }, [state.userPreferences, state.settingsLoaded]);

  // Сохраняем игровые настройки
  useEffect(() => {
    if (state.settingsLoaded) {
      storage.set(STORAGE_KEYS.GAME_SETTINGS, state.defaultGameSettings);
    }
  }, [state.defaultGameSettings, state.settingsLoaded]);

  // ================ API МЕТОДЫ ================

  /**
   * Установить API ключ
   */
  const setApiKey = useCallback((apiKey) => {
    dispatch({ type: ACTIONS.SET_API_KEY, payload: apiKey });
  }, []);

  /**
   * Удалить API ключ
   */
  const clearApiKey = useCallback(() => {
    dispatch({ type: ACTIONS.SET_API_KEY, payload: null });
  }, []);

  /**
   * Установить выбранную модель
   */
  const setSelectedModel = useCallback((model) => {
    dispatch({ type: ACTIONS.SET_SELECTED_MODEL, payload: model });
  }, []);

  /**
   * Установить доступные модели
   */
  const setAvailableModels = useCallback((models) => {
    dispatch({ type: ACTIONS.SET_AVAILABLE_MODELS, payload: models });
  }, []);

  // ================ ПОЛЬЗОВАТЕЛЬСКИЕ ПРЕДПОЧТЕНИЯ ================

  /**
   * Обновить пользовательские предпочтения
   */
  const updateUserPreferences = useCallback((updates) => {
    dispatch({ type: ACTIONS.UPDATE_USER_PREFERENCES, payload: updates });
  }, []);

  /**
   * Сбросить пользовательские предпочтения
   */
  const resetUserPreferences = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_USER_PREFERENCES });
  }, []);

  /**
   * Переключить тему
   */
  const toggleTheme = useCallback(() => {
    const newTheme = state.userPreferences.theme === 'light' ? 'dark' : 'light';
    updateUserPreferences({ theme: newTheme });
  }, [state.userPreferences.theme, updateUserPreferences]);

  /**
   * Переключить звуки
   */
  const toggleSounds = useCallback(() => {
    updateUserPreferences({ soundEnabled: !state.userPreferences.soundEnabled });
  }, [state.userPreferences.soundEnabled, updateUserPreferences]);

  // ================ ИГРОВЫЕ НАСТРОЙКИ ================

  /**
   * Обновить настройки конкретной игры
   */
  const updateGameSettings = useCallback((gameType, settings) => {
    dispatch({ 
      type: ACTIONS.UPDATE_GAME_SETTINGS, 
      payload: { gameType, settings } 
    });
  }, []);

  /**
   * Получить настройки конкретной игры
   */
  const getGameSettings = useCallback((gameType) => {
    return state.defaultGameSettings[gameType] || {};
  }, [state.defaultGameSettings]);

  /**
   * Сбросить игровые настройки
   */
  const resetGameSettings = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_GAME_SETTINGS });
  }, []);

  // ================ СИСТЕМНЫЕ МЕТОДЫ ================

  /**
   * Завершить первый запуск
   */
  const completeFirstLaunch = useCallback(() => {
    dispatch({ type: ACTIONS.SET_FIRST_LAUNCH, payload: false });
  }, []);

  /**
   * Полный сброс всех настроек
   */
  const resetAllSettings = useCallback(() => {
    // Очищаем localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
      storage.remove(key);
    });
    
    // Сбрасываем состояние
    dispatch({ type: ACTIONS.RESET_ALL_SETTINGS });
    
    console.log('🔄 Все настройки сброшены');
  }, []);

  /**
   * Экспорт настроек
   */
  const exportSettings = useCallback(() => {
    const exportData = {
      userPreferences: state.userPreferences,
      defaultGameSettings: state.defaultGameSettings,
      selectedModel: state.selectedModel,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [state.userPreferences, state.defaultGameSettings, state.selectedModel]);

  /**
   * Импорт настроек
   */
  const importSettings = useCallback((settingsJson) => {
    try {
      const importData = JSON.parse(settingsJson);
      
      if (importData.userPreferences) {
        dispatch({ type: ACTIONS.UPDATE_USER_PREFERENCES, payload: importData.userPreferences });
      }
      
      if (importData.defaultGameSettings) {
        Object.entries(importData.defaultGameSettings).forEach(([gameType, settings]) => {
          dispatch({ 
            type: ACTIONS.UPDATE_GAME_SETTINGS, 
            payload: { gameType, settings } 
          });
        });
      }
      
      if (importData.selectedModel) {
        dispatch({ type: ACTIONS.SET_SELECTED_MODEL, payload: importData.selectedModel });
      }
      
      console.log('📥 Настройки импортированы успешно');
      return true;
      
    } catch (error) {
      console.error('Ошибка импорта настроек:', error);
      return false;
    }
  }, []);

  // Значение контекста
  const contextValue = {
    // Состояние
    ...state,
    
    // API методы
    setApiKey,
    clearApiKey,
    setSelectedModel,
    setAvailableModels,
    
    // Пользовательские предпочтения
    updateUserPreferences,
    resetUserPreferences,
    toggleTheme,
    toggleSounds,
    
    // Игровые настройки
    updateGameSettings,
    getGameSettings,
    resetGameSettings,
    
    // Системные
    completeFirstLaunch,
    resetAllSettings,
    exportSettings,
    importSettings,
    loadSettings
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Хук для использования контекста настроек
 */
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings должен использоваться внутри SettingsProvider');
  }
  return context;
}

export default SettingsContext; 