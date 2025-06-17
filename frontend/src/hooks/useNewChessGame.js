import { useState, useMemo, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import gameService from '../services/gameService';

/**
 * Новый хук для управления шахматной игрой через GameManager API
 * @param {string} apiKey - API ключ для взаимодействия с AI
 * @param {string} selectedModel - Выбранная модель AI
 * @returns {Object} Состояние и методы игры
 */
export function useNewChessGame(apiKey, selectedModel = 'gemini-2.5-pro-preview-05-06') {
  // Создаем экземпляр игры Chess.js
  const game = useMemo(() => new Chess(), []);

  // ================ СОСТОЯНИЯ ================
  const [sessionId, setSessionId] = useState(null);
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

  // Создание игровой сессии при инициализации
  useEffect(() => {
    if (apiKey && !sessionId) {
      createNewGameSession();
    }
  }, [apiKey]);

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
    if (apiKey && sessionId && !game.isGameOver() && !isAiThinking && isAiTurn()) {
      // Небольшая задержка для лучшего UX
      const timer = setTimeout(() => {
        makeAiMove();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [fen, apiKey, sessionId, isAiThinking, isAiTurn]);

  // ================ МЕТОДЫ ================

  // Создание новой игровой сессии
  const createNewGameSession = useCallback(async () => {
    if (!apiKey) return;

    try {
      console.log('🎮 Создаем новую игровую сессию...');
      const session = await gameService.createGameSession('chess', {
        players: playerSide === 'white' ? ['human', 'ai'] : ['ai', 'human']
      });
      
      setSessionId(session.sessionId);
      console.log('✅ Игровая сессия создана:', session.sessionId);
    } catch (error) {
      console.error('❌ Ошибка создания игровой сессии:', error);
      setError(`Ошибка создания игры: ${error.message}`);
    }
  }, [apiKey, playerSide]);

  // Функция для получения хода от AI
  const makeAiMove = useCallback(async () => {
    if (!apiKey || !sessionId || game.isGameOver() || isAiThinking || !isAiTurn()) return;

    setIsAiThinking(true);
    setError(null);

    try {
      console.log('🤖 Запрашиваем ход от AI через новый API...');
      
      let response;
      try {
        // Пытаемся использовать новый API
        response = await gameService.getAIMove(sessionId, {
          apiKey: apiKey,
          model: selectedModel,
          strategy: aiStrategy,
          aiSide: aiSide
        });
      } catch (newApiError) {
        console.warn('⚠️ Новый API не работает, fallback на старый:', newApiError.message);
        
        // Fallback на старый API
        const legacyResponse = await fetch('/api/get-ai-move', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fen: game.fen(),
            apiKey: apiKey,
            model: selectedModel,
            strategy: aiStrategy,
            aiSide: aiSide
          })
        });
        
        if (!legacyResponse.ok) {
          throw new Error(`HTTP ${legacyResponse.status}: ${legacyResponse.statusText}`);
        }
        
        response = await legacyResponse.json();
      }

      console.log('🎯 AI ответил:', response);

      // Делаем ход AI в локальной игре
      const move = game.move(response.move);
      
      if (move) {
        setFen(game.fen());
        setMoveHistory(prev => [...prev, {
          move: response.move,
          san: move.san,
          player: 'AI',
          side: aiSide,
          timestamp: Date.now(),
          reasoning: response.reasoning || null, // Объяснение хода
          newStrategy: response.newStrategy || null // Новая стратегия
        }]);
        setLastMove({ from: move.from, to: move.to });
        
        // Обновляем стратегию если AI предоставил новую
        if (response.newStrategy) {
          setAiStrategy(response.newStrategy);
        }
        
        console.log('✅ AI сделал ход:', response.move);
      } else {
        throw new Error('Невалидный ход от AI: ' + response.move);
      }

    } catch (error) {
      console.error('❌ Ошибка при получении хода AI:', error);
      setError(`Ошибка AI: ${error.message}`);
    } finally {
      setIsAiThinking(false);
    }
  }, [apiKey, sessionId, aiStrategy, game, isAiThinking, isAiTurn, aiSide, selectedModel]);

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
        timestamp: Date.now(),
        reasoning: null, // У игрока нет объяснения
        newStrategy: null
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
    
    // Пересоздаем сессию с новыми сторонами
    setSessionId(null);
    
    console.log(`Стороны поменялись: Игрок - ${newPlayerSide}, AI - ${newAiSide}`);
  }, [playerSide, aiSide, isAiThinking, game]);

  // Функция новой игры
  const startNewGame = useCallback(() => {
    // Удаляем старую сессию
    if (sessionId) {
      gameService.deleteGameSession(sessionId).catch(console.error);
    }

    // Сбрасываем локальное состояние
    game.reset();
    setFen(game.fen());
    setMoveHistory([]);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setError(null);
    setIsAiThinking(false);
    setPendingPromotion(null);
    setShowPromotionModal(false);
    setSessionId(null);
    
    // Сбрасываем стратегию
    setAiStrategy('Начинаю партию с фокусом на развитие фигур и контроль центра. План: быстрое развитие, безопасность короля, затем тактические возможности.');
    
    console.log('🔄 Новая игра начата');
  }, [game, sessionId]);

  // Функция отмены хода
  const undoMove = useCallback(() => {
    if (isAiThinking || moveHistory.length === 0) return;

    // Отменяем последние 2 хода (игрок + AI) или 1 ход если это был ход игрока
    const movesToUndo = moveHistory[moveHistory.length - 1].player === 'AI' ? 2 : 1;
    
    for (let i = 0; i < movesToUndo && game.history().length > 0; i++) {
      game.undo();
    }
    
    setFen(game.fen());
    setMoveHistory(prev => prev.slice(0, -movesToUndo));
    setLastMove(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setError(null);
    
    console.log(`↶ Отменено ходов: ${movesToUndo}`);
  }, [game, moveHistory, isAiThinking]);

  // Функция очистки ошибки
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ================ ВЫЧИСЛЯЕМЫЕ СВОЙСТВА ================
  const isGameOver = game.isGameOver();
  const canUndo = moveHistory.length > 0 && !isAiThinking;
  const canSwitchSides = game.history().length === 0 && !isAiThinking;

  // ================ ВОЗВРАЩАЕМЫЙ ОБЪЕКТ ================
  return {
    // Состояние игры
    fen,
    gameStatus,
    isAiThinking,
    error,
    moveHistory,
    aiStrategy,
    sessionId,
    
    // UI состояния
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
    
    // Управление игрой
    startNewGame,
    undoMove,
    switchSides,
    clearError,
    
    // Обработчики превращения
    handlePromotionSelect,
    handlePromotionCancel,
    
    // Вычисляемые значения
    isGameOver,
    canUndo,
    canSwitchSides
  };
} 