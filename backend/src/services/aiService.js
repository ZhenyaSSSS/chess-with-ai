const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Chess } = require('chess.js');

// Добавляем поддержку fetch для старых версий Node.js
if (!globalThis.fetch) {
  globalThis.fetch = require('node-fetch');
}

/**
 * Универсальный AI сервис для любых игр
 * Не содержит игрово-специфичной логики
 */
class AIService {
  constructor() {
    this.maxAttempts = 5; // Увеличиваем базовое количество попыток
    this.cacheTimeout = 30 * 60 * 1000; // 30 минут
    this.modelAvailabilityCache = new Map();
    
    // Отладочные логи
    this.debugLogs = [];
    this.debugMode = false;
    
    // Известные проблемные модели
    this.knownProblematicModels = new Set([
      'gemini-2.5-flash-preview-tts',
      'gemini-2.5-pro-preview-tts'
    ]);
    
    // Поддерживаемые версии API
    this.apiVersions = {
      'v1': 'https://generativelanguage.googleapis.com/v1',
      'v1beta': 'https://generativelanguage.googleapis.com/v1beta',
      'v2': 'https://generativelanguage.googleapis.com/v2',
      'demo': 'https://generativelanguage.googleapis.com/v1beta' // Demo использует v1beta
    };
    
    // Текущая версия API (по умолчанию)
    this.currentApiVersion = 'v1beta';
    
    // Актуальные модели Gemini
    this.availableModels = {
      'gemini-2.5-pro-preview-05-06': {
        name: 'Gemini 2.5 Pro Preview 05-06',
        description: 'Рекомендуемая стабильная версия 2.5 Pro',
        maxTokens: 2048,
        temperature: 0.7
      },
      'gemini-2.5-flash-preview-05-20': {
        name: 'Gemini 2.5 Flash Preview 05-20',
        description: 'Быстрая модель Gemini 2.5',
        maxTokens: 1024,
        temperature: 0.7
      },
      'gemini-1.5-pro': {
        name: 'Gemini 1.5 Pro (Legacy)',
        description: 'Устаревшая модель 1.5',
        maxTokens: 1024,
        temperature: 0.7
      },
      'gemini-1.5-flash': {
        name: 'Gemini 1.5 Flash (Legacy)',
        description: 'Устаревшая быстрая модель',
        maxTokens: 1024,
        temperature: 0.7
      }
    };
  }

  /**
   * Включить/выключить режим отладки
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    if (enabled) {
      this.addDebugLog('info', '🐛 Режим отладки включен');
    } else {
      this.addDebugLog('info', '🐛 Режим отладки выключен');
    }
  }

  /**
   * Добавить запись в лог отладки
   */
  addDebugLog(type, message, extra = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type, // prompt, response, error, info
      message,
      ...extra
    };
    
    this.debugLogs.push(logEntry);
    
    // Ограничиваем количество логов (последние 1000)
    if (this.debugLogs.length > 1000) {
      this.debugLogs = this.debugLogs.slice(-1000);
    }
    
    // Логируем в консоль если режим отладки включен
    if (this.debugMode) {
      console.log(`[DEBUG] ${type.toUpperCase()}: ${message}`, extra);
    }
  }

  /**
   * Получить логи отладки
   */
  getDebugLogs() {
    return this.debugLogs;
  }

  /**
   * Очистить логи отладки
   */
  clearDebugLogs() {
    this.debugLogs = [];
    this.addDebugLog('info', '🧹 Логи отладки очищены');
  }

  /**
   * Установить версию API
   * @param {string} version - Версия API (v1, v1beta, v2, demo)
   */
  setApiVersion(version) {
    if (this.apiVersions[version]) {
      this.currentApiVersion = version;
      console.log(`🔧 API версия изменена на: ${version}`);
    } else {
      console.warn(`⚠️ Неизвестная версия API: ${version}. Доступные: ${Object.keys(this.apiVersions).join(', ')}`);
    }
  }

  /**
   * Получить текущий базовый URL API
   * @returns {string} Базовый URL для текущей версии API
   */
  getApiBaseUrl() {
    return this.apiVersions[this.currentApiVersion];
  }

  /**
   * Получает список доступных моделей из Google API
   * @param {string} apiKey - API ключ для проверки доступности
   * @param {string} apiVersion - Версия API (опционально)
   * @returns {Promise<Array>} Список доступных моделей
   */
  async getAvailableModels(apiKey, apiVersion = null) {
    try {
      // Временно меняем версию API если указана
      const originalVersion = this.currentApiVersion;
      if (apiVersion && this.apiVersions[apiVersion]) {
        this.setApiVersion(apiVersion);
      }
      
      console.log(`🔍 Получаем список моделей из Google API (${this.currentApiVersion})...`);
      
      // Пробуем разные версии API
      const versionsToTry = apiVersion ? [apiVersion] : ['v1beta', 'v1', 'v2'];
      let lastError = null;
      
      for (const version of versionsToTry) {
        try {
          const baseUrl = this.apiVersions[version];
          const url = `${baseUrl}/models?key=${apiKey}`;
          
          console.log(`🚀 Пробуем API версию ${version}: ${url}`);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            if (response.status === 403 || response.status === 401) {
              throw new Error('API_KEY_INVALID');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log(`📡 Успешно получено ${data.models?.length || 0} моделей через API ${version}`);
          
          // Устанавливаем рабочую версию как текущую
          this.currentApiVersion = version;
          
          return await this.processModels(data, apiKey);
          
        } catch (error) {
          console.log(`❌ API версия ${version} не работает: ${error.message}`);
          lastError = error;
          continue;
        }
      }
      
      // Восстанавливаем оригинальную версию
      this.currentApiVersion = originalVersion;
      throw lastError;
      
    } catch (error) {
      console.error('❌ Ошибка получения списка моделей:', error);
      return this.getFallbackModels();
    }
  }

  /**
   * Обрабатывает полученные модели и тестирует их
   * @param {Object} data - Данные от API
   * @param {string} apiKey - API ключ
   * @returns {Promise<Array>} Обработанный список моделей
   */
  async processModels(data, apiKey) {
    if (!data.models || !Array.isArray(data.models)) {
      throw new Error('Некорректный ответ от API Google');
    }

    // Фильтруем только generative модели
    const generativeModels = data.models.filter(model => 
      model.supportedGenerationMethods?.includes('generateContent') &&
      model.name.includes('gemini')
    );

    console.log(`🤖 Найдено ${generativeModels.length} генеративных Gemini моделей`);

    // Тестируем каждую модель на работоспособность
    const testedModels = [];
    let testedCount = 0;
    const maxTestsPerRequest = 15; // Ограничиваем количество тестов для экономии квоты
    
    for (const model of generativeModels) {
      const modelId = model.name.replace('models/', '');
      
      // Проверяем кэш
      const cacheKey = `${modelId}_${apiKey.slice(-8)}`;
      const cached = this.modelAvailabilityCache.get(cacheKey);
      if (cached) {
        const cacheAge = Date.now() - cached.timestamp;
        const maxAge = cached.cacheTime || this.cacheTimeout;
        
        if (cacheAge < maxAge) {
          console.log(`📋 Используем кэш для модели: ${modelId} (${cached.available ? 'доступна' : 'недоступна'})`);
          testedModels.push({
            ...cached.data,
            status: cached.available ? 'cached_working' : 'cached_unavailable'
          });
          continue;
        } else {
          // Удаляем устаревший кэш
          this.modelAvailabilityCache.delete(cacheKey);
        }
      }
      
      // Помечаем известные проблемные модели, но не пропускаем их полностью
      let isKnownProblematic = this.knownProblematicModels.has(modelId);
      if (isKnownProblematic) {
        console.log(`⚠️ Известная проблемная модель: ${modelId} - добавляем без тестирования`);
        const modelData = {
          id: modelId,
          name: this.getModelDisplayName(modelId, model),
          description: this.getModelDescription(modelId, model),
          available: false, // Помечаем как недоступную, но позволяем выбрать
          status: 'known_problematic',
          error: 'Модель известна как проблемная (deprecated или часто превышает квоту). Используйте на свой страх и риск.',
          version: this.getModelVersion(modelId),
          apiVersion: this.currentApiVersion,
          capabilities: model.supportedGenerationMethods || [],
          inputTokenLimit: model.inputTokenLimit || 'Неизвестно',
          outputTokenLimit: model.outputTokenLimit || 'Неизвестно',
          canSelectAnyway: true // Флаг что можно выбрать несмотря на проблемы
        };
        
        testedModels.push(modelData);
        
        // Кэшируем результат
        this.modelAvailabilityCache.set(cacheKey, {
          data: modelData,
          available: false,
          timestamp: Date.now()
        });
        continue;
      }
      
      // Проверяем лимит тестирования
      if (testedCount >= maxTestsPerRequest) {
        console.log(`⏸️ Достигнут лимит тестирования (${maxTestsPerRequest}), пропускаем ${modelId}`);
        testedModels.push({
          id: modelId,
          name: this.getModelDisplayName(modelId, model),
          description: this.getModelDescription(modelId, model),
          available: false,
          status: 'skipped_quota_limit',
          error: 'Пропущено для экономии квоты (превышен лимит тестирования). Можно выбрать на свой страх и риск.',
          version: this.getModelVersion(modelId),
          apiVersion: this.currentApiVersion,
          capabilities: model.supportedGenerationMethods || [],
          inputTokenLimit: model.inputTokenLimit || 'Неизвестно',
          outputTokenLimit: model.outputTokenLimit || 'Неизвестно',
          canSelectAnyway: true // Можно выбрать несмотря на то что не тестировалась
        });
        continue;
      }

      console.log(`🧪 Тестируем модель: ${modelId} на API ${this.currentApiVersion}... (${testedCount + 1}/${maxTestsPerRequest})`);
      testedCount++;
      
      try {
        // Создаем кастомный fetch для тестирования
        const createTestFetch = () => {
          return (url, options) => {
            if (typeof url === 'string' && url.includes('generativelanguage.googleapis.com/v1/')) {
              const newUrl = url.replace('/v1/', `/${this.currentApiVersion}/`);
              return fetch(newUrl, options);
            }
            return fetch(url, options);
          };
        };

        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Устанавливаем кастомный fetch для тестирования если версия API не v1
        if (this.currentApiVersion !== 'v1') {
          genAI.requestOptions = {
            fetch: createTestFetch()
          };
        }
        
        const testModel = genAI.getGenerativeModel({ 
          model: modelId,
          generationConfig: {
            maxOutputTokens: 5,
            temperature: 0.1
          }
        });
        
        // Быстрый тест с минимальным запросом для экономии квоты
        const testResult = await Promise.race([
          testModel.generateContent('Hi'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 2000)
          )
        ]);
        
        if (testResult?.response?.text()) {
          console.log(`✅ Модель ${modelId} работает`);
          
          const modelData = {
            id: modelId,
            name: this.getModelDisplayName(modelId, model),
            description: this.getModelDescription(modelId, model),
            available: true,
            status: 'working',
            version: this.getModelVersion(modelId),
            apiVersion: this.currentApiVersion,
            capabilities: model.supportedGenerationMethods || [],
            inputTokenLimit: model.inputTokenLimit || 'Неизвестно',
            outputTokenLimit: model.outputTokenLimit || 'Неизвестно'
          };
          
          testedModels.push(modelData);
          
          // Кэшируем успешный результат
          this.modelAvailabilityCache.set(cacheKey, {
            data: modelData,
            available: true,
            timestamp: Date.now()
          });
        }
        
      } catch (error) {
        console.log(`❌ Модель ${modelId} недоступна: ${error.message}`);
        
        let errorType = 'unknown';
        if (error.message.includes('not found') || error.message.includes('404')) {
          errorType = 'not_found';
        } else if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
          errorType = 'quota_exceeded';
        } else if (error.message.includes('API_KEY')) {
          errorType = 'api_key_invalid';
        } else if (error.message.includes('Timeout')) {
          errorType = 'timeout';
        }
        
        const modelData = {
          id: modelId,
          name: this.getModelDisplayName(modelId, model),
          description: this.getModelDescription(modelId, model),
          available: false,
          status: errorType,
          error: this.getErrorMessage(errorType, error.message),
          version: this.getModelVersion(modelId),
          apiVersion: this.currentApiVersion,
          capabilities: model.supportedGenerationMethods || [],
          inputTokenLimit: model.inputTokenLimit || 'Неизвестно',
          outputTokenLimit: model.outputTokenLimit || 'Неизвестно',
          canSelectAnyway: errorType !== 'api_key_invalid' // Можно выбрать если проблема не в API ключе
        };
        
        testedModels.push(modelData);
        
        // Кэшируем неудачный результат (но не на долго для квотных ошибок)
        const cacheTime = errorType === 'quota_exceeded' ? 5 * 60 * 1000 : this.cacheTimeout; // 5 мин для квотных ошибок
        this.modelAvailabilityCache.set(cacheKey, {
          data: modelData,
          available: false,
          timestamp: Date.now(),
          cacheTime
        });
      }
    }
    
    // Сортируем: сначала рабочие, потом рекомендуемые, потом по версии (новые сверху)
    const recommendedModels = [
      'gemini-2.0-flash',
      'gemini-1.5-flash', 
      'gemini-1.5-flash-8b',
      'gemini-2.0-flash-001',
      'gemini-2.5-pro-preview-05-06',
      'gemini-1.5-pro'
    ];
    
    testedModels.sort((a, b) => {
      // Сначала доступные
      if (a.available !== b.available) {
        return b.available - a.available;
      }
      
      // Среди доступных - сначала рекомендуемые
      if (a.available && b.available) {
        const aRecommended = recommendedModels.indexOf(a.id);
        const bRecommended = recommendedModels.indexOf(b.id);
        
        if (aRecommended !== -1 && bRecommended !== -1) {
          return aRecommended - bRecommended; // По порядку рекомендаций
        } else if (aRecommended !== -1) {
          return -1; // a рекомендуемая, b нет
        } else if (bRecommended !== -1) {
          return 1; // b рекомендуемая, a нет
        }
      }
      
      // По версии (новые сверху)
      return b.version.localeCompare(a.version);
    });
    
    console.log(`✨ Обработка завершена. Доступно: ${testedModels.filter(m => m.available).length}/${testedModels.length} моделей`);
    
    // Сортируем модели для консистентности
    const sortedModels = testedModels
      .sort((a, b) => {
        // Сначала по доступности
        if (a.available && !b.available) return -1;
        if (!a.available && b.available) return 1;
        
        // Затем по ID
        return a.id.localeCompare(b.id);
      });

    console.log(`🏆 Топ-5 моделей: ${sortedModels.slice(0, 5).map(m => `${m.id} (${m.available ? 'доступна' : 'недоступна'})`).join(', ')}`);

    return sortedModels;
  }

  /**
   * Возвращает резервный список моделей
   * @returns {Array} Список моделей по умолчанию
   */
  getFallbackModels() {
    console.log('🔄 Используем резервный список моделей...');
    
    return [
      {
        id: 'gemini-2.5-pro-preview-05-06',
        name: 'Gemini 2.5 Pro Preview 05-06',
        description: 'Рекомендуемая стабильная версия 2.5 Pro',
        available: true,
        status: 'fallback',
        version: '2.5',
        apiVersion: this.currentApiVersion,
        capabilities: ['generateContent'],
        inputTokenLimit: 'До 1M токенов',
        outputTokenLimit: 'До 8K токенов'
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro (Legacy)',
        description: 'Устаревшая, но стабильная модель',
        available: true,
        status: 'fallback',
        version: '1.5',
        apiVersion: this.currentApiVersion,
        capabilities: ['generateContent'],
        inputTokenLimit: 'До 1M токенов',
        outputTokenLimit: 'До 8K токенов'
      }
    ];
  }

  /**
   * Главный метод для отправки запросов к AI
   */
  async queryAI(prompt, config = {}) {
    const {
      apiKey = process.env.GOOGLE_API_KEY,
      modelId = 'gemini-2.5-pro-preview-05-06',
      temperature = 0.7,
      maxTokens = 2048,
      timeout = 30000
    } = config;

    // Максимальные лимиты для всех моделей, особенно для thinking
    const isThinkingModel = modelId.includes('thinking');
    const actualTimeout = isThinkingModel ? Math.max(timeout, 180000) : Math.max(timeout, 60000); // 3 мин для thinking, 1 мин для остальных
    const actualMaxTokens = isThinkingModel ? 32768 : 8192; // ОГРОМНЫЙ лимит для thinking моделей - они много "думают"
    
    console.log(`⚙️ Конфигурация для модели ${modelId}:`, {
      isThinkingModel,
      timeout: `${actualTimeout}ms (${actualTimeout/1000}s)`,
      maxTokens: actualMaxTokens,
      temperature,
      baseMaxAttempts: this.maxAttempts
    });

    if (!apiKey) {
      throw new Error('Google API ключ не найден');
    }

    this.addDebugLog('PROMPT', prompt, { model: modelId, apiVersion: this.currentApiVersion, temperature, maxTokens, timeout });

    // Создаем кастомный fetch для перехвата запросов к API
    const createCustomFetch = () => {
      return (url, options) => {
        if (typeof url === 'string' && url.includes('generativelanguage.googleapis.com/v1/')) {
          const newUrl = url.replace('/v1/', `/${this.currentApiVersion}/`);
          console.log(`🌐 Перенаправляем: ${url} -> ${newUrl}`);
          this.addDebugLog('info', `🌐 Перенаправление API: ${url} -> ${newUrl}`);
          return fetch(newUrl, options);
        }
        return fetch(url, options);
      };
    };

    // Создаем GoogleGenerativeAI с правильной конфигурацией для версии API
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Устанавливаем кастомный fetch если версия API не v1
    if (this.currentApiVersion !== 'v1') {
      genAI.requestOptions = {
        fetch: createCustomFetch()
      };
    }
    
    const model = genAI.getGenerativeModel({
      model: modelId,
      generationConfig: {
        temperature,
        maxOutputTokens: actualMaxTokens
      }
    });

    // Больше попыток для thinking моделей
    const maxAttempts = isThinkingModel ? Math.max(this.maxAttempts, 7) : this.maxAttempts; // 7 попыток для thinking моделей
    
    console.log(`🔄 Максимум попыток для ${modelId}: ${maxAttempts} (thinking: ${isThinkingModel})`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const startTime = Date.now();
      
      try {
        this.addDebugLog('INFO', `🤖 Попытка ${attempt}/${maxAttempts} запроса к модели ${modelId}`, { attempt, model: modelId, apiVersion: this.currentApiVersion });
        
        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout after ${actualTimeout}ms`)), actualTimeout)
          )
        ]);

        const duration = Date.now() - startTime;
        
        this.addDebugLog('INFO', '🔍 Полный объект result от Google API', { attempt, duration, model: modelId, result: JSON.stringify(result, null, 2) });

        // Проверяем структуру ответа
        if (!result || !result.response) {
          const errorMsg = 'Отсутствует объект response в результате';
          console.log(`❌ ${errorMsg}`);
          this.addDebugLog('error', errorMsg, {
            attempt,
            duration,
            model: modelId,
            result: JSON.stringify(result, null, 2)
          });
          
          if (attempt === maxAttempts) {
            throw new Error(errorMsg);
          }
          continue;
        }

        // Логируем candidates если есть
        if (result.response.candidates) {
          console.log('🔍 Candidates:', JSON.stringify(result.response.candidates, null, 2));
          this.addDebugLog('info', '🔍 Candidates в ответе', {
            attempt,
            model: modelId,
            candidates: JSON.stringify(result.response.candidates, null, 2),
            candidatesCount: result.response.candidates.length
          });

          // Проверяем каждый candidate на наличие контента
          result.response.candidates.forEach((candidate, index) => {
            console.log(`🔍 Candidate ${index}:`, {
              finishReason: candidate.finishReason,
              safetyRatings: candidate.safetyRatings,
              hasContent: !!candidate.content,
              contentParts: candidate.content?.parts?.length || 0
            });
            
            // Специальная обработка для MAX_TOKENS
            if (candidate.finishReason === 'MAX_TOKENS') {
              console.log(`⚠️ Модель достигла лимита токенов! Thinking токены: ${result.response.usageMetadata?.thoughtsTokenCount || 'неизвестно'}`);
              this.addDebugLog('error', `⚠️ Модель достигла лимита токенов (MAX_TOKENS)`, {
                attempt,
                model: modelId,
                thoughtsTokenCount: result.response.usageMetadata?.thoughtsTokenCount,
                totalTokenCount: result.response.usageMetadata?.totalTokenCount,
                maxTokensLimit: actualMaxTokens
              });
            }
            
            if (candidate.content?.parts) {
              candidate.content.parts.forEach((part, partIndex) => {
                console.log(`  📝 Part ${partIndex}:`, {
                  hasText: !!part.text,
                  textLength: part.text?.length || 0,
                  textPreview: part.text?.substring(0, 100) || 'NO TEXT'
                });
              });
            }
          });
        }

        const responseText = result.response.text();
        
        if (responseText && responseText.trim()) {
          console.log('✅ Получен ответ от AI');
          this.addDebugLog('RESPONSE', responseText, { attempt, duration, model: modelId, responseLength: responseText.length });
          return responseText;
        }
        
        const errorMsg = `Пустой ответ от модели. Response: "${responseText}"`;
        console.log(`❌ ${errorMsg}`);
        this.addDebugLog('error', errorMsg, {
          attempt,
          duration,
          model: modelId,
          emptyResponse: responseText,
          responseType: typeof responseText,
          responseLength: responseText ? responseText.length : 0
        });
        
        if (attempt === maxAttempts) {
          throw new Error(errorMsg);
        }
        
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMsg = `Попытка ${attempt} неудачна: ${error.message}`;
        
        console.error(`❌ ${errorMsg}`);
        console.error('🔍 Полная ошибка:', error);
        
        // Проверяем, есть ли дополнительная информация в ошибке
        if (error.response) {
          console.error('🔍 Ответ в ошибке:', JSON.stringify(error.response, null, 2));
        }
        if (error.data) {
          console.error('🔍 Данные в ошибке:', JSON.stringify(error.data, null, 2));
        }
        
        this.addDebugLog('error', errorMsg, {
          attempt,
          duration,
          model: modelId,
          errorType: error.name,
          errorMessage: error.message,
          errorResponse: error.response ? JSON.stringify(error.response, null, 2) : null,
          errorData: error.data ? JSON.stringify(error.data, null, 2) : null,
          stack: error.stack
        });
        
        if (attempt === maxAttempts) {
          throw error;
        }
        
        // Пауза перед повторной попыткой (больше для thinking моделей)
        const basePause = isThinkingModel ? 3000 : 1000; // 3 сек для thinking, 1 сек для остальных
        const pauseTime = basePause * attempt;
        console.log(`⏳ Пауза ${pauseTime}ms перед следующей попыткой`);
        this.addDebugLog('info', `⏳ Пауза ${pauseTime}ms перед следующей попыткой`);
        await new Promise(resolve => setTimeout(resolve, pauseTime));
      }
    }
  }

  /**
   * Получает ход для игры от AI
   * @param {string} prompt - Промпт для AI
   * @param {Object} aiConfig - Конфигурация AI
   * @param {Function} parseResponse - Функция парсинга ответа
   * @returns {Promise<Object>} Спарсенный ход
   */
  async getGameMove(prompt, aiConfig, parseResponse) {
    try {
      const response = await this.queryAI(prompt, aiConfig);
      
      if (typeof parseResponse === 'function') {
        return parseResponse(response);
      }
      
      return { success: true, response };
      
    } catch (error) {
      console.error('❌ Ошибка получения хода от AI:', error);
      throw error;
    }
  }

  /**
   * Legacy метод для обратной совместимости с шахматным движком
   * @deprecated Используйте GameManager для новых игр
   */
  async getAiMove(gameState) {
    console.warn('⚠️ Используется устаревший метод getAiMove. Переходите на GameManager.');
    
    try {
      const { fen, strategy, apiKey, model, aiSide } = gameState;
      
      console.log(`[aiService] 📥 ПОЛУЧЕН FEN: ${fen}`);
      
      const chess = new Chess(fen);
      
      if (chess.isGameOver()) {
        const message = 'Попытка получить ход в завершенной игре.';
        this.addDebugLog('warn', message);
        console.warn(`🤔 ${message}`);
        throw new Error('Игра уже окончена, ходы невозможны.');
      }
      
      // Генерируем ходы в формате 'e2e4' (long algebraic notation), чтобы соответствовать формату вывода AI
      const legalMoveObjects = chess.moves({ verbose: true });
      const legalMoves = legalMoveObjects.map(move => move.from + move.to);
      
      const logPayload = {
        fen: fen?.substring(0, 50) + '...',
        aiSide,
        model: model || 'default',
        legalMovesCount: legalMoves.length
      };
      this.addDebugLog('info', '🎯 Запрос хода AI для шахмат', logPayload);
      console.log('🎯 Получение хода AI для шахмат:', logPayload);
      
      // Создаем детальный промпт для шахматного AI
      const prompt = `Ты - профессиональный шахматист. Проанализируй позицию и сделай ход.

ТЕКУЩАЯ ПОЗИЦИЯ (FEN):
${fen}

ВАЖНО: FEN читается слева направо, сверху вниз (8-я горизонталь к 1-й).
- Заглавные буквы = белые фигуры (K=король, Q=ферзь, R=ладья, B=слон, N=конь, P=пешка)
- Строчные буквы = черные фигуры (k=король, q=ферзь, r=ладья, b=слон, n=конь, p=пешка)
- Цифры = количество пустых клеток

🚨🚨🚨 КРИТИЧЕСКИЙ ЗАПРЕТ - НЕ СТАВЬ ФИГУРЫ ПОД АТАКУ! 🚨🚨🚨

ЗАПРЕЩЕННЫЕ ХОДЫ (НИКОГДА НЕ ДЕЛАЙ!):
❌ НЕ ставь коня на d5 если пешка e4 может его съесть!
❌ НЕ ставь коня на f6 если пешка e5 может его съесть!
❌ НЕ ставь фигуры на поля, атакованные пешками противника!

ПРАВИЛА АТАК ПЕШКАМИ:
- Белая пешка на e4 атакует d5 и f5
- Белая пешка на e5 атакует d6 и f6  
- Черная пешка на d5 атакует c4 и e4
- Черная пешка на d4 атакует c3 и e3

ОБЯЗАТЕЛЬНАЯ ПРОВЕРКА:
1. На какое поле я ставлю фигуру?
2. Есть ли пешка противника, которая может атаковать это поле?
3. Если ДА - НЕ ДЕЛАЙ ЭТОТ ХОД!

ТЫ ИГРАЕШЬ ЗА: ${aiSide === 'white' ? 'белых (заглавные буквы)' : 'черных (строчные буквы)'}

ДОСТУПНЫЕ ХОДЫ:
${legalMoves.join(', ')}

ПРИМЕР АНАЛИЗА АТАК:
- Если белая пешка на e5 атакует черного коня на f6, то конь ДЕЙСТВИТЕЛЬНО под угрозой
- Ход d7-d5 НЕ защищает коня f6! Пешка e5 всё ещё может взять коня: exf6
- Ход e7-e6 НЕ защищает коня f6 от атаки пешки e5
- Чтобы спасти коня f6 от пешки e5: убрать коня (f6-g8, f6-h5, f6-e4) или атаковать пешку e5

ТВОЯ СТРАТЕГИЯ:
${strategy || 'Играй лучший ход, учитывая тактику и стратегию'}

ОБЯЗАТЕЛЬНЫЙ АЛГОРИТМ:
1. Прочитай FEN и найди ВСЕ пешки противника
2. Для каждой пешки противника определи, какие поля она атакует
3. НИКОГДА не ставь свои фигуры на атакованные поля!
4. Выбери ход из списка доступных ходов
5. Проверь еще раз: НЕ попадает ли моя фигура под атаку?
6. Если попадает - выбери другой ход!

КРИТИЧНЫЕ ОШИБКИ (НЕ ПОВТОРЯЙ!):
❌ Ход g8f6 когда пешка e5 атакует f6 = ЗАПРЕЩЕН!
❌ Ход коня на d5 когда пешка e4 атакует d5 = ЗАПРЕЩЕН!
❌ Любой ход фигуры под атаку пешки = ЗАПРЕЩЕН!

ФОРМАТ ОТВЕТА:
ПРОВЕРКА_АТАК: [какие пешки противника я нашел и какие поля они атакуют]
ХОД: [ваш_ход]
ОБЪЯСНЕНИЕ: [какую фигуру двигаешь, почему поле безопасно]
НОВАЯ_СТРАТЕГИЯ: [обновленная стратегия на следующие ходы]`;
      
      this.addDebugLog('prompt', '📝 Сгенерирован промпт для AI', { prompt: prompt.substring(0, 500) + '...' });

      const response = await this.queryAI(prompt, {
        apiKey,
        modelId: model || 'gemini-2.5-pro-preview-05-06',
        temperature: 0.7,
        maxTokens: 32768, // Огромный лимит для thinking моделей
        timeout: 120000   // 2 минуты для шахматных запросов
      });

      this.addDebugLog('response', '🤖 Получен сырой ответ от AI', { response });
      console.log('🤖 Ответ AI:', response);
      
      // Парсим ответ - пробуем разные форматы
      let moveMatch = response.match(/ХОД:\s*([a-h][1-8][a-h][1-8][qrbn]?)/i);
      
      // Если не нашли стандартный формат, пробуем с **
      if (!moveMatch) {
        moveMatch = response.match(/\*\*ХОД:\*\*\s*([a-h][1-8][a-h][1-8][qrbn]?)/i);
      }
      
      // Если всё ещё не нашли, пробуем найти любой валидный ход в тексте
      if (!moveMatch) {
        const allMoveMatches = response.match(/\b([a-h][1-8][a-h][1-8][qrbn]?)\b/gi);
        if (allMoveMatches) {
          // Проверяем каждый найденный ход на легальность
          for (const potentialMove of allMoveMatches) {
            if (legalMoves.includes(potentialMove.toLowerCase())) {
              moveMatch = [null, potentialMove];
              console.log(`🔍 Найден валидный ход в тексте: ${potentialMove}`);
              break;
            }
          }
        }
      }
      
      if (!moveMatch) {
        const errorMsg = 'AI не предоставил ход в нужном формате: ' + response;
        this.addDebugLog('error', errorMsg);
        throw new Error(errorMsg);
      }

      const move = moveMatch[1].toLowerCase();
      
      // Валидация хода
      if (!legalMoves.includes(move)) {
        const errorMsg = `AI предложил нелегальный ход: ${move}.`;
        this.addDebugLog('error', errorMsg, { legalMoves });
        console.error(`❌ ${errorMsg} Доступные ходы: ${legalMoves.join(', ')}`);
        throw new Error(errorMsg);
      }
      
      // Извлекаем проверку атак, объяснение и новую стратегию
      const attackCheckMatch = response.match(/ПРОВЕРКА_АТАК:\s*([^]*?)(?=ХОД:|$)/i);
      
      let explanationMatch = response.match(/ОБЪЯСНЕНИЕ:\s*([^]*?)(?=НОВАЯ_СТРАТЕГИЯ:|$)/i);
      if (!explanationMatch) {
        explanationMatch = response.match(/\*\*ОБЪЯСНЕНИЕ:\*\*\s*([^]*?)(?=\*\*НОВАЯ_СТРАТЕГИЯ:\*\*|$)/i);
      }
      
      let strategyMatch = response.match(/НОВАЯ_СТРАТЕГИЯ:\s*([^]*?)$/i);
      if (!strategyMatch) {
        strategyMatch = response.match(/\*\*НОВАЯ_СТРАТЕГИЯ:\*\*\s*([^]*?)$/i);
      }

      // Если не нашли объяснение в формате, попробуем извлечь из контекста
      let reasoning = 'AI сделал ход';
      if (explanationMatch) {
        reasoning = explanationMatch[1].trim();
      } else {
        // Пробуем найти объяснение после хода
        const afterMoveText = response.split(move)[1];
        if (afterMoveText) {
          // Берём первые 200 символов после хода как объяснение
          const explanation = afterMoveText.trim().substring(0, 200);
          if (explanation.length > 10) {
            reasoning = explanation;
          }
        }
      }

      const result = {
        move: move,
        newStrategy: strategyMatch ? strategyMatch[1].trim() : strategy,
        reasoning: reasoning,
        attackCheck: attackCheckMatch ? attackCheckMatch[1].trim() : 'Проверка атак не найдена',
        model: model || 'gemini-2.5-pro-preview-05-06',
        attempts: 1
      };

      this.addDebugLog('success', '✅ Ход успешно обработан', result);
      console.log('✅ Успешно спарсен ход AI:', result.move);
      return result;
      
    } catch (error) {
      this.addDebugLog('error', '❌ Ошибка в getAiMove', { error: error.message, stack: error.stack });
      console.error('❌ Ошибка legacy метода getAiMove:', error);
      throw error;
    }
  }

  /**
   * Получает человекочитаемое название модели
   */
  getModelDisplayName(modelId, apiModel = null) {
    // Если есть данные из API, используем displayName
    if (apiModel && apiModel.displayName) {
      return apiModel.displayName;
    }
    
    // Убираем префикс models/ если есть
    const cleanId = modelId.replace(/^models\//, '');
    
    // Специальная обработка для известных моделей
    if (cleanId.startsWith('gemini-')) {
      // Обрабатываем версии Gemini отдельно
      const parts = cleanId.split('-');
      let result = ['Gemini'];
      
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const nextPart = parts[i + 1];
        
        // Обработка версий типа "2.5"
        if (part.match(/^\d+$/) && nextPart && nextPart.match(/^\d+$/) && i === 1) {
          result.push(`${part}.${nextPart}`);
          i++; // Пропускаем следующую часть
        }
        // Обработка дат типа "04-17"
        else if (part.match(/^\d{2}$/) && nextPart && nextPart.match(/^\d{2}$/) && i > 2) {
          result.push(`${part}-${nextPart}`);
          i++; // Пропускаем следующую часть
        }
        // Специальные сокращения
        else if (part === 'exp') {
          result.push('Experimental');
        }
        else if (part === 'pro') {
          result.push('Pro');
        }
        else if (part === 'flash') {
          result.push('Flash');
        }
        else if (part === 'lite') {
          result.push('Lite');
        }
        else if (part === 'preview') {
          result.push('Preview');
        }
        else if (part === 'thinking') {
          result.push('Thinking');
        }
        else if (part === 'tts') {
          result.push('TTS');
        }
        // Числа и даты
        else if (part.match(/^\d{4}$/)) {
          result.push(part); // Годы оставляем как есть
        }
        else if (part.match(/^\d{3}$/)) {
          result.push(part); // Трёхзначные числа
        }
        // Обычные слова
        else {
          result.push(part.charAt(0).toUpperCase() + part.slice(1));
        }
      }
      
      return result.join(' ');
    }
    
    // Для не-Gemini моделей используем старую логику
    return cleanId
      .split('-')
      .map(part => {
        if (part === 'exp') return 'Experimental';
        if (part === 'pro') return 'Pro';
        if (part === 'flash') return 'Flash';
        if (part === 'lite') return 'Lite';
        if (part === 'preview') return 'Preview';
        if (part === 'thinking') return 'Thinking';
        if (part === 'tts') return 'TTS';
        if (part.match(/^\d+$/)) return part;
        if (part.match(/^\d+\.\d+$/)) return `v${part}`;
        if (part.match(/^\d{4}$/)) return part;
        if (part.match(/^\d{2}$/)) return part;
        
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(' ');
  }

  /**
   * Получает описание модели
   */
  getModelDescription(modelId, apiModel = null) {
    // Если есть данные из API, используем description
    if (apiModel && apiModel.description) {
      return apiModel.description;
    }
    
    // Генерируем описание на основе ID модели
    const cleanId = modelId.replace(/^models\//, '').toLowerCase();
    
    // Определяем тип модели
    let description = '';
    
    if (cleanId.includes('2.5')) {
      if (cleanId.includes('pro')) {
        description = 'Новейшая мощная модель с улучшенными возможностями';
      } else if (cleanId.includes('flash')) {
        description = 'Быстрая и эффективная модель для простых задач';
      } else {
        description = 'Модель Gemini 2.5 поколения';
      }
    } else if (cleanId.includes('2.0')) {
      if (cleanId.includes('flash')) {
        description = 'Новая быстрая модель с улучшенной производительностью';
      } else {
        description = 'Модель Gemini 2.0 поколения';
      }
    } else if (cleanId.includes('1.5')) {
      if (cleanId.includes('pro')) {
        description = 'Стабильная профессиональная модель';
      } else if (cleanId.includes('flash')) {
        description = 'Быстрая и надежная модель';
      } else {
        description = 'Стабильная legacy модель';
      }
    } else if (cleanId.includes('1.0')) {
      description = 'Классическая модель первого поколения';
    } else if (cleanId.includes('exp')) {
      description = 'Экспериментальная модель с новыми возможностями';
    } else if (cleanId.includes('thinking')) {
      description = 'Модель с расширенными возможностями рассуждения';
    } else {
      description = 'Модель Google Gemini';
    }
    
    // Добавляем информацию о preview версиях
    if (cleanId.includes('preview')) {
      description += ' (предварительная версия)';
    }
    
    return description;
  }

  /**
   * Извлекает версию модели для сортировки
   */
  getModelVersion(modelId) {
    if (modelId.includes('2.5')) return '2.5';
    if (modelId.includes('1.5')) return '1.5';
    if (modelId.includes('1.0')) return '1.0';
    return '0.0';
  }

  /**
   * Возвращает понятное сообщение об ошибке
   */
  getErrorMessage(errorType, originalError) {
    switch (errorType) {
      case 'not_found':
        return 'Модель не найдена или не поддерживается';
      case 'quota_exceeded':
        return 'Превышен лимит запросов';
      case 'api_key_invalid':
        return 'Проблема с API ключом';
      case 'timeout':
        return 'Таймаут (модель может быть медленной)';
      default:
        return 'Неизвестная ошибка';
    }
  }
}

module.exports = new AIService();
