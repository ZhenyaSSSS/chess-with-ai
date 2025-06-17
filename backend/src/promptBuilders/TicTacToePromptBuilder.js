const AIPromptBuilder = require('../interfaces/AIPromptBuilder');

/**
 * Построитель промптов для крестиков-ноликов
 * Создает стратегические промпты для AI анализа простой игры 3x3
 */
class TicTacToePromptBuilder extends AIPromptBuilder {
  constructor() {
    super('tictactoe');
  }

  /**
   * Создает основной промпт для анализа позиции крестиков-ноликов
   * @param {Object} gameState - Состояние игры { board: Array, currentPlayer: string }
   * @param {string} strategy - Стратегия AI
   * @param {string} aiSide - Сторона AI ('x' или 'o')
   * @returns {string} Промпт для анализа
   */
  buildAnalysisPrompt(gameState, strategy, aiSide) {
    const opponentSide = aiSide === 'x' ? 'o' : 'x';
    const boardVisual = this.formatBoardVisual(gameState.board);
    const positionAnalysis = this.analyzePosition(gameState, aiSide);

    return `Ты - эксперт по крестикам-ноликам. Ты играешь за ${aiSide.toUpperCase()}.

**АНАЛИЗ ТЕКУЩЕЙ ПОЗИЦИИ:**

🎯 **ТВОЙ СИМВОЛ:** ${aiSide.toUpperCase()}
🎭 **ПРОТИВНИК:** ${opponentSide.toUpperCase()}
🎮 **СЕЙЧАС ХОДЯТ:** ${gameState.currentPlayer.toUpperCase()}

📋 **ДОСКА:**
${boardVisual}

📊 **СТРАТЕГИЧЕСКИЙ АНАЛИЗ:**
${positionAnalysis}

🧠 **ТВОЯ СТРАТЕГИЯ:**
"${strategy}"

🎯 **ПРИОРИТЕТЫ В КРЕСТИКАХ-НОЛИКАХ:**
1. ВЫИГРАТЬ - если можешь выиграть за 1 ход, делай это!
2. ЗАБЛОКИРОВАТЬ - если противник может выиграть за 1 ход, блокируй!
3. КОНТРОЛИРОВАТЬ ЦЕНТР - клетка (1,1) самая важная
4. ЗАНИМАТЬ УГЛЫ - углы (0,0), (0,2), (2,0), (2,2) дают больше возможностей
5. ИЗБЕГАТЬ КРАЕВ - края менее выгодны`;
  }

  /**
   * Создает промпт для выбора хода
   * @param {Object} gameState - Состояние игры
   * @param {Array} availableMoves - Доступные ходы
   * @param {string} strategy - Стратегия AI
   * @param {string} aiSide - Сторона AI
   * @returns {string} Промпт для выбора хода
   */
  buildMoveSelectionPrompt(gameState, availableMoves, strategy, aiSide) {
    if (availableMoves.length === 0) {
      throw new Error('Нет доступных ходов для анализа');
    }

    const movesFormatted = this.formatMoves(availableMoves);
    const tacticalAnalysis = this.generateTacticalAnalysis(gameState, aiSide, availableMoves);

    return `🎯 **ДОСТУПНЫЕ ХОДЫ:**
${movesFormatted}

🔍 **ТАКТИЧЕСКИЙ АНАЛИЗ:**
${tacticalAnalysis}

**ПОШАГОВЫЙ АЛГОРИТМ ВЫБОРА:**

1️⃣ **ПРОВЕРЬ ВЫИГРЫШ:** Можешь ли ты выиграть за 1 ход?
2️⃣ **ПРОВЕРЬ ЗАЩИТУ:** Может ли противник выиграть за 1 ход? БЛОКИРУЙ!
3️⃣ **СТРАТЕГИЧЕСКОЕ ПОЗИЦИОНИРОВАНИЕ:**
   - Если центр (1,1) свободен и ты еще не контролируешь его → займи центр
   - Если противник в центре → займи угол для создания двойной угрозы
   - Если у тебя центр → займи угол для форков
   - Если нет центра и углов → займи любой угол
   - В крайнем случае → займи край

**СПЕЦИАЛЬНЫЕ ТАКТИКИ:**
🎪 **ФОРК (двойная угроза):** Создай ситуацию, где у тебя две линии почти готовы к победе
🛡️ **БЛОКИРОВКА:** Останови противника от создания форков
🎯 **КОНТРОЛЬ ЦЕНТРА:** Центр участвует в 4 победных линиях (больше всего)

**ВАЖНО:** Ходы записываются как строка "row,col" (например: "1,1" для центра).`;
  }

