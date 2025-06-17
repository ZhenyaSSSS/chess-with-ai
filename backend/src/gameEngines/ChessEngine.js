const { Chess } = require('chess.js');
const GameEngine = require('../interfaces/GameEngine');

/**
 * Движок для шахмат
 * Инкапсулирует всю логику шахматной игры
 */
class ChessEngine extends GameEngine {
  constructor() {
    super('chess');
  }

  /**
   * Валидирует ход игрока
   * @param {Object} gameState - Текущее состояние игры { fen: string }
   * @param {Object} move - Ход в формате { from: string, to: string, promotion?: string } или строка SAN
   * @param {string} player - Игрок ('white', 'black', 'human', 'ai')
   * @returns {boolean} true если ход валидный
   */
  validateMove(gameState, move, player) {
    try {
      const chess = new Chess(gameState.fen);
      
      // Проверяем, является ли это ходом правильного игрока
      const currentTurn = chess.turn(); // 'w' или 'b'
      const expectedColor = this.getPlayerColor(player, gameState);
      
      if (currentTurn !== expectedColor) {
        return false;
      }

      // Пробуем выполнить ход
      const result = chess.move(move);
      return result !== null;
    } catch (error) {
      console.error('Ошибка валидации хода:', error);
      return false;
    }
  }

  /**
   * Выполняет ход и возвращает новое состояние игры
   * @param {Object} gameState - Текущее состояние игры
   * @param {Object} move - Ход для выполнения
   * @param {string} player - Игрок
   * @returns {Object} Новое состояние игры
   */
  makeMove(gameState, move, player) {
    const chess = new Chess(gameState.fen);
    
    const result = chess.move(move);
    if (!result) {
      throw new Error(`Невалидный ход: ${JSON.stringify(move)}`);
    }

    return {
      fen: chess.fen(),
      lastMove: {
        from: result.from,
        to: result.to,
        san: result.san,
        piece: result.piece,
        captured: result.captured,
        promotion: result.promotion
      },
      turn: chess.turn(),
      history: chess.history(),
      moveNumber: Math.floor(chess.history().length / 2) + 1
    };
  }

  /**
   * Получает список всех возможных ходов для игрока
   * @param {Object} gameState - Текущее состояние игры
   * @param {string} player - Игрок
   * @returns {Array} Массив возможных ходов в SAN нотации
   */
  getAvailableMoves(gameState, player) {
    const chess = new Chess(gameState.fen);
    
    // Проверяем, чей ход
    const currentTurn = chess.turn();
    const expectedColor = this.getPlayerColor(player, gameState);
    
    if (currentTurn !== expectedColor) {
      return []; // Не ход этого игрока
    }

    return chess.moves({ verbose: false }); // Возвращаем в SAN нотации
  }

  /**
   * Получает детальную информацию о возможных ходах
   * @param {Object} gameState - Текущее состояние игры
   * @param {string} player - Игрок
   * @returns {Array} Массив объектов с детальной информацией о ходах
   */
  getDetailedMoves(gameState, player) {
    const chess = new Chess(gameState.fen);
    
    const currentTurn = chess.turn();
    const expectedColor = this.getPlayerColor(player, gameState);
    
    if (currentTurn !== expectedColor) {
      return [];
    }

    return chess.moves({ verbose: true });
  }

  /**
   * Проверяет, завершена ли игра
   * @param {Object} gameState - Текущее состояние игры
   * @returns {Object} { isGameOver: boolean, winner: string|null, reason: string }
   */
  checkGameEnd(gameState) {
    const chess = new Chess(gameState.fen);

    if (!chess.isGameOver()) {
      return {
        isGameOver: false,
        winner: null,
        reason: null
      };
    }

    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'black' : 'white';
      return {
        isGameOver: true,
        winner,
        reason: 'checkmate'
      };
    }

    if (chess.isStalemate()) {
      return {
        isGameOver: true,
        winner: null,
        reason: 'stalemate'
      };
    }

    if (chess.isDraw()) {
      let reason = 'draw';
      if (chess.isInsufficientMaterial()) {
        reason = 'insufficient_material';
      } else if (chess.isThreefoldRepetition()) {
        reason = 'threefold_repetition';
      }

      return {
        isGameOver: true,
        winner: null,
        reason
      };
    }

