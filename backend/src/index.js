const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const aiService = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware для безопасности
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : [
        'http://localhost:5173', 
        'http://localhost:3000',
        // Разрешаем любые локальные IP в dev режиме
        /^http:\/\/192\.168\.\d+\.\d+:5173$/,
        /^http:\/\/10\.\d+\.\d+\.\d+:5173$/,
        /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:5173$/,
        // Дополнительные паттерны для разных сетевых интерфейсов
        /^http:\/\/100\.\d+\.\d+\.\d+:5173$/,  // Для CGNAT (как 100.64.17.11)
        /^http:\/\/169\.254\.\d+\.\d+:5173$/   // Link-local адреса
      ],
  credentials: true // Разрешаем cookies и авторизацию
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

// Эндпоинт для получения списка доступных моделей
app.post('/api/get-models', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ 
        error: 'API key is required and must be a string' 
      });
    }

    console.log('Получен запрос на список моделей:', {
      apiKeyLength: apiKey.length
    });

    const models = await aiService.getAvailableModels(apiKey);

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
    const { fen, history, apiKey, strategy, model } = req.body;

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
      hasHistory: !!history,
      hasStrategy: !!strategy,
      apiKeyLength: apiKey.length,
      model: model || 'gemini-2.5-pro-preview-05-06 (default)'
    });

    // Вызываем сервис AI для получения хода
    const result = await aiService.getAiMove({
      fen,
      history: history || '',
      strategy: strategy || 'Начинаю партию с фокусом на развитие фигур и контроль центра. План: быстрое развитие, безопасность короля, затем тактические возможности.',
      apiKey,
      model: model || 'gemini-2.5-pro-preview-05-06'
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