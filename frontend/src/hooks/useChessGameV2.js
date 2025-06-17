import { useState, useMemo, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { getAiMove } from '../services/apiService';

/**
 * НОВАЯ, ИСПРАВЛЕННАЯ ВЕРСИЯ ХУКА.
 * Решает проблему с lastAiMove: undefined путем правильной передачи истории ходов.
 * @param {string} apiKey - API ключ для взаимодействия с AI
 * @param {string} selectedModel - Выбранная модель AI
 */
export function useChessGameV2(apiKey, selectedModel) {
  const game = useMemo(() => new Chess(), []);

  // --- СОСТОЯНИЯ ---
  const [fen, setFen] = useState(game.fen());
  const [aiStrategy, setAiStrategy] = useState('Начинаю партию с фокусом на развитие фигур и контроль центра.');
  const [gameStatus, setGameStatus] = useState('Введите API ключ для начала игры');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [error, setError] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  
  const [playerSide, setPlayerSide] = useState('white');
  const [aiSide, setAiSide] = useState('black');

  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);

  // --- ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ ---
  const isPlayerTurn = useCallback(() => game.turn() === (playerSide === 'white' ? 'w' : 'b'), [game, playerSide]);
  const isAiTurn = useCallback(() => game.turn() === (aiSide === 'white' ? 'w' : 'b'), [game, aiSide]);

  // --- ЭФФЕКТЫ ---
  useEffect(() => {
    if (!apiKey) {
      setGameStatus('Введите API ключ для начала игры');
      return;
    }
    if (isAiThinking) {
      setGameStatus('AI думает...');
      return;
    }
    if (game.isGameOver()) {
      if (game.isCheckmate()) setGameStatus(`Мат! ${game.turn() === 'w' ? 'Черные' : 'Белые'} выиграли!`);
      else if (game.isDraw()) setGameStatus('Ничья!');
      else setGameStatus('Пат! Ничья.');
      return;
    }
    const turn = game.turn() === 'w' ? 'Белые' : 'Черные';
    const check = game.inCheck() ? ' - ШАХ!' : '';
    setGameStatus(`${turn} ходят (${isPlayerTurn() ? 'ВЫ' : 'AI'})${check}`);
  }, [fen, apiKey, isAiThinking, game, isPlayerTurn]);

  // --- ОСНОВНЫЕ МЕТОДЫ ---
  const makeAiMove = useCallback(async (currentHistory) => {
    if (!apiKey || game.isGameOver() || isAiThinking || !isAiTurn()) return;

    setIsAiThinking(true);
    setError(null);
    try {
      const lastAiMove = [...currentHistory].reverse().find(move => move.player === 'AI');
      const lastPlayerMove = [...currentHistory].reverse().find(move => move.player === 'Player');
      
      const response = await getAiMove({
        fen: game.fen(),
        strategy: aiStrategy,
        model: selectedModel,
        apiKey: apiKey,
        aiSide: aiSide,
        lastAiMove: lastAiMove ? { move: lastAiMove.move, san: lastAiMove.san, reasoning: lastAiMove.reasoning } : null,
        lastPlayerMove: lastPlayerMove ? { move: lastPlayerMove.move, san: lastPlayerMove.san } : null
      });

      const move = game.move(response.move);
      if (!move) throw new Error('Невалидный ход от AI: ' + response.move);
      
      const moveData = {
        ...response,
        player: 'AI',
        side: aiSide,
        san: move.san,
        timestamp: Date.now(),
      };
      
      setFen(game.fen());
      setMoveHistory(prev => [...prev, moveData]);
      setLastMove({ from: move.from, to: move.to });
      if (response.newStrategy) setAiStrategy(response.newStrategy);

    } catch (err) {
      console.error('[makeAiMove] Ошибка:', err);
      setError(`Ошибка AI: ${err.message}`);
    } finally {
      setIsAiThinking(false);
    }
  }, [apiKey, aiStrategy, game, selectedModel, aiSide, isAiTurn]);

  const executeMove = useCallback((from, to, promotion) => {
    try {
      const move = game.move({ from, to, promotion });
      if (move === null) return false;

      const newHistory = [
          ...moveHistory, 
          { move: `${from}${to}${promotion || ''}`, san: move.san, player: 'Player', side: playerSide, timestamp: Date.now() }
      ];
      
      setFen(game.fen());
      setMoveHistory(newHistory);
      setLastMove({ from: move.from, to: move.to });
      setSelectedSquare(null);
      setPossibleMoves([]);
      setError(null);
      
      if (!game.isGameOver()) {
        setTimeout(() => makeAiMove(newHistory), 300);
      }
      return true;
    } catch (err) {
      setError(`Ошибка при вашем ходе: ${err.message}`);
      return false;
    }
  }, [game, playerSide, moveHistory, makeAiMove]);

  // --- ОБРАБОТЧИКИ UI ---
  const handlePromotion = useCallback((piece) => {
    if (pendingPromotion) {
      executeMove(pendingPromotion.from, pendingPromotion.to, piece);
      setShowPromotionModal(false);
      setPendingPromotion(null);
    }
  }, [pendingPromotion, executeMove]);

  const onSquareClick = useCallback((square) => {
    if (isAiThinking || !isPlayerTurn()) return;
    if (pendingPromotion) {
      setShowPromotionModal(true);
      return;
    }
    if (!selectedSquare) {
      const moves = game.moves({ square, verbose: true });
      if (moves.length > 0) {
        setSelectedSquare(square);
        setPossibleMoves(moves.map(m => m.to));
      }
    } else {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }
      const move = game.moves({ square: selectedSquare, verbose: true }).find(m => m.to === square);
      if (move) {
        if ((move.piece === 'p' && (move.to.endsWith('8') || move.to.endsWith('1')))) {
          setPendingPromotion({ from: selectedSquare, to: square, move });
          setShowPromotionModal(true);
        } else {
          executeMove(selectedSquare, square);
        }
      } else {
        const newMoves = game.moves({ square, verbose: true });
        setSelectedSquare(square);
        setPossibleMoves(newMoves.map(m => m.to));
      }
    }
  }, [selectedSquare, isAiThinking, isPlayerTurn, game, pendingPromotion, executeMove]);

  // --- УПРАВЛЕНИЕ ИГРОЙ ---
  const resetGame = useCallback(() => {
    game.reset();
    setFen(game.fen());
    setMoveHistory([]);
    setError(null);
    setGameStatus('Новая игра!');
    setLastMove(null);
    setAiStrategy('Начинаю партию с фокусом на развитие фигур и контроль центра.');
    setIsAiThinking(false);
    setSelectedSquare(null);
    setPossibleMoves([]);
  }, [game]);

  const changeSides = useCallback(() => {
    if (moveHistory.length > 0) return;
    const newPlayerSide = playerSide === 'white' ? 'black' : 'white';
    setPlayerSide(newPlayerSide);
    setAiSide(newPlayerSide === 'white' ? 'black' : 'white');
    resetGame();
    if (newPlayerSide === 'black') {
        setTimeout(() => makeAiMove([]), 500);
    }
  }, [playerSide, resetGame, moveHistory, makeAiMove]);

  const undoMove = useCallback(() => {
    if (isAiThinking || moveHistory.length === 0) return;
    game.undo();
    if (moveHistory[moveHistory.length - 1]?.player === 'AI') game.undo();
    setMoveHistory(prev => prev.slice(0, prev.length >= 2 && prev[prev.length-1]?.player === 'AI' ? -2 : -1));
    setFen(game.fen());
    setLastMove(null);
    setError(null);
  }, [game, isAiThinking, moveHistory]);

  return {
    game, fen, gameStatus, isAiThinking, error, moveHistory, selectedSquare,
    possibleMoves, lastMove, playerSide, aiSide, showPromotionModal,
    onSquareClick, handlePromotion, resetGame, changeSides, undoMove
  };
} 