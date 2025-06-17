const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const aiService = require('./services/aiService');

// Инициализируем GameManager с обработкой ошибок
let GameManager;
try {
  console.log('🔧 Инициализация GameManager...');
  GameManager = require('./managers/GameManager');
  console.log('✅ GameManager успешно инициализирован');
} catch (error) {
  console.error('❌ Ошибка инициализации GameManager:', error);
  // Создаем заглушку
  GameManager = {
    getSupportedGames: () => ['chess', 'tictactoe'],
    createGameSession: () => { throw new Error('GameManager не инициализирован'); },
    getGameSession: () => null
  };
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware для безопасности
app.use(helmet());
// Временно отключаем CORS для тестирования
app.use(cors({
  origin: true, // Разрешаем все источники для тестирования
  credentials: true
}));

// Rate limiting для защиты от злоупотреблений
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP за windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));

// Логирование запросов в dev режиме
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check эндпоинт
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ========== DEBUG API ==========
app.post('/api/debug/toggle', (req, res) => {
  const { enabled } = req.body;
  aiService.setDebugMode(enabled);
  res.json({ success: true, debugMode: enabled });
});

app.get('/api/debug/logs', (req, res) => {
  res.json({ logs: aiService.getDebugLogs() });
});

app.delete('/api/debug/logs', (req, res) => {
  aiService.clearDebugLogs();
  res.json({ success: true, message: 'Debug logs cleared' });
});
// =============================

// Эндпоинт для смены версии API
app.post('/api/set-api-version', (req, res) => {
  try {
    const { version } = req.body;
    console.log('Запрос на смену версии API:', version);
    
    aiService.setApiVersion(version);
    
    res.json({ 
      success: true, 
      version: version,
      message: `API версия изменена на ${version}`
    });
  } catch (error) {
    console.error('Ошибка смены версии API:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Эндпоинт для получения текущей версии API
app.get('/api/get-api-version', (req, res) => {
  try {
    const currentVersion = aiService.currentApiVersion;
    const availableVersions = Object.keys(aiService.apiVersions);
    
    res.json({ 
      currentVersion,
      availableVersions,
      baseUrl: aiService.getApiBaseUrl()
    });

  } catch (error) {
    console.error('Ошибка при получении версии API:', error);
    res.status(500).json({ 
      error: 'Internal server error. Please try again.' 
    });
  }
});

// Эндпоинт для получения списка доступных моделей
app.post('/api/get-models', async (req, res) => {
  try {
    const { apiKey, apiVersion } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ 
        error: 'API key is required and must be a string' 
      });
    }

    console.log('Получен запрос на список моделей:', {
      apiKeyLength: apiKey.length,
      apiVersion: apiVersion || 'default'
    });

    const models = await aiService.getAvailableModels(apiKey, apiVersion);

    console.log(`Найдено ${models.length} моделей, доступных: ${models.filter(m => m.available).length}`);

    res.json({ models });

  } catch (error) {
    console.error('Ошибка при получении списка моделей:', error);

    if (error.message.includes('API_KEY_INVALID')) {
      return res.status(401).json({ 
        error: 'Invalid API key. Please check your Gemini API key.' 
      });
    }

    res.status(500).json({ 
      error: 'Internal server error. Please try again.' 
    });
  }
});

// Главный эндпоинт для получения хода AI
app.post('/api/get-ai-move', async (req, res) => {
  try {
    const { fen, apiKey, strategy, model, aiSide, lastAiMove, lastPlayerMove } = req.body;

    // Валидация входных данных
    if (!fen || typeof fen !== 'string') {
      return res.status(400).json({ 
        error: 'FEN string is required and must be a string' 
      });
    }

    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ 
        error: 'API key is required and must be a string' 
      });
    }

    console.log('Получен запрос на ход AI:', {
      fen: fen.substring(0, 50) + '...',
      hasStrategy: !!strategy,
      aiSide: aiSide || 'not specified',
      apiKeyLength: apiKey.length,
      model: model || 'gemini-2.5-pro-preview-05-06 (default)'
    });

    // Вызываем сервис AI для получения хода
    const result = await aiService.getAiMove({
      fen,
      strategy: strategy || 'Начинаю партию с фокусом на развитие фигур и контроль центра. План: быстрое развитие, безопасность короля, затем тактические возможности.',
      apiKey,
      model: model || 'gemini-2.5-pro-preview-05-06',
      aiSide: aiSide || 'black',
      lastAiMove,
      lastPlayerMove
    });

    console.log('AI успешно предоставил ход:', result.move, `(модель: ${result.model})`);

    res.json(result);

  } catch (error) {
    console.error('Ошибка при получении хода AI:', error);

    if (error.message.includes('API_KEY_INVALID')) {
      return res.status(401).json({ 
        error: 'Invalid API key. Please check your Gemini API key.' 
      });
    }

    if (error.message.includes('QUOTA_EXCEEDED')) {
      return res.status(429).json({ 
        error: 'API quota exceeded. Please try again later.' 
      });
    }

    if (error.message.includes('AI_FAILED_TO_MOVE')) {
      return res.status(500).json({ 
        error: 'AI failed to provide a valid move after multiple attempts.' 
      });
    }

    // Общая ошибка сервера
    res.status(500).json({ 
      error: 'Internal server error. Please try again.' 
    });
  }
});