  /**
   * Создает промпт для исправления ошибки
   * @param {Object} gameState - Состояние игры
   * @param {string} invalidMove - Невалидный ход
   * @param {string} error - Описание ошибки
   * @param {Array} availableMoves - Доступные ходы
   * @returns {string} Промпт для исправления
   */
  buildErrorRecoveryPrompt(gameState, invalidMove, error, availableMoves) {
    const boardVisual = this.formatBoardVisual(gameState.board);
    const movesFormatted = this.formatMoves(availableMoves);

    return `🚨 **ИСПРАВЛЕНИЕ ОШИБКИ:**

Твой предыдущий ход "${invalidMove}" был неверным.
Ошибка: "${error}"

**ТЕКУЩАЯ ДОСКА:**
${boardVisual}

**ДОСТУПНЫЕ КОРРЕКТНЫЕ ХОДЫ:**
${movesFormatted}

Пожалуйста, выбери КОРРЕКТНЫЙ ход из списка выше.
Формат: "row,col" (например: "0,0" для левого верхнего угла).`;
  }

  /**
   * Форматирует состояние игры для промпта
   * @param {Object} gameState - Состояние игры
   * @returns {string} Форматированное описание
   */
  formatGameState(gameState) {
    const boardVisual = this.formatBoardVisual(gameState.board);
    const moveCount = gameState.moveCount || 0;
    
    return `Ход #${moveCount + 1}
Сейчас ходят: ${gameState.currentPlayer.toUpperCase()}

${boardVisual}`;
  }

  /**
   * Получает инструкции по формату ответа для крестиков-ноликов
   * @returns {string} Специфичные инструкции
   */
  getResponseFormatInstructions() {
    return `
ВАЖНО: Твой ответ должен содержать ТОЛЬКО JSON в следующем формате:
{
  "move": "row,col",
  "reasoning": "объяснение выбора хода и тактическое обоснование"
}

Примеры корректных ходов: "0,0", "1,1", "2,2"
Где первая цифра - строка (0-2), вторая - столбец (0-2).

Никакого дополнительного текста до или после JSON!`;
  }

  /**
   * Получает общие инструкции для AI крестиков-ноликов
   * @returns {string} Общие инструкции
   */
  getGeneralInstructions() {
    return `Ты - эксперт по крестикам-ноликам с идеальной игрой.
Анализируй каждую позицию тщательно.
Помни: победа > блокировка > центр > углы > края.
Всегда ищи возможности для создания форков (двойных угроз).`;
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====

  /**
   * Форматирует доску для визуального отображения в промпте
   * @param {Array} board - Доска 3x3
   * @returns {string} Визуальное представление доски
   */
  formatBoardVisual(board) {
    const symbols = {
      'x': 'X',
      'o': 'O',
      null: '·'
    };

    let visual = '';
    visual += '  0 1 2\n';
    
    for (let row = 0; row < 3; row++) {
      visual += `${row} `;
      for (let col = 0; col < 3; col++) {
        visual += symbols[board[row][col]] + ' ';
      }
      if (row < 2) visual += '\n';
    }

    return visual;
  }

  /**
   * Форматирует список ходов для промпта
   * @param {Array} moves - Массив ходов
   * @returns {string} Форматированный список
   */
  formatMoves(moves) {
    return moves.map(move => {
      const position = this.getPositionName(move.row, move.col);
      return `"${move.row},${move.col}" - ${position}`;
    }).join('\n');
  }

  /**
   * Получает название позиции на доске
   * @param {number} row - Строка
   * @param {number} col - Столбец
   * @returns {string} Название позиции
   */
  getPositionName(row, col) {
    if (row === 1 && col === 1) return 'ЦЕНТР (самая важная!)';
    
    const corners = [[0,0], [0,2], [2,0], [2,2]];
    if (corners.some(([r, c]) => r === row && c === col)) {
      const cornerNames = {
        '0,0': 'левый верхний угол',
        '0,2': 'правый верхний угол', 
        '2,0': 'левый нижний угол',
        '2,2': 'правый нижний угол'
      };
      return `УГОЛ (${cornerNames[`${row},${col}`]})`;
    }
    
    const edgeNames = {
      '0,1': 'верхний край',
      '1,0': 'левый край',
      '1,2': 'правый край',
      '2,1': 'нижний край'
    };
    return `край (${edgeNames[`${row},${col}`]})`;
  }

  /**
   * Анализирует позицию для AI
   * @param {Object} gameState - Состояние игры
   * @param {string} aiSide - Сторона AI
   * @returns {string} Описание анализа
   */
  analyzePosition(gameState, aiSide) {
    const opponentSide = aiSide === 'x' ? 'o' : 'x';
    const winningMoves = this.findWinningMoves(gameState.board, aiSide);
    const blockingMoves = this.findWinningMoves(gameState.board, opponentSide);
    const centerControl = gameState.board[1][1];
    
    let analysis = '';
    
    if (winningMoves.length > 0) {
      analysis += `🏆 МОЖЕШЬ ВЫИГРАТЬ! Выигрышные ходы: ${winningMoves.map(m => `(${m.row},${m.col})`).join(', ')}\n`;
    }
    
    if (blockingMoves.length > 0) {
      analysis += `🛡️ ОПАСНОСТЬ! Нужно блокировать: ${blockingMoves.map(m => `(${m.row},${m.col})`).join(', ')}\n`;
    }
    
    if (centerControl === aiSide) {
      analysis += '✅ Ты контролируешь центр - отличная позиция!\n';
    } else if (centerControl === opponentSide) {
      analysis += '⚠️ Противник контролирует центр - нужна осторожность\n';
    } else {
      analysis += '🎯 Центр свободен - стоит его занять\n';
    }
    
    return analysis.trim() || 'Стандартная позиция, применяй базовую стратегию';
  }

  /**
   * Генерирует тактический анализ для выбора хода
   * @param {Object} gameState - Состояние игры
   * @param {string} aiSide - Сторона AI
   * @param {Array} availableMoves - Доступные ходы
   * @returns {string} Тактический анализ
   */
  generateTacticalAnalysis(gameState, aiSide, availableMoves) {
    const opponentSide = aiSide === 'x' ? 'o' : 'x';
    const analysis = [];
    
    // Проверяем выигрышные ходы
    const winningMoves = this.findWinningMoves(gameState.board, aiSide);
    if (winningMoves.length > 0) {
      analysis.push(`🏆 ВЫИГРАЙ НЕМЕДЛЕННО: ${winningMoves.map(m => `(${m.row},${m.col})`).join(', ')}`);
    }
    
    // Проверяем блокирующие ходы
    const blockingMoves = this.findWinningMoves(gameState.board, opponentSide);
    if (blockingMoves.length > 0) {
      analysis.push(`🛡️ ЗАБЛОКИРУЙ УГРОЗУ: ${blockingMoves.map(m => `(${m.row},${m.col})`).join(', ')}`);
    }
    
    // Анализ центра
    if (gameState.board[1][1] === null) {
      analysis.push('🎯 ЦЕНТР СВОБОДЕН: (1,1) - займи для максимального контроля');
    }
    
    // Анализ углов
    const availableCorners = availableMoves.filter(m => 
      (m.row === 0 || m.row === 2) && (m.col === 0 || m.col === 2)
    );
    if (availableCorners.length > 0) {
      analysis.push(`🏰 ДОСТУПНЫЕ УГЛЫ: ${availableCorners.map(m => `(${m.row},${m.col})`).join(', ')}`);
    }
    
    return analysis.join('\n') || 'Выбери оптимальный ход согласно стратегии';
  }

  /**
   * Находит выигрышные ходы для игрока
   * @param {Array} board - Доска
   * @param {string} player - Игрок
   * @returns {Array} Массив выигрышных ходов
   */
  findWinningMoves(board, player) {
    const winningMoves = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === null) {
          // Временно делаем ход
          const testBoard = board.map(r => [...r]);
          testBoard[row][col] = player;
          
          // Проверяем, выигрывает ли этот ход
          if (this.checkWinner(testBoard) === player) {
            winningMoves.push({ row, col });
          }
        }
      }
    }

    return winningMoves;
  }

  /**
   * Проверяет наличие победителя
   * @param {Array} board - Доска 3x3
   * @returns {string|null} Символ победителя или null
   */
  checkWinner(board) {
    // Проверяем строки
    for (let row = 0; row < 3; row++) {
      if (board[row][0] && 
          board[row][0] === board[row][1] && 
          board[row][1] === board[row][2]) {
        return board[row][0];
      }
    }

    // Проверяем столбцы
    for (let col = 0; col < 3; col++) {
      if (board[0][col] && 
          board[0][col] === board[1][col] && 
          board[1][col] === board[2][col]) {
        return board[0][col];
      }
    }

    // Проверяем диагонали
    if (board[0][0] && 
        board[0][0] === board[1][1] && 
        board[1][1] === board[2][2]) {
      return board[0][0];
    }

    if (board[0][2] && 
        board[0][2] === board[1][1] && 
        board[1][1] === board[2][0]) {
      return board[0][2];
    }

    return null;
  }

  /**
   * Парсит ответ AI для крестиков-ноликов
   * @param {string} response - Ответ от AI
   * @returns {Object} Распарсенный ответ
   */
  parseAIResponse(response) {
    try {
      // Используем базовый парсинг
      const parsed = super.parseAIResponse(response);
      
      // Дополнительная валидация для крестиков-ноликов
      if (parsed.move && typeof parsed.move === 'string') {
        // Проверяем формат "row,col"
        const moveMatch = parsed.move.match(/^(\d),(\d)$/);
        if (!moveMatch) {
          throw new Error(`Неверный формат хода: ${parsed.move}. Ожидается "row,col"`);
        }
        
        const row = parseInt(moveMatch[1]);
        const col = parseInt(moveMatch[2]);
        
        if (row < 0 || row > 2 || col < 0 || col > 2) {
          throw new Error(`Ход вне границ доски: ${parsed.move}. Допустимые значения: 0-2`);
        }
        
        // Преобразуем в объект для удобства
        parsed.moveObject = { row, col };
      }
      
      return parsed;
      
    } catch (error) {
      throw new Error(`Ошибка парсинга ответа крестиков-ноликов: ${error.message}`);
    }
  }
}

module.exports = TicTacToePromptBuilder; 