    return {
      isGameOver: true,
      winner: null,
      reason: 'unknown'
    };
  }

  /**
   * Возвращает начальное состояние шахматной игры
   * @returns {Object} Начальное состояние
   */
  getInitialState() {
    const chess = new Chess();
    return {
      fen: chess.fen(),
      turn: 'w',
      history: [],
      moveNumber: 1,
      lastMove: null
    };
  }

  /**
   * Определяет, чей сейчас ход
   * @param {Object} gameState - Текущее состояние игры
   * @returns {string} 'white' или 'black'
   */
  getCurrentPlayer(gameState) {
    const chess = new Chess(gameState.fen);
    return chess.turn() === 'w' ? 'white' : 'black';
  }

  /**
   * Анализирует материальный баланс позиции
   * @param {Object} gameState - Состояние игры
   * @returns {Object} Информация о материальном балансе
   */
  calculateMaterialBalance(gameState) {
    const chess = new Chess(gameState.fen);
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
    
    return {
      white: whiteValue,
      black: blackValue,
      difference,
      description: this.getMaterialBalanceDescription(whiteValue, blackValue, difference)
    };
  }

  /**
   * Определяет фазу игры
   * @param {Object} gameState - Состояние игры
   * @returns {Object} Информация о фазе игры
   */
  determineGamePhase(gameState) {
    const chess = new Chess(gameState.fen);
    const moveCount = chess.history().length;
    
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
    
    let phase, description;
    
    if (moveCount < 20 && heavyPieces >= 4) {
      phase = 'opening';
      description = "Дебют - развитие фигур";
    } else if (moveCount < 40 && heavyPieces >= 2) {
      phase = 'middlegame';
      description = "Миттельшпиль - борьба за преимущество";
    } else {
      phase = 'endgame';
      description = "Эндшпиль - реализация преимущества";
    }

    return {
      phase,
      description,
      moveCount,
      heavyPieces
    };
  }

  /**
   * Анализирует безопасность короля
   * @param {Object} gameState - Состояние игры
   * @param {string} side - Сторона для анализа ('white' или 'black')
   * @returns {Object} Информация о безопасности короля
   */
  analyzeKingSafety(gameState, side) {
    const chess = new Chess(gameState.fen);
    const color = side === 'white' ? 'w' : 'b';
    
    const isInCheck = chess.inCheck() && chess.turn() === color;
    const canCastle = this.canCastle(chess, color);
    
    return {
      inCheck: isInCheck,
      canCastleKingside: canCastle.kingside,
      canCastleQueenside: canCastle.queenside,
      description: this.getKingSafetyDescription(isInCheck, canCastle)
    };
  }

  /**
   * Анализирует контроль центра
   * @param {Object} gameState - Состояние игры
   * @returns {Object} Информация о контроле центра
   */
  analyzeCenterControl(gameState) {
    const chess = new Chess(gameState.fen);
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

    return {
      white: whiteControl,
      black: blackControl,
      description: this.getCenterControlDescription(whiteControl, blackControl)
    };
  }

  /**
   * Анализирует фигуры на доске для определенной стороны
   * @param {Object} gameState - Состояние игры
   * @param {string} side - Сторона ('white' или 'black')
   * @returns {Object} Анализ фигур
   */
  analyzePiecesOnBoard(gameState, side) {
    const chess = new Chess(gameState.fen);
    const color = side === 'white' ? 'w' : 'b';
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
    
    return {
      pieces,
      positions,
      pieceNames,
      description: this.getPieceAnalysisDescription(pieces, positions, pieceNames)
    };
  }

  /**
   * Возвращает метаданные шахматной игры
   * @returns {Object} Метаданные
   */
  getGameMetadata() {
    return {
      type: 'chess',
      name: 'Шахматы',
      description: 'Классическая шахматная игра на доске 8x8',
      minPlayers: 2,
      maxPlayers: 2,
      estimatedDuration: '30-120 минут',
      complexity: 'Высокая',
      skills: ['Стратегическое мышление', 'Тактическое планирование', 'Анализ позиций']
    };
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====

  /**
   * Определяет цвет игрока
   * @param {string} player - Идентификатор игрока
   * @param {Object} gameState - Состояние игры
   * @returns {string} 'w' или 'b'
   */
  getPlayerColor(player, gameState) {
    if (player === 'white') return 'w';
    if (player === 'black') return 'b';
    
    // Для human игроков - предполагаем что человек играет белыми
    if (player === 'human') return 'w';
    if (player === 'ai') return 'b';
    
    // Если есть специфичные поля в gameState
    if (gameState.humanSide) {
      if (player === 'human') return gameState.humanSide === 'white' ? 'w' : 'b';
    }
    if (gameState.aiSide) {
      if (player === 'ai') return gameState.aiSide === 'white' ? 'w' : 'b';
    }
    
    // По умолчанию определяем по текущему ходу
    const chess = new Chess(gameState.fen);
    return chess.turn();
  }

  /**
   * Проверяет возможность рокировки
   * @param {Chess} chess - Объект игры
   * @param {string} color - Цвет игрока ('w' или 'b')
   * @returns {Object} Информация о рокировке
   */
  canCastle(chess, color) {
    const fen = chess.fen();
    const castlingRights = fen.split(' ')[2];
    
    return {
      kingside: castlingRights.includes(color === 'w' ? 'K' : 'k'),
      queenside: castlingRights.includes(color === 'w' ? 'Q' : 'q')
    };
  }

  /**
   * Создает описание материального баланса
   * @param {number} whiteValue - Стоимость белых фигур
   * @param {number} blackValue - Стоимость черных фигур
   * @param {number} difference - Разность
   * @returns {string} Описание баланса
   */
  getMaterialBalanceDescription(whiteValue, blackValue, difference) {
    if (Math.abs(difference) <= 1) {
      return `Равный материал (${whiteValue}:${blackValue})`;
    } else if (difference > 0) {
      return `Белые +${difference} (${whiteValue}:${blackValue})`;
    } else {
      return `Черные +${Math.abs(difference)} (${whiteValue}:${blackValue})`;
    }
  }

  /**
   * Создает описание безопасности короля
   * @param {boolean} inCheck - Под шахом ли король
   * @param {Object} canCastle - Возможность рокировки
   * @returns {string} Описание безопасности
   */
  getKingSafetyDescription(inCheck, canCastle) {
    if (inCheck) {
      return "⚠️ КРИТИЧНО: Король под шахом!";
    }
    
    const castling = [];
    if (canCastle.kingside) castling.push("короткая");
    if (canCastle.queenside) castling.push("длинная");
    
    if (castling.length > 0) {
      return `✅ Король в безопасности. Доступна рокировка: ${castling.join(', ')}`;
    }
    
    return "✅ Король в безопасности. Рокировка недоступна";
  }

  /**
   * Создает описание контроля центра
   * @param {number} whiteControl - Контроль белых
   * @param {number} blackControl - Контроль черных
   * @returns {string} Описание контроля
   */
  getCenterControlDescription(whiteControl, blackControl) {
    if (whiteControl > blackControl) {
      return `Белые контролируют центр (+${whiteControl - blackControl})`;
    } else if (blackControl > whiteControl) {
      return `Черные контролируют центр (+${blackControl - whiteControl})`;
    } else {
      return "Равная борьба за центр";
    }
  }

  /**
   * Создает описание анализа фигур
   * @param {Object} pieces - Количество фигур
   * @param {Object} positions - Позиции фигур
   * @param {Object} pieceNames - Названия фигур
   * @returns {string} Описание фигур
   */
  getPieceAnalysisDescription(pieces, positions, pieceNames) {
    let analysis = "Твои фигуры на доске:\n";
    
    const pieceOrder = ['k', 'q', 'r', 'b', 'n', 'p'];
    
    pieceOrder.forEach(type => {
      if (pieces[type]) {
        analysis += `- ${pieceNames[type].charAt(0).toUpperCase() + pieceNames[type].slice(1)} (${pieces[type]}): ${positions[type].join(', ')}\n`;
      } else {
        analysis += `- ${pieceNames[type].charAt(0).toUpperCase() + pieceNames[type].slice(1)}: НЕТ НА ДОСКЕ\n`;
      }
    });
    
    return analysis.trim();
  }
}

module.exports = ChessEngine; 