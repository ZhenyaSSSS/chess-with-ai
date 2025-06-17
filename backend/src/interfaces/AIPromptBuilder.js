/**
 * Базовый класс для построения промптов AI для различных игр
 * Каждая игра должна иметь свой класс-наследник
 */
class AIPromptBuilder {
  constructor(gameType) {
    if (this.constructor === AIPromptBuilder) {
      throw new Error('AIPromptBuilder является абстрактным классом');
    }
    this.gameType = gameType;
  }

  /**
   * Создает основной промпт для анализа позиции
   * @param {Object} gameState - Текущее состояние игры
   * @param {string} strategy - Стратегия AI
   * @param {string} aiSide - Сторона AI ('white', 'black', 'x', 'o', etc.)
   * @returns {string} Промпт для AI
   */
  buildAnalysisPrompt(gameState, strategy, aiSide) {
    throw new Error('buildAnalysisPrompt() должен быть реализован в дочернем классе');
  }

  /**
   * Создает промпт для выбора хода
   * @param {Object} gameState - Текущее состояние игры
   * @param {Array} availableMoves - Доступные ходы
   * @param {string} strategy - Стратегия AI
   * @param {string} aiSide - Сторона AI
   * @returns {string} Промпт для выбора хода
   */
  buildMoveSelectionPrompt(gameState, availableMoves, strategy, aiSide) {
    throw new Error('buildMoveSelectionPrompt() должен быть реализован в дочернем классе');
  }

  /**
   * Создает промпт для анализа ошибки
   * @param {Object} gameState - Текущее состояние игры
   * @param {string} invalidMove - Невалидный ход
   * @param {string} error - Описание ошибки
   * @param {Array} availableMoves - Доступные ходы
   * @returns {string} Промпт для исправления ошибки
   */
  buildErrorRecoveryPrompt(gameState, invalidMove, error, availableMoves) {
    throw new Error('buildErrorRecoveryPrompt() должен быть реализован в дочернем классе');
  }

  /**
   * Создает промпт для обновления стратегии
   * @param {Object} gameState - Текущее состояние игры
   * @param {string} currentStrategy - Текущая стратегия
   * @param {Object} gameHistory - История игры
   * @returns {string} Промпт для обновления стратегии
   */
  buildStrategyUpdatePrompt(gameState, currentStrategy, gameHistory) {
    return `Проанализируй текущую ситуацию в игре и обнови стратегию:

Текущая стратегия: ${currentStrategy}

Состояние игры: ${this.formatGameState(gameState)}

${gameHistory ? `История ходов: ${this.formatGameHistory(gameHistory)}` : ''}

Предоставь обновленную стратегию, учитывающую текущие обстоятельства.`;
  }

  /**
   * Форматирует состояние игры для промпта
   * @param {Object} gameState - Состояние игры
   * @returns {string} Форматированное описание
   */
  formatGameState(gameState) {
    throw new Error('formatGameState() должен быть реализован в дочернем классе');
  }

  /**
   * Форматирует историю игры для промпта
   * @param {Object} gameHistory - История игры
   * @returns {string} Форматированная история
   */
  formatGameHistory(gameHistory) {
    if (!gameHistory || !gameHistory.moves || gameHistory.moves.length === 0) {
      return 'История ходов пуста';
    }
    
    return gameHistory.moves
      .map((move, index) => `${index + 1}. ${move.san || move.move}`)
      .join(' ');
  }

  /**
   * Создает инструкции по формату ответа
   * @returns {string} Инструкции для AI
   */
  getResponseFormatInstructions() {
    return `
ВАЖНО: Твой ответ должен содержать ТОЛЬКО JSON в следующем формате:
{
  "move": "твой_ход",
  "reasoning": "объяснение выбора хода",
  "newStrategy": "обновленная стратегия (если нужно)"
}

Никакого дополнительного текста до или после JSON!`;
  }

  /**
   * Добавляет общие правила игры к промпту
   * @returns {string} Общие инструкции
   */
  getGeneralInstructions() {
    return `Ты - экспертный игрок в ${this.gameType}. 
Анализируй позицию глубоко и выбирай лучшие ходы.
Учитывай как тактические, так и стратегические аспекты игры.`;
  }

  /**
   * Создает полный промпт, объединяя все части
   * @param {Object} options - Опции для создания промпта
   * @returns {string} Полный промпт
   */
  buildFullPrompt(options) {
    const {
      gameState,
      strategy,
      aiSide,
      availableMoves,
      error = null,
      invalidMove = null
    } = options;

    let prompt = this.getGeneralInstructions() + '\n\n';

    if (error && invalidMove) {
      prompt += this.buildErrorRecoveryPrompt(gameState, invalidMove, error, availableMoves);
    } else {
      prompt += this.buildAnalysisPrompt(gameState, strategy, aiSide) + '\n\n';
      prompt += this.buildMoveSelectionPrompt(gameState, availableMoves, strategy, aiSide);
    }

    prompt += '\n\n' + this.getResponseFormatInstructions();

    return prompt;
  }

  /**
   * Парсит ответ AI и извлекает структурированные данные
   * @param {string} response - Ответ от AI
   * @returns {Object} Распарсенный ответ
   */
  parseAIResponse(response) {
    try {
      // Удаляем все лишнее и ищем JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON не найден в ответе');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.move) {
        throw new Error('Поле "move" отсутствует в ответе');
      }

      return {
        move: parsed.move,
        reasoning: parsed.reasoning || 'Причина не указана',
        newStrategy: parsed.newStrategy || null
      };

    } catch (error) {
      console.error('Ошибка парсинга ответа AI:', error);
      throw new Error(`Не удалось распарсить ответ AI: ${error.message}`);
    }
  }
}

module.exports = AIPromptBuilder; 