// ========== НОВЫЕ API РОУТЫ ДЛЯ УНИВЕРСАЛЬНОЙ ИГРОВОЙ СИСТЕМЫ ==========

// Получить список поддерживаемых игр
app.get('/api/games', (req, res) => {
  try {
    console.log('🎮 Запрос списка поддерживаемых игр...');
    const supportedGames = GameManager.getSupportedGames();
    console.log('✅ Получены игры:', supportedGames);
    res.json({ games: supportedGames });
  } catch (error) {
    console.error('❌ Ошибка получения списка игр:', error);
    // Fallback - возвращаем статический список
    res.json({ 
      games: ['chess', 'tictactoe'],
      fallback: true, 
      error: error.message 
    });
  }
});

// Создать новую игровую сессию
app.post('/api/games/:gameType/sessions', (req, res) => {
  try {
    const { gameType } = req.params;
    const { playerConfig, aiConfig } = req.body;

    console.log(`Создание сессии для игры: ${gameType}`, { playerConfig, aiConfig });

    const sessionResult = GameManager.createGameSession(gameType, {
      playerConfig,
      aiConfig
    });

    const sessionId = sessionResult.gameId;
    const gameState = sessionResult.gameState;

    res.json({
      sessionId,
      gameState,
      gameType
    });

  } catch (error) {
    console.error('Ошибка создания игровой сессии:', error);
    res.status(400).json({ error: error.message });
  }
});

// Получить состояние игровой сессии
app.get('/api/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = GameManager.getGameSession(sessionId);
    const gameState = session ? session.gameState : null;

    if (!gameState) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ sessionId, gameState });

  } catch (error) {
    console.error('Ошибка получения состояния сессии:', error);
    res.status(500).json({ error: error.message });
  }
});

// Сделать ход игрока
app.post('/api/sessions/:sessionId/moves', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { move } = req.body;

    console.log(`Ход игрока в сессии ${sessionId}:`, move);

    const result = await GameManager.makeMove(sessionId, move, 'human');

    res.json(result);

  } catch (error) {
    console.error('Ошибка выполнения хода:', error);
    res.status(400).json({ error: error.message });
  }
});

// Получить ход AI
app.post('/api/sessions/:sessionId/ai-move', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { apiKey, model, strategy, aiSide } = req.body;

    console.log(`Запрос хода AI для сессии ${sessionId}:`, {
      model: model || 'не указана',
      hasStrategy: !!strategy,
      aiSide: aiSide || 'не указана'
    });

    // Пока что используем старый AI сервис для совместимости
    const session = GameManager.getGameSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const result = await aiService.getAiMove({
      fen: session.gameState.fen,
      strategy: strategy || 'Играю в шахматы с фокусом на развитие и тактику.',
      apiKey,
      model: model || 'gemini-2.5-pro-preview-05-06',
      aiSide: aiSide || 'black'
    });

    // Обновляем состояние сессии
    // TODO: интегрировать с GameManager полностью

    res.json(result);

  } catch (error) {
    console.error('Ошибка получения хода AI:', error);
    
    if (error.message.includes('API_KEY_INVALID')) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Удалить игровую сессию
app.delete('/api/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const success = GameManager.removeGameSession(sessionId);
    
    if (!success) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted successfully' });

  } catch (error) {
    console.error('Ошибка удаления сессии:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить аналитику игры (для конкретных игр)
app.get('/api/sessions/:sessionId/analysis', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = GameManager.getGameSession(sessionId);
    const analysis = session ? session.gameEngine.getGameAnalysis(session.gameState) : null;

    if (!analysis) {
      return res.status(404).json({ error: 'Session not found or analysis not available' });
    }

    res.json({ sessionId, analysis });

  } catch (error) {
    console.error('Ошибка получения аналитики:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== КОНЕЦ НОВЫХ API РОУТОВ ==========

// Обслуживание статических файлов в продакшене
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  
  // Статические файлы
  app.use(express.static(frontendPath));
  
  // SPA fallback - все неизвестные роуты перенаправляем на index.html
  app.get('*', (req, res) => {
    // Исключаем API роуты
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // В dev режиме возвращаем ошибку для неизвестных роутов
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });
}

// Глобальный обработчик ошибок
app.use((error, req, res, next) => {
  console.error('Необработанная ошибка:', error);
  res.status(500).json({ 
    error: 'Something went wrong!' 
  });
});

// Запуск сервера
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Chess AI Backend запущен на всех интерфейсах:${PORT}`);
    console.log(`🌍 Health check: http://localhost:${PORT}/api/health`);
    
    // Показываем все доступные адреса
    const os = require('os');
    const interfaces = os.networkInterfaces();
    console.log('\n📡 Доступные сетевые адреса:');
    
    Object.keys(interfaces).forEach(name => {
      interfaces[name].forEach(iface => {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`   http://${iface.address}:${PORT}/api/health`);
        }
      });
    });
    console.log('');
  });
}

module.exports = app; 