import { useState, useMemo, useCallback, useEffect } from 'react'
import { Chess } from 'chess.js'
import ChessboardComponent from './components/ChessboardComponent'
import GameInfoPanel from './components/GameInfoPanel'
import ApiKeyModal from './components/ApiKeyModal'
import { getAiMove } from './services/apiService'

// Компонент для выбора фигуры превращения
function PromotionModal({ isOpen, onSelect, onCancel, isWhite }) {
  if (!isOpen) return null;

  const pieces = [
    { type: 'q', name: 'Ферзь', symbol: isWhite ? '♕' : '♛' },
    { type: 'r', name: 'Ладья', symbol: isWhite ? '♖' : '♜' },
    { type: 'b', name: 'Слон', symbol: isWhite ? '♗' : '♝' },
    { type: 'n', name: 'Конь', symbol: isWhite ? '♘' : '♞' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <h3 className="text-xl font-bold mb-4 text-center">Выберите фигуру для превращения</h3>
        <div className="grid grid-cols-2 gap-3">
          {pieces.map((piece) => (
            <button
              key={piece.type}
              onClick={() => onSelect(piece.type)}
              className="flex flex-col items-center p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <span className="text-4xl mb-2">{piece.symbol}</span>
              <span className="text-sm font-medium">{piece.name}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="w-full mt-4 py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}

function App() {
  // Создаем экземпляр игры - это основное состояние шахматной партии
  const game = useMemo(() => new Chess(), []);

  // Состояния React для UI
  const [fen, setFen] = useState(game.fen());
  const [apiKey, setApiKey] = useState(null);
  const [aiStrategy, setAiStrategy] = useState('Начинаю партию с фокусом на развитие фигур и контроль центра. План: быстрое развитие, безопасность короля, затем тактические возможности.');
  const [gameStatus, setGameStatus] = useState('Введите API ключ для начала игры');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [error, setError] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-pro-preview-05-06');
  
  // + Добавляем четкое определение сторон
  const [playerSide, setPlayerSide] = useState('white'); // 'white' или 'black'
  const [aiSide, setAiSide] = useState('black'); // противоположная сторона

  // + Состояния для превращения пешки
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);

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

    // + Улучшенное определение статуса с учетом сторон
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

  // Функция для получения хода от AI
  const makeAiMove = useCallback(async () => {
    if (!apiKey || game.isGameOver() || isAiThinking || !isAiTurn()) return;

    setIsAiThinking(true);
    setError(null);

    try {
      console.log('Запрашиваем ход от AI...');
      
      const response = await getAiMove({
        fen: game.fen(),
        // history: game.pgn(), // Убираем историю - фокус только на текущей позиции
        strategy: aiStrategy,
        model: selectedModel,
        apiKey: apiKey,
        // + Добавляем информацию о стороне AI
        aiSide: aiSide
      });

      console.log('AI ответил:', response);

      // Делаем ход AI
      const move = game.move(response.move);
      
      if (move) {
        setFen(game.fen());
        setMoveHistory(prev => [...prev, {
          move: response.move,
          san: move.san,
          player: 'AI',
          side: aiSide,
          timestamp: Date.now()
        }]);
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
  }, [apiKey, aiStrategy, game, isAiThinking, isAiTurn, aiSide]);

  // + Эффект для автоматического хода AI когда его очередь
  useEffect(() => {
    if (apiKey && !game.isGameOver() && !isAiThinking && isAiTurn()) {
      // Небольшая задержка для лучшего UX
      const timer = setTimeout(() => {
        makeAiMove();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [fen, apiKey, isAiThinking, isAiTurn, makeAiMove]);

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

  // Обработчик хода игрока
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

  // + Функция смены сторон
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

  // + Исправленная функция отмены хода с учетом сторон
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            🎯 Шахматы с AI
          </h1>
          <p className="text-blue-100 text-lg">
            Сразитесь с умным противником на базе Google Gemini
          </p>
        </header>

        {/* Основной игровой интерфейс */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Шахматная доска */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <ChessboardComponent
                fen={fen}
                onPieceDrop={onPieceDrop}
                onSquareClick={onSquareClick}
                selectedSquare={selectedSquare}
                possibleMoves={possibleMoves}
                lastMove={lastMove}
                isDisabled={isAiThinking || !apiKey || game.isGameOver()}
                boardOrientation={playerSide}
              />
              
              {/* Кнопки управления */}
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={startNewGame}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  🔄 Новая игра
                </button>
                <button
                  onClick={undoMove}
                  disabled={isAiThinking || moveHistory.length === 0}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  ↶ Отменить ход
                </button>
                <button
                  onClick={switchSides}
                  disabled={isAiThinking || game.history().length > 0}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  🔄 Поменять стороны
                </button>
                <button
                  onClick={() => setApiKey(null)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  🔑 Сменить ключ
                </button>
              </div>
            </div>
          </div>

          {/* Панель информации */}
          <div className="lg:col-span-1">
            <GameInfoPanel
              gameStatus={gameStatus}
              isAiThinking={isAiThinking}
              aiStrategy={aiStrategy}
              moveHistory={moveHistory}
              error={error}
              onClearError={() => setError(null)}
              playerSide={playerSide}
              aiSide={aiSide}
            />
          </div>
        </div>

        {/* Модальное окно для ввода API ключа */}
        <ApiKeyModal
          isOpen={!apiKey}
          onApiKeySubmit={(key, model) => {
            setApiKey(key);
            if (model) setSelectedModel(model);
            console.log('Выбрана модель:', model);
          }}
        />

        {/* Модальное окно превращения пешки */}
        <PromotionModal
          isOpen={showPromotionModal}
          onSelect={handlePromotionSelect}
          onCancel={handlePromotionCancel}
          isWhite={playerSide === 'white'}
        />
      </div>
    </div>
  );
}

export default App; 