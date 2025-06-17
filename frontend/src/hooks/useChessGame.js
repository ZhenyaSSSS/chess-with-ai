import { useState, useMemo, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { getAiMove } from '../services/apiService'; // Legacy API
import { validateApiKey } from '../utils/gameUtils';

/**
 * Кастомный хук для управления шахматной игрой
 * @param {string} apiKey - API ключ для взаимодействия с AI
 * @param {string} selectedModel - Выбранная модель AI
 * @returns {Object} Состояние и методы игры
 */
export function useChessGame(apiKey, selectedModel = 'gemini-2.5-pro-preview-05-06') {
  // Создаем экземпляр игры Chess.js
  const game = useMemo(() => new Chess(), []);

  // ================ СОСТОЯНИЯ ================
  const [fen, setFen] = useState(game.fen());
  const [aiStrategy, setAiStrategy] = useState(
    'Начинаю партию с фокусом на развитие фигур и контроль центра. План: быстрое развитие, безопасность короля, затем тактические возможности.'
  );
  const [gameStatus, setGameStatus] = useState('Введите API ключ для начала игры');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [error, setError] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  
  // UI состояния
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  
  // Стороны игроков
  const [playerSide, setPlayerSide] = useState('white'); // 'white' или 'black'
  const [aiSide, setAiSide] = useState('black'); // противоположная сторона

  // Состояния для превращения пешки
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);

  // ================ ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ ================
  
  // Функция для определения, чей сейчас ход
  const isPlayerTurn = useCallback(() => {
    const currentTurn = game.turn(); // 'w' или 'b'
    const playerColor = playerSide === 'white' ? 'w' : 'b';
    return currentTurn === playerColor;
  }, [game, playerSide]);

  const isAiTurn = useCallback(() => {
    const currentTurn = game.turn(); // 'w' или 'b' 
    const aiColor = aiSide === 'white' ? 'w' : 'b';
    return currentTurn === aiColor;
  }, [game, aiSide]);

  // ================ ЭФФЕКТЫ ================

  // Эффект для обновления статуса игры
  useEffect(() => {
    if (!apiKey) {
      setGameStatus('Введите API ключ для начала игры');
      return;
    }

    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? 'Черные' : 'Белые';
        setGameStatus(`Мат! ${winner} выиграли!`);
      } else if (game.isDraw()) {
        setGameStatus('Ничья!');
      } else if (game.isStalemate()) {
        setGameStatus('Пат! Ничья.');
      }
      return;
    }

    if (isAiThinking) {
      setGameStatus('AI думает...');
      return;
    }

    // Улучшенное определение статуса с учетом сторон
    const turn = game.turn() === 'w' ? 'Белые' : 'Черные';
    const isCheck = game.inCheck();
    const isPlayersTurn = isPlayerTurn();
    
    if (isCheck) {
      if (isPlayersTurn) {
        setGameStatus(`${turn} ходят (ВЫ) - ШАХ!`);
      } else {
        setGameStatus(`${turn} ходят (AI) - ШАХ!`);
      }
    } else {
      if (isPlayersTurn) {
        setGameStatus(`${turn} ходят (ВЫ)`);
      } else {
        setGameStatus(`${turn} ходят (AI)`);
      }
    }
  }, [fen, apiKey, isAiThinking, game, isPlayerTurn]);

  // Эффект для автоматического хода AI когда его очередь
  useEffect(() => {
    if (apiKey && !game.isGameOver() && !isAiThinking && isAiTurn()) {
      // Небольшая задержка для лучшего UX
      const timer = setTimeout(() => {
        makeAiMove();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [fen, apiKey, isAiThinking, isAiTurn]); // Убираем makeAiMove из зависимостей чтобы избежать цикла

  // ================ МЕТОДЫ ================

  // Функция для получения хода от AI
  const makeAiMove = useCallback(async () => {
    if (!apiKey || game.isGameOver() || isAiThinking || !isAiTurn()) return;

    setIsAiThinking(true);
    setError(null);

    try {
      console.log('Запрашиваем ход от AI...');
      
      const response = await getAiMove({
        fen: game.fen(),
        strategy: aiStrategy,
        model: selectedModel,
        apiKey: apiKey,
        aiSide: aiSide
      });

      console.log('AI ответил:', response);
      console.log('🔍 Reasoning от AI:', response.reasoning);
      console.log('🔍 NewStrategy от AI:', response.newStrategy);

      // Делаем ход AI
      const move = game.move(response.move);
      
      if (move) {
        const moveData = {
          move: response.move,
          san: move.san,
          player: 'AI',
          side: aiSide,
          timestamp: Date.now(),
          reasoning: response.reasoning || null, // Добавляем объяснение хода
          newStrategy: response.newStrategy || null // Добавляем новую стратегию
        };
        
        console.log('📝 Добавляем в историю ходов:', moveData);
        
        setFen(game.fen());
        setMoveHistory(prev => [...prev, moveData]);
        setLastMove({ from: move.from, to: move.to });
        setAiStrategy(response.newStrategy || aiStrategy);
        console.log('✅ AI сделал ход:', response.move);
      } else {
        throw new Error('Невалидный ход от AI: ' + response.move);
      }

    } catch (error) {
      console.error('Ошибка при получении хода AI:', error);
      setError(`Ошибка AI: ${error.message}`);
    } finally {
      setIsAiThinking(false);
    }
  }, [apiKey, aiStrategy, game, isAiThinking, isAiTurn, aiSide, selectedModel]);

  // Вспомогательная функция для выполнения хода
  const executeMove = useCallback((sourceSquare, targetSquare, promotion = null) => {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: promotion
      });

      if (move === null) {
        return false;
      }

      // Получаем новое FEN состояние
      const newFen = game.fen();
      
      // Ход валидный - обновляем состояние
      setFen(newFen);
      setMoveHistory(prev => [...prev, {
        move: `${sourceSquare}${targetSquare}${promotion || ''}`,
        san: move.san,
        player: 'Человек',
        side: playerSide,
        timestamp: Date.now()
      }]);
      setLastMove({ from: sourceSquare, to: targetSquare });
      setSelectedSquare(null);
      setPossibleMoves([]);
      setError(null);

      console.log('✅ Игрок сделал ход:', move.san, 'Новое FEN:', newFen);
      
      // Дополнительная синхронизация для превращения пешки
      if (promotion) {
        console.log('🔄 Превращение пешки завершено в:', promotion.toUpperCase());
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при ходе игрока:', error);
      return false;
    }
  }, [game, playerSide]);

  // Обработчик выбора фигуры превращения
  const handlePromotionSelect = useCallback((promotionPiece) => {
    if (pendingPromotion) {
      console.log('🎯 Игрок выбрал превращение в:', promotionPiece.toUpperCase());
      
      const success = executeMove(
        pendingPromotion.from,
        pendingPromotion.to,
        promotionPiece
      );
      
      if (success) {
        // Очищаем состояние превращения
        setPendingPromotion(null);
        setShowPromotionModal(false);
        console.log('✅ Превращение пешки успешно завершено');
      } else {
        console.error('❌ Ошибка превращения пешки');
        setError('Ошибка при превращении пешки');
      }
    }
  }, [pendingPromotion, executeMove]);

  // Обработчик отмены превращения
  const handlePromotionCancel = useCallback(() => {
    setPendingPromotion(null);
    setShowPromotionModal(false);
  }, []);

  // Обработчик перетаскивания фигур
  const onPieceDrop = useCallback((sourceSquare, targetSquare, piece) => {
    if (isAiThinking || !apiKey || game.isGameOver() || !isPlayerTurn() || showPromotionModal) {
      return false;
    }

    // Проверяем, является ли это превращением пешки
    const movingPiece = game.get(sourceSquare);
    const isPromotion = movingPiece && 
                       movingPiece.type === 'p' && 
                       ((movingPiece.color === 'w' && targetSquare[1] === '8') || 
                        (movingPiece.color === 'b' && targetSquare[1] === '1'));

    if (isPromotion) {
      // Предотвращаем двойное срабатывание
      if (!showPromotionModal && !pendingPromotion) {
        setPendingPromotion({ from: sourceSquare, to: targetSquare });
        setShowPromotionModal(true);
        console.log('🔄 Превращение пешки: показываем модальное окно');
      }
      return false; // Ход еще не выполнен, ждем выбора фигуры
    }

    // Обычный ход (не превращение)
    return executeMove(sourceSquare, targetSquare);
  }, [game, isAiThinking, apiKey, isPlayerTurn, executeMove, showPromotionModal, pendingPromotion]);

  // Обработчик клика по клетке
  const onSquareClick = useCallback((square) => {
    if (isAiThinking || !apiKey || game.isGameOver() || !isPlayerTurn() || showPromotionModal) {
      return;
    }

    // Если уже выбрана клетка и кликнули на другую - пытаемся сделать ход
    if (selectedSquare && selectedSquare !== square) {
      const piece = game.get(selectedSquare);
      if (piece) {
        // Проверяем превращение пешки для клика (как в onPieceDrop)
        const isPromotion = piece && 
                           piece.type === 'p' && 
                           ((piece.color === 'w' && square[1] === '8') || 
                            (piece.color === 'b' && square[1] === '1'));

        if (isPromotion) {
          // Предотвращаем двойное срабатывание - проверяем, что модальное окно еще не показано
          if (!showPromotionModal && !pendingPromotion) {
            setPendingPromotion({ from: selectedSquare, to: square });
            setShowPromotionModal(true);
            setSelectedSquare(null);
            setPossibleMoves([]);
          }
          return;
        }

        // Обычный ход
        const moveSuccess = executeMove(selectedSquare, square);
        if (moveSuccess) {
          return; // Ход сделан
        }
      }
    }

    // Выбираем новую клетку или снимаем выделение
    if (square === selectedSquare) {
      setSelectedSquare(null);
      setPossibleMoves([]);
    } else {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setPossibleMoves(moves.map(move => move.to));
      } else {
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    }
  }, [selectedSquare, game, isAiThinking, apiKey, isPlayerTurn, showPromotionModal, pendingPromotion, executeMove]);

  // Функция смены сторон
  const switchSides = useCallback(() => {
    if (isAiThinking || game.history().length > 0) return; // Нельзя менять стороны во время игры

    const newPlayerSide = playerSide === 'white' ? 'black' : 'white';
    const newAiSide = aiSide === 'white' ? 'black' : 'white';
    
    setPlayerSide(newPlayerSide);
    setAiSide(newAiSide);
    
    console.log(`Стороны поменялись: Игрок - ${newPlayerSide}, AI - ${newAiSide}`);
  }, [playerSide, aiSide, isAiThinking, game]);

  // Функция новой игры
  const startNewGame = useCallback(() => {
    game.reset();
    setFen(game.fen());
    setMoveHistory([]);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setError(null);
    setIsAiThinking(false);
    setAiStrategy('Начинаю партию с фокусом на развитие фигур и контроль центра. План: быстрое развитие, безопасность короля, затем тактические возможности.');
    // Сброс состояния превращения пешки
    setPendingPromotion(null);
    setShowPromotionModal(false);
  }, [game]);

  // Исправленная функция отмены хода с учетом сторон
  const undoMove = useCallback(() => {
    if (isAiThinking || moveHistory.length === 0) return;
    
    const lastMoveInfo = moveHistory[moveHistory.length - 1];
    
    // Отменяем только последний ход
    game.undo();
    
    // Если последний ход был ходом AI и есть еще ходы, отменяем также ход игрока
    if (lastMoveInfo.player === 'AI' && moveHistory.length >= 2) {
      game.undo();
      setMoveHistory(prev => prev.slice(0, -2)); // Убираем 2 хода
    } else {
      setMoveHistory(prev => prev.slice(0, -1)); // Убираем 1 ход
    }
    
    setFen(game.fen());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setError(null);
    
    // Сброс состояния превращения пешки
    setPendingPromotion(null);
    setShowPromotionModal(false);
    
    console.log('✅ Ход отменен. Текущая очередь:', game.turn() === 'w' ? 'белые' : 'черные');
  }, [game, isAiThinking, moveHistory]);

  // Очистка ошибки
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ================ ВОЗВРАЩАЕМЫЙ ОБЪЕКТ ================
  return {
    // Состояние игры
    fen,
    gameStatus,
    isAiThinking,
    error,
    moveHistory,
    aiStrategy,
    
    // UI состояние
    selectedSquare,
    possibleMoves,
    lastMove,
    
    // Стороны
    playerSide,
    aiSide,
    
    // Превращение пешки
    pendingPromotion,
    showPromotionModal,
    
    // Обработчики событий
    onPieceDrop,
    onSquareClick,
    
    // Методы управления игрой
    startNewGame,
    undoMove,
    switchSides,
    clearError,
    
    // Обработчики превращения
    handlePromotionSelect,
    handlePromotionCancel,
    
    // Вычисляемые значения
    isPlayerTurn: isPlayerTurn(),
    isAiTurn: isAiTurn(),
    isGameOver: game.isGameOver(),
    canUndo: moveHistory.length > 0 && !isAiThinking,
    canSwitchSides: !isAiThinking && game.history().length === 0
  };
}

export default useChessGame; 