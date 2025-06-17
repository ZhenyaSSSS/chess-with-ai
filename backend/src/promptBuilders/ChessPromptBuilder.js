const AIPromptBuilder = require('../interfaces/AIPromptBuilder');
const { Chess } = require('chess.js');

/**
 * Построитель промптов для шахматной игры
 * Создает специализированные промпты для AI шахматного анализа
 */
class ChessPromptBuilder extends AIPromptBuilder {
  constructor() {
    super('chess');
  }

  /**
   * Создает основной промпт для анализа шахматной позиции
   * @param {Object} gameState - Состояние игры { fen: string }
   * @param {string} strategy - Стратегия AI
   * @param {string} aiSide - Сторона AI ('white' или 'black')
   * @returns {string} Промпт для анализа
   */
  buildAnalysisPrompt(gameState, strategy, aiSide) {
    const chess = new Chess(gameState.fen);
    const turn = chess.turn() === 'w' ? 'White' : 'Black';
    const isCheck = chess.inCheck();
    const isGameOver = chess.isGameOver();
    
    // Анализируем позицию
    const materialBalance = this.calculateMaterialBalance(chess);
    const gamePhase = this.determineGamePhase(chess);
    const kingPosition = this.analyzeKingSafety(chess, aiSide);
    const centerControl = this.analyzeCenterControl(chess);
    const piecesAnalysis = this.analyzePiecesOnBoard(chess, aiSide);

    return `Ты - гроссмейстер по шахматам мирового уровня. Ты играешь за ${aiSide === 'white' ? 'БЕЛЫХ' : 'ЧЕРНЫХ'}.

**СТРАТЕГИЧЕСКИЙ АНАЛИЗ ПОЗИЦИИ:**

🎯 **ГЛАВНАЯ ЦЕЛЬ:** Выиграть партию, используя долгосрочное планирование и тактическую точность.

📊 **ТЕКУЩАЯ СИТУАЦИЯ:**
- FEN: ${gameState.fen}
- Сейчас ходят: ${turn} (${(turn === 'White' && aiSide === 'white') || (turn === 'Black' && aiSide === 'black') ? 'ЭТО ТЫ' : 'противник'})
- Фаза игры: ${gamePhase}
- Материальный баланс: ${materialBalance}
- ${isCheck ? '⚠️ КРИТИЧНО: Король под шахом!' : '✅ Король в безопасности'}
- ${isGameOver ? '🔚 Игра завершена!' : '⚡ Игра продолжается'}

🏰 **БЕЗОПАСНОСТЬ КОРОЛЯ:**
${kingPosition}

🏛️ **КОНТРОЛЬ ЦЕНТРА:**
${centerControl}

📈 **ФОКУС НА ПОЗИЦИИ:**
Анализируем только текущую позицию без влияния предыдущих ходов

🧠 **ТВОЯ ТЕКУЩАЯ СТРАТЕГИЯ:**
"${strategy}"

🔍 **АНАЛИЗ ТВОИХ ФИГУР:**
${piecesAnalysis}`;
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

    console.log(`📋 Доступно ходов: ${availableMoves.length} (${availableMoves.slice(0, 5).join(', ')}${availableMoves.length > 5 ? '...' : ''})`);

    return `🎯 **ДОСТУПНЫЕ ХОДЫ (ВСЕ ВОЗМОЖНЫЕ ХОДЫ):**
${availableMoves.join(', ')}

🚨 **КРИТИЧЕСКИ ВАЖНО:** Ты МОЖЕШЬ сделать ТОЛЬКО один из ходов выше. Никакие другие ходы невозможны в этой позиции!

**ГЛУБОКИЙ СТРАТЕГИЧЕСКИЙ АНАЛИЗ:**

Проанализируй позицию методически:

1️⃣ **ТАКТИЧЕСКИЙ АНАЛИЗ (приоритет #1):**
   - Есть ли угрозы мата в 1-3 хода?
   - Можно ли выиграть материал (связки, вилки, двойные удары)?
   - Есть ли тактические мотивы (рентген, завлечение, отвлечение)?

2️⃣ **МАТЕРИАЛЬНАЯ ОЦЕНКА:**
   - Текущий материальный баланс
   - Возможность размена для упрощения позиции
   - Качество фигур vs количество

3️⃣ **ПОЗИЦИОННОЕ ПЛАНИРОВАНИЕ:**
   - Улучшение позиции фигур
   - Контроль ключевых полей и линий
   - Создание слабостей в лагере противника

4️⃣ **ПЕШЕЧНАЯ СТРУКТУРА:**
   - Создание проходных пешек
   - Устранение слабых пешек
   - Пешечные прорывы

5️⃣ **ДОЛГОСРОЧНАЯ СТРАТЕГИЯ:**
   - План на следующие 3-5 ходов
   - Подготовка к эндшпилю
   - Создание долгосрочных преимуществ

**ТРЕБОВАНИЯ К ОТВЕТУ:**
1. Ход ДОЛЖЕН быть ТОЧНО скопирован из списка доступных ходов выше (без изменений!)
2. Никаких других ходов быть не может
3. Стратегия должна быть детальной (до 200 символов) и включать:
   - Краткое обоснование выбранного хода
   - План на следующие 2-3 хода
   - Основную стратегическую идею

**СПИСОК ДОСТУПНЫХ ХОДОВ ДЛЯ СПРАВКИ:**
${availableMoves.join(', ')}

🚨🚨🚨 КРИТИЧЕСКИ ВАЖНО: Ход должен быть ТОЧНОЙ КОПИЕЙ из списка! Нельзя изобретать ходы! 🚨🚨🚨

⚠️ НЕ ДЕЛАЙ ХОДЫ ФИГУРАМИ, КОТОРЫХ НЕТ НА ДОСКЕ! Проверь анализ своих фигур выше!`;
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
    return `🚨 **ИСПРАВЛЕНИЕ ОШИБКИ:**

Твой предыдущий ход "${invalidMove}" был неверным. 
Ошибка: "${error}"

**ДОСТУПНЫЕ КОРРЕКТНЫЕ ХОДЫ:**
${availableMoves.join(', ')}

Пожалуйста, проанализируй доску заново и выбери ДРУГОЙ, КОРРЕКТНЫЙ ход из списка доступных ходов.

**АНАЛИЗ ПОЗИЦИИ:**
${this.formatGameState(gameState)}

Ход ДОЛЖЕН быть ТОЧНОЙ КОПИЕЙ одного из ходов из списка выше!`;
  }

  /**
   * Форматирует состояние игры для промпта
   * @param {Object} gameState - Состояние игры
   * @returns {string} Форматированное описание
   */
  formatGameState(gameState) {
    const chess = new Chess(gameState.fen);
    const turn = chess.turn() === 'w' ? 'Белые' : 'Черные';
    const moveCount = chess.history().length;
    const isCheck = chess.inCheck();
    
    return `FEN: ${gameState.fen}
Ход: ${turn} (ход ${Math.floor(moveCount / 2) + 1})
${isCheck ? 'Шах!' : 'Король в безопасности'}`;
  }

  /**
   * Получает инструкции по формату ответа для шахмат
   * @returns {string} Специфичные для шахмат инструкции
   */
  getResponseFormatInstructions() {
    return `
ВАЖНО: Твой ответ должен содержать ТОЛЬКО JSON в следующем формате:
{
  "move": "ТОЧНАЯ КОПИЯ хода из списка доступных (например: Nf3, e4, O-O)",
  "strategy": "Детальная стратегия: обоснование хода + план на 2-3 хода + главная идея (до 200 символов)"
}

Никакого дополнительного текста до или после JSON!
Ход должен быть в стандартной шахматной нотации (SAN).`;
  }

  /**
   * Получает общие инструкции для шахматного AI
   * @returns {string} Общие инструкции
   */
  getGeneralInstructions() {
    return `Ты - экспертный шахматист мирового уровня. 
Анализируй позицию глубоко и выбирай лучшие ходы.
Учитывай как тактические, так и стратегические аспекты игры.
Приоритет: мат > материал > позиция > развитие.`;
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ АНАЛИЗА =====

  /**
   * Анализирует материальный баланс позиции
   * @param {Chess} chess - Объект игры chess.js
   * @returns {string} Описание материального баланса
   */
  calculateMaterialBalance(chess) {
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    let whiteValue = 0, blackValue = 0;
    
    const board = chess.board();
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const value = pieceValues[piece.type];
          if (piece.color === 'w') {
            whiteValue += value;
          } else {
            blackValue += value;
          }
        }
      }
    }
    
    const difference = whiteValue - blackValue;
    if (Math.abs(difference) <= 1) {
      return `Равный материал (${whiteValue}:${blackValue})`;
    } else if (difference > 0) {
      return `Белые +${difference} (${whiteValue}:${blackValue})`;
    } else {
      return `Черные +${Math.abs(difference)} (${whiteValue}:${blackValue})`;
    }
  }

  /**
   * Определяет фазу игры
   * @param {Chess} chess - Объект игры
   * @returns {string} Фаза игры
   */
  determineGamePhase(chess) {
    const history = chess.history();
    const moveCount = history.length;
    
    // Подсчитываем тяжелые фигуры на доске
    const board = chess.board();
    let heavyPieces = 0;
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece && (piece.type === 'q' || piece.type === 'r')) {
          heavyPieces++;
        }
      }
    }
    
    if (moveCount < 20 && heavyPieces >= 4) {
      return "Дебют - развитие фигур";
    } else if (moveCount < 40 && heavyPieces >= 2) {
      return "Миттельшпиль - борьба за преимущество";
    } else {
      return "Эндшпиль - реализация преимущества";
    }
  }

  /**
   * Анализирует безопасность короля
   * @param {Chess} chess - Объект игры
   * @param {string} aiSide - Сторона AI
   * @returns {string} Описание безопасности короля
   */
  analyzeKingSafety(chess, aiSide) {
    const color = aiSide === 'white' ? 'w' : 'b';
    const isCheck = chess.inCheck() && chess.turn() === color;
    
    // Простой анализ рокировки
    const fen = chess.fen();
    const castlingRights = fen.split(' ')[2];
    
    const canCastleKingside = castlingRights.includes(color === 'w' ? 'K' : 'k');
    const canCastleQueenside = castlingRights.includes(color === 'w' ? 'Q' : 'q');
    
    if (isCheck) {
      return "⚠️ КРИТИЧНО: Твой король под шахом!";
    }
    
    const castling = [];
    if (canCastleKingside) castling.push("короткая");
    if (canCastleQueenside) castling.push("длинная");
    
    if (castling.length > 0) {
      return `✅ Твой король в безопасности. Доступна рокировка: ${castling.join(', ')}`;
    }
    
    return "✅ Твой король в безопасности. Рокировка недоступна";
  }

  /**
   * Анализирует контроль центра
   * @param {Chess} chess - Объект игры
   * @returns {string} Описание контроля центра
   */
  analyzeCenterControl(chess) {
    const centerSquares = ['d4', 'd5', 'e4', 'e5'];
    let whiteControl = 0, blackControl = 0;
    
    centerSquares.forEach(square => {
      const attacks = chess.attackers(square);
      attacks.forEach(attacker => {
        const piece = chess.get(attacker);
        if (piece.color === 'w') {
          whiteControl++;
        } else {
          blackControl++;
        }
      });
    });

    if (whiteControl > blackControl) {
      return `Белые контролируют центр (+${whiteControl - blackControl})`;
    } else if (blackControl > whiteControl) {
      return `Черные контролируют центр (+${blackControl - whiteControl})`;
    } else {
      return "Равная борьба за центр";
    }
  }

  /**
   * Анализирует фигуры на доске для AI стороны
   * @param {Chess} chess - Объект игры
   * @param {string} aiSide - Сторона AI
   * @returns {string} Описание фигур
   */
  analyzePiecesOnBoard(chess, aiSide) {
    const color = aiSide === 'white' ? 'w' : 'b';
    const board = chess.board();
    
    const pieces = {};
    const positions = {};
    const pieceNames = {
      k: 'король', q: 'ферзь', r: 'ладья', 
      b: 'слон', n: 'конь', p: 'пешка'
    };
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (piece && piece.color === color) {
          const square = String.fromCharCode(97 + file) + (8 - rank);
          
          if (!pieces[piece.type]) {
            pieces[piece.type] = 0;
            positions[piece.type] = [];
          }
          pieces[piece.type]++;
          positions[piece.type].push(square);
        }
      }
    }
    
    let analysis = `Твои фигуры на доске:\n`;
    
    // Все фигуры в одинаковом формате
    const pieceOrder = ['k', 'q', 'r', 'b', 'n', 'p']; // Порядок по важности
    
    pieceOrder.forEach(type => {
      if (pieces[type]) {
        analysis += `- ${pieceNames[type].charAt(0).toUpperCase() + pieceNames[type].slice(1)} (${pieces[type]}): ${positions[type].join(', ')}\n`;
      } else {
        analysis += `- ${pieceNames[type].charAt(0).toUpperCase() + pieceNames[type].slice(1)}: НЕТ НА ДОСКЕ\n`;
      }
    });
    
    return analysis.trim();
  }

  /**
   * Парсит ответ AI специфично для шахмат
   * @param {string} response - Ответ от AI
   * @returns {Object} Распарсенный ответ
   */
  parseAIResponse(response) {
    try {
      // Используем базовый парсинг
      const parsed = super.parseAIResponse(response);
      
      // Дополнительная валидация для шахмат
      if (parsed.move && typeof parsed.move === 'string') {
        // Убираем лишние пробелы и символы
        parsed.move = parsed.move.trim();
        
        // Проверяем, что ход выглядит как шахматная нотация
        if (!/^[a-hA-H]?[1-8]?[NBRQK]?[a-h][1-8]([+#])?(\=[NBRQ])?$|^O-O(-O)?([+#])?$/.test(parsed.move)) {
          console.warn(`Подозрительный формат хода: ${parsed.move}`);
        }
      }
      
      // Обрезаем стратегию до 250 символов
      if (parsed.newStrategy && parsed.newStrategy.length > 250) {
        parsed.newStrategy = parsed.newStrategy.substring(0, 247) + '...';
      }
      
      return parsed;
      
    } catch (error) {
      throw new Error(`Ошибка парсинга шахматного ответа: ${error.message}`);
    }
  }
}

module.exports = ChessPromptBuilder; 