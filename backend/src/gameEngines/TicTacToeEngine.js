const GameEngine = require('../interfaces/GameEngine');

/**
 * Движок для крестиков-ноликов
 * Простая игра 3x3 с полной логикой победы, ничьи и валидации ходов
 */
class TicTacToeEngine extends GameEngine {
  constructor() {
    super('tictactoe');
  }

  /**
   * Валидирует ход игрока
   * @param {Object} gameState - Состояние игры { board: Array, currentPlayer: string }
   * @param {Object} move - Ход { row: number, col: number }
   * @param {string} player - Игрок ('x', 'o', 'human', 'ai')
   * @returns {boolean} true если ход валидный
   */
  validateMove(gameState, move, player) {
    try {
      // Проверяем формат хода
      if (!move || typeof move.row !== 'number' || typeof move.col !== 'number') {
        return false;
      }

      const { row, col } = move;

      // Проверяем границы доски
      if (row < 0 || row > 2 || col < 0 || col > 2) {
        return false;
      }

      // Проверяем, что клетка пустая
      if (gameState.board[row][col] !== null) {
        return false;
      }

      // Проверяем, что это ход правильного игрока
      const expectedPlayer = this.getPlayerSymbol(player, gameState);
      if (gameState.currentPlayer !== expectedPlayer) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Ошибка валидации хода крестиков-ноликов:', error);
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
    if (!this.validateMove(gameState, move, player)) {
      throw new Error(`Невалидный ход: row=${move.row}, col=${move.col}`);
    }

    const { row, col } = move;
    
    // Клонируем доску
    const newBoard = gameState.board.map(row => [...row]);
    
    // Делаем ход
    newBoard[row][col] = gameState.currentPlayer;

    // Определяем следующего игрока
    const nextPlayer = gameState.currentPlayer === 'x' ? 'o' : 'x';

    return {
      board: newBoard,
      currentPlayer: nextPlayer,
      lastMove: { row, col, player: gameState.currentPlayer },
      moveCount: (gameState.moveCount || 0) + 1
    };
  }

  /**
   * Получает список всех возможных ходов
   * @param {Object} gameState - Состояние игры
   * @param {string} player - Игрок
   * @returns {Array} Массив возможных ходов
   */
  getAvailableMoves(gameState, player) {
    const moves = [];
    const expectedPlayer = this.getPlayerSymbol(player, gameState);

    // Если не ход этого игрока, возвращаем пустой массив
    if (gameState.currentPlayer !== expectedPlayer) {
      return moves;
    }

    // Проверяем все клетки доски
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (gameState.board[row][col] === null) {
          moves.push({ row, col });
        }
      }
    }

    return moves;
  }

  /**
   * Проверяет, завершена ли игра
   * @param {Object} gameState - Состояние игры
   * @returns {Object} { isGameOver: boolean, winner: string|null, reason: string }
   */
  checkGameEnd(gameState) {
    const winner = this.checkWinner(gameState.board);
    
    if (winner) {
      return {
        isGameOver: true,
        winner: winner,
        reason: 'win'
      };
    }

    // Проверяем ничью (доска заполнена)
    if (this.isBoardFull(gameState.board)) {
      return {
        isGameOver: true,
        winner: null,
        reason: 'draw'
      };
    }

    return {
      isGameOver: false,
      winner: null,
      reason: null
    };
  }

  /**
   * Возвращает начальное состояние игры
   * @returns {Object} Начальное состояние
   */
  getInitialState() {
    return {
      board: [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ],
      currentPlayer: 'x', // X всегда ходит первым
      lastMove: null,
      moveCount: 0
    };
  }

  /**
   * Определяет, чей сейчас ход
   * @param {Object} gameState - Состояние игры
   * @returns {string} 'x' или 'o'
   */
  getCurrentPlayer(gameState) {
    return gameState.currentPlayer;
  }

  /**
   * Возвращает представление доски для отображения
   * @param {Object} gameState - Состояние игры
   * @returns {Object} Представление доски
   */
  getBoardRepresentation(gameState) {
    return {
      board: gameState.board,
      currentPlayer: gameState.currentPlayer,
      lastMove: gameState.lastMove,
      moveCount: gameState.moveCount
    };
  }

  /**
   * Анализирует игровую позицию для AI
   * @param {Object} gameState - Состояние игры
   * @param {string} aiSide - Сторона AI ('x' или 'o')
   * @returns {Object} Анализ позиции
   */
  analyzePosition(gameState, aiSide) {
    const opponentSide = aiSide === 'x' ? 'o' : 'x';
    
    return {
      canWin: this.findWinningMoves(gameState.board, aiSide),
      mustBlock: this.findWinningMoves(gameState.board, opponentSide),
      centerAvailable: gameState.board[1][1] === null,
      cornersAvailable: this.getAvailableCorners(gameState.board),
      edgesAvailable: this.getAvailableEdges(gameState.board),
      moveCount: gameState.moveCount || 0
    };
  }

  /**
   * Возвращает метаданные игры
   * @returns {Object} Метаданные
   */
  getGameMetadata() {
    return {
      type: 'tictactoe',
      name: 'Крестики-нолики',
      description: 'Классическая игра крестики-нолики на поле 3x3',
      minPlayers: 2,
      maxPlayers: 2,
      estimatedDuration: '1-5 минут',
      complexity: 'Низкая',
      skills: ['Логическое мышление', 'Планирование на 1-2 хода']
    };
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====

  /**
   * Определяет символ игрока
   * @param {string} player - Идентификатор игрока
   * @param {Object} gameState - Состояние игры
   * @returns {string} 'x' или 'o'
   */
  getPlayerSymbol(player, gameState) {
    if (player === 'x' || player === 'o') return player;
    if (player === 'human') return gameState.humanSide || 'x';
    if (player === 'ai') return gameState.aiSide || 'o';
    
    // По умолчанию
    return gameState.currentPlayer;
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
   * Проверяет, заполнена ли доска
   * @param {Array} board - Доска 3x3
   * @returns {boolean} true если доска заполнена
   */
  isBoardFull(board) {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === null) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Находит выигрышные ходы для игрока
   * @param {Array} board - Доска
   * @param {string} player - Игрок ('x' или 'o')
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
   * Получает доступные угловые клетки
   * @param {Array} board - Доска
   * @returns {Array} Массив доступных углов
   */
  getAvailableCorners(board) {
    const corners = [
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 2, col: 0 },
      { row: 2, col: 2 }
    ];

    return corners.filter(corner => board[corner.row][corner.col] === null);
  }

  /**
   * Получает доступные клетки на краях
   * @param {Array} board - Доска
   * @returns {Array} Массив доступных краев
   */
  getAvailableEdges(board) {
    const edges = [
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 2 },
      { row: 2, col: 1 }
    ];

    return edges.filter(edge => board[edge.row][edge.col] === null);
  }

  /**
   * Преобразует состояние доски в строку для анализа
   * @param {Array} board - Доска
   * @returns {string} Строковое представление
   */
  boardToString(board) {
    return board.map(row => 
      row.map(cell => cell || '_').join('')
    ).join('\n');
  }

  /**
   * Оценивает позицию для AI (простая эвристика)
   * @param {Array} board - Доска
   * @param {string} aiSide - Сторона AI
   * @returns {number} Оценка позиции (-10 до +10)
   */
  evaluatePosition(board, aiSide) {
    const winner = this.checkWinner(board);
    
    if (winner === aiSide) return 10;
    if (winner && winner !== aiSide) return -10;
    if (this.isBoardFull(board)) return 0;

    // Простая позиционная оценка
    let score = 0;
    
    // Центр стоит больше
    if (board[1][1] === aiSide) score += 3;
    if (board[1][1] && board[1][1] !== aiSide) score -= 3;
    
    // Углы стоят меньше
    const corners = [[0,0], [0,2], [2,0], [2,2]];
    corners.forEach(([row, col]) => {
      if (board[row][col] === aiSide) score += 2;
      if (board[row][col] && board[row][col] !== aiSide) score -= 2;
    });

    return score;
  }
}

module.exports = TicTacToeEngine; 