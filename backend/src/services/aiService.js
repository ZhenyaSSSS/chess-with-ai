const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Chess } = require('chess.js');

// Добавляем поддержку fetch для старых версий Node.js
if (!globalThis.fetch) {
  globalThis.fetch = require('node-fetch');
}

class AIService {
  constructor() {
    this.maxAttempts = 3;
    this.defaultStrategy = 'I will play strategically to win this chess game.';
    // Актуальные модели Gemini 2.5 (бета API)
    this.availableModels = {
      'gemini-2.5-pro-preview-06-05': {
        name: 'Gemini 2.5 Pro Preview',
        description: 'Новейшая и самая мощная модель Gemini',
        maxTokens: 2048,
        temperature: 0.7
      },
      'gemini-2.5-pro-preview-05-06': {
        name: 'Gemini 2.5 Pro Preview 05-06',
        description: 'Альтернативная версия 2.5 Pro',
        maxTokens: 2048,
        temperature: 0.7
      },
      'gemini-2.5-flash-preview-05-20': {
        name: 'Gemini 2.5 Flash Preview 05-20',
        description: 'Быстрая модель Gemini 2.5',
        maxTokens: 1024,
        temperature: 0.7
      },
      'gemini-2.5-flash-preview-04-17': {
        name: 'Gemini 2.5 Flash Preview 04-17',
        description: 'Старая версия Flash 2.5',
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
   * Получает список доступных моделей из Google API
   * @param {string} apiKey - API ключ для проверки доступности
   * @returns {Promise<Array>} Список доступных моделей
   */
  async getAvailableModels(apiKey) {
    try {
      console.log('🔍 Получаем список всех моделей из Google API...');
      
      // Делаем запрос к Google API для получения списка моделей
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
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
      console.log(`📡 Получено ${data.models?.length || 0} моделей от Google API`);

      if (!data.models || !Array.isArray(data.models)) {
        throw new Error('Некорректный ответ от API Google');
      }

      // Фильтруем только generative модели (те что могут генерировать текст)
      const generativeModels = data.models.filter(model => 
        model.supportedGenerationMethods?.includes('generateContent') &&
        model.name.includes('gemini')
      );

      console.log(`🤖 Найдено ${generativeModels.length} генеративных Gemini моделей`);

      // Тестируем каждую модель на работоспособность
      const testedModels = [];
      
      for (const model of generativeModels) {
        const modelId = model.name.replace('models/', '');
        
        console.log(`🧪 Тестируем модель: ${modelId}...`);
        
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const testModel = genAI.getGenerativeModel({ 
            model: modelId,
            generationConfig: {
              maxOutputTokens: 5,
              temperature: 0.1
            }
          });
          
          // Быстрый тест с таймаутом
          const testResult = await Promise.race([
            testModel.generateContent('Test'),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 3000)
            )
          ]);
          
          if (testResult?.response?.text()) {
            console.log(`✅ Модель ${modelId} работает`);
            
            testedModels.push({
              id: modelId,
              name: this.getModelDisplayName(modelId),
              description: this.getModelDescription(modelId, model),
              available: true,
              status: 'working',
              version: this.getModelVersion(modelId),
              capabilities: model.supportedGenerationMethods || [],
              inputTokenLimit: model.inputTokenLimit || 'Неизвестно',
              outputTokenLimit: model.outputTokenLimit || 'Неизвестно'
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
          
          testedModels.push({
            id: modelId,
            name: this.getModelDisplayName(modelId),
            description: this.getModelDescription(modelId, model),
            available: false,
            status: errorType,
            error: this.getErrorMessage(errorType, error.message),
            version: this.getModelVersion(modelId),
            capabilities: model.supportedGenerationMethods || [],
            inputTokenLimit: model.inputTokenLimit || 'Неизвестно',
            outputTokenLimit: model.outputTokenLimit || 'Неизвестно'
          });
        }
      }
      
      // Сортируем: сначала рабочие, потом по версии (новые сверху)
      testedModels.sort((a, b) => {
        if (a.available !== b.available) {
          return b.available - a.available; // Рабочие сверху
        }
        return b.version.localeCompare(a.version); // Новые версии сверху
      });
      
      console.log(`✨ Обработка завершена. Доступно: ${testedModels.filter(m => m.available).length}/${testedModels.length} моделей`);
      return testedModels;
      
    } catch (error) {
      console.error('❌ Ошибка получения списка моделей:', error);
      
      // Fallback на захардкоженный список в случае критической ошибки
      console.log('🔄 Используем резервный список моделей...');
      
      return [
        {
          id: 'gemini-2.5-pro-preview-05-06',
          name: 'Gemini 2.5 Pro Preview 05-06',
          description: 'Рекомендуемая стабильная версия 2.5 Pro',
          available: true,
          status: 'fallback',
          version: '2.5',
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
          capabilities: ['generateContent'],
          inputTokenLimit: 'До 2M токенов',
          outputTokenLimit: 'До 8K токенов'
        }
      ];
    }
  }

  /**
   * Получает человекочитаемое название модели
   */
  getModelDisplayName(modelId) {
    if (modelId.includes('gemini-2.5-pro')) {
      return `Gemini 2.5 Pro ${modelId.includes('preview') ? 'Preview' : ''}`;
    }
    if (modelId.includes('gemini-2.5-flash')) {
      return `Gemini 2.5 Flash ${modelId.includes('preview') ? 'Preview' : ''}`;
    }
    if (modelId.includes('gemini-1.5-pro')) {
      return 'Gemini 1.5 Pro';
    }
    if (modelId.includes('gemini-1.5-flash')) {
      return 'Gemini 1.5 Flash';
    }
    return modelId.replace('gemini-', 'Gemini ').replace('-', ' ');
  }

  /**
   * Получает описание модели
   */
  getModelDescription(modelId, apiModel) {
    if (modelId.includes('2.5')) {
      if (modelId.includes('pro')) {
        return 'Новейшая мощная модель с улучшенными возможностями';
      }
      if (modelId.includes('flash')) {
        return 'Быстрая и эффективная модель для простых задач';
      }
    }
    if (modelId.includes('1.5')) {
      return 'Стабильная legacy модель';
    }
    return apiModel.description || 'Модель Google Gemini';
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

  /**
   * Создает промпт для Gemini AI
   * @param {Object} gameState - Состояние игры
   * @param {string} previousError - Ошибка предыдущей попытки (если есть)
   * @returns {string} Промпт для AI
   */
  createPrompt(gameState, previousError = null) {
    const { fen, history, strategy } = gameState;
    
    const chess = new Chess(fen);
    const possibleMoves = chess.moves({ verbose: true }).map(m => m.san);
    const turn = chess.turn() === 'w' ? 'White' : 'Black';
    const isCheck = chess.inCheck();
    const isGameOver = chess.isGameOver();
    
    let prompt = `Ты - гроссмейстер по шахматам мирового уровня, играющий партию.

**ТВОЯ ЦЕЛЬ:** Выиграть партию, играя наилучшие ходы.

**ТЕКУЩАЯ ПОЗИЦИЯ:**
- FEN: ${fen}
- Ход делают: ${turn} (это ты)
- ${isCheck ? '⚠️ ШАХ! Король под атакой!' : ''}
- ${isGameOver ? '🔚 Игра окончена!' : ''}
- История партии (PGN): ${history || 'Партия только началась'}

**ТВОЯ ДОЛГОСРОЧНАЯ СТРАТЕГИЯ:**
"${strategy}"

**ДОСТУПНЫЕ ХОДЫ:**
${possibleMoves.join(', ')}

**ИНСТРУКЦИЯ:**
Проанализируй позицию пошагово:
1. Оцени материальный баланс
2. Проверь тактические угрозы (шах, мат, связки, вилки)
3. Оцени позиционные факторы (центр, безопасность короля, структура пешек)
4. ОБЯЗАТЕЛЬНО выбери ход ТОЛЬКО из списка доступных ходов выше

**ВАЖНЫЕ ПРАВИЛА:**
- Ход ДОЛЖЕН быть ТОЧНО таким, как написан в списке доступных ходов
- Используй точную SAN нотацию из списка
- Если сомневаешься в ходе, выбери самый безопасный из доступных

Твой ответ ОБЯЗАТЕЛЬНО должен быть JSON объектом с двумя ключами:
{
  "move": "Ход из списка доступных ходов (ТОЧНО как написано в списке)",
  "strategy": "Обновленная стратегическая мысль для следующих ходов (кратко, до 100 символов)"
}

🚨 КРИТИЧЕСКИ ВАЖНО: ход ДОЛЖЕН быть ТОЧНО из списка доступных ходов выше! 🚨`;

    if (previousError) {
      prompt += `\n\n🚨 **ИСПРАВЛЕНИЕ ОШИБКИ:**
Твой предыдущий ход был неверным. Ошибка: "${previousError}"
Пожалуйста, проанализируй доску заново и выбери ДРУГОЙ, КОРРЕКТНЫЙ ход из списка доступных ходов.`;
    }

    return prompt;
  }

  /**
   * Извлекает JSON из ответа AI
   * @param {string} responseText - Ответ от AI
   * @returns {Object} Parsed JSON объект
   */
  parseAIResponse(responseText) {
    try {
      // Ищем JSON в ответе (может быть окружен другим текстом)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON не найден в ответе AI');
      }

      const jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      if (!parsed.move || typeof parsed.move !== 'string') {
        throw new Error('Поле "move" отсутствует или не является строкой');
      }

      if (!parsed.strategy || typeof parsed.strategy !== 'string') {
        throw new Error('Поле "strategy" отсутствует или не является строкой');
      }

      return {
        move: parsed.move.trim(),
        strategy: parsed.strategy.trim()
      };

    } catch (error) {
      throw new Error(`Ошибка парсинга ответа AI: ${error.message}`);
    }
  }

  /**
   * Валидирует ход AI в контексте текущей позиции
   * @param {string} move - Ход в SAN нотации
   * @param {string} fen - Текущая позиция
   * @returns {boolean} true если ход валидный
   */
  validateMove(move, fen) {
    try {
      const chess = new Chess(fen);
      const result = chess.move(move);
      return result !== null;
    } catch (error) {
      console.error('Ошибка валидации хода:', error);
      return false;
    }
  }

  /**
   * Получает ход от AI с повторными попытками при ошибках
   * @param {Object} gameState - Состояние игры
   * @returns {Promise<Object>} Результат с ходом и стратегией
   */
  async getAiMove(gameState) {
    const { fen, history, strategy, apiKey, model = 'gemini-2.5-pro-preview-05-06' } = gameState;

    if (!apiKey) {
      throw new Error('API_KEY_INVALID: API ключ не предоставлен');
    }

    let genAI;
    try {
      genAI = new GoogleGenerativeAI(apiKey);
    } catch (error) {
      throw new Error('API_KEY_INVALID: Неверный формат API ключа');
    }

    // Используем выбранную модель или gemini-2.5-pro-preview-05-06 по умолчанию (лучше по отзывам)
    const modelConfig = this.availableModels[model] || this.availableModels['gemini-2.5-pro-preview-05-06'];
    
    const aiModel = genAI.getGenerativeModel({ 
      model: model,
      generationConfig: {
        temperature: modelConfig.temperature,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: modelConfig.maxTokens,
      }
    });

    let lastError = null;
    
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        console.log(`Попытка ${attempt}/${this.maxAttempts} получить ход от AI (модель: ${model})`);

        const prompt = this.createPrompt(
          { fen, history, strategy: strategy || this.defaultStrategy },
          lastError
        );

        console.log('Отправляем промпт AI...');
        const result = await aiModel.generateContent(prompt);
        const responseText = result.response.text();
        
        console.log('Получен ответ от AI:', responseText.substring(0, 200) + '...');

        // Парсим ответ
        const aiResponse = this.parseAIResponse(responseText);
        
        // Валидируем ход
        if (!this.validateMove(aiResponse.move, fen)) {
          lastError = `Ход "${aiResponse.move}" невалидный для текущей позиции`;
          console.warn(`Попытка ${attempt}: ${lastError}`);
          
          if (attempt < this.maxAttempts) {
            continue; // Пробуем еще раз
          } else {
            throw new Error('AI_FAILED_TO_MOVE: Все попытки исчерпаны');
          }
        }

        // Ход валидный!
        console.log(`✅ AI успешно выбрал ход: ${aiResponse.move}`);
        
        return {
          move: aiResponse.move,
          newStrategy: aiResponse.strategy,
          attempts: attempt,
          model: model
        };

      } catch (error) {
        console.error(`Попытка ${attempt} завершилась ошибкой:`, error.message);

        // Специфические ошибки API
        if (error.message.includes('API_KEY_INVALID') || 
            error.message.includes('API key')) {
          throw new Error('API_KEY_INVALID: Проверьте корректность API ключа');
        }

        if (error.message.includes('quota') || 
            error.message.includes('QUOTA_EXCEEDED')) {
          throw new Error('QUOTA_EXCEEDED: Превышен лимит запросов к API');
        }

        // Проблема с моделью - пробуем fallback
        if (error.message.includes('not found') || error.message.includes('404')) {
          if (model !== 'gemini-1.5-pro' && attempt === 1) {
            console.log(`Модель ${model} недоступна, пробуем gemini-1.5-pro...`);
            gameState.model = 'gemini-1.5-pro';
            return this.getAiMove(gameState);
          }
        }

        lastError = error.message;

        if (attempt >= this.maxAttempts) {
          throw new Error(`AI_FAILED_TO_MOVE: ${lastError}`);
        }

        // Небольшая пауза перед следующей попыткой
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

module.exports = new AIService(); 