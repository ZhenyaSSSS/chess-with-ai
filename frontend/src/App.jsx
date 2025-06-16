import { useState, useMemo, useCallback, useEffect } from 'react'
import { Chess } from 'chess.js'
import ChessboardComponent from './components/ChessboardComponent'
import GameInfoPanel from './components/GameInfoPanel'
import ApiKeyModal from './components/ApiKeyModal'
import { getAiMove } from './services/apiService'

function App() {
  // Создаем экземпляр игры - это основное состояние шахматной партии
  const game = useMemo(() => new Chess(), []);

  // Состояния React для UI
  const [fen, setFen] = useState(game.fen());
  const [apiKey, setApiKey] = useState(null);
  const [aiStrategy, setAiStrategy] = useState('Играю стратегически, чтобы выиграть партию.');
  const [gameStatus, setGameStatus] = useState('Введите API ключ для начала игры');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [error, setError] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-pro-preview-05-06');

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

    const turn = game.turn() === 'w' ? 'Белые' : 'Черные';
    const isCheck = game.inCheck();
    
    if (isCheck) {
      setGameStatus(`${turn} ходят - ШАХ!`);
    } else {
      setGameStatus(`${turn} ходят`);
    }
  }, [fen, apiKey, isAiThinking, game]);

  // Функция для получения хода от AI
  const makeAiMove = useCallback(async () => {
    if (!apiKey || game.isGameOver() || isAiThinking) return;

    setIsAiThinking(true);
    setError(null);

    try {
      console.log('Запрашиваем ход от AI...');
      
      const response = await getAiMove({
        fen: game.fen(),
        history: game.pgn(),
        strategy: aiStrategy,
        model: selectedModel,
        apiKey: apiKey
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
  }, [apiKey, aiStrategy, game, isAiThinking]);

  // Обработчик хода игрока
  const onPieceDrop = useCallback((sourceSquare, targetSquare, piece) => {
    if (isAiThinking || !apiKey || game.isGameOver()) {
      return false;
    }

    try {
      // Определяем тип превращения пешки (по умолчанию - ферзь)
      const promotion = piece[1].toLowerCase() === 'p' && 
                      (targetSquare[1] === '8' || targetSquare[1] === '1') ? 'q' : undefined;

      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: promotion
      });

      if (move === null) {
        // Невалидный ход
        return false;
      }

      // Ход валидный - обновляем состояние
      setFen(game.fen());
      setMoveHistory(prev => [...prev, {
        move: `${sourceSquare}${targetSquare}`,
        san: move.san,
        player: 'Человек',
        timestamp: Date.now()
      }]);
      setLastMove({ from: sourceSquare, to: targetSquare });
      setSelectedSquare(null);
      setPossibleMoves([]);
      setError(null);

      console.log('✅ Игрок сделал ход:', move.san);

      // Если игра не окончена, запрашиваем ход AI
      if (!game.isGameOver()) {
        // Небольшая задержка для лучшего UX
        setTimeout(() => {
          makeAiMove();
        }, 300);
      }

      return true;
    } catch (error) {
      console.error('Ошибка при ходе игрока:', error);
      return false;
    }
  }, [game, isAiThinking, apiKey, makeAiMove]);

  // Обработчик клика по клетке
  const onSquareClick = useCallback((square) => {
    if (isAiThinking || !apiKey || game.isGameOver()) {
      return;
    }

    // Если уже выбрана клетка и кликнули на другую - пытаемся сделать ход
    if (selectedSquare && selectedSquare !== square) {
      const moveAttempted = onPieceDrop(selectedSquare, square, 
        game.get(selectedSquare)?.type + game.get(selectedSquare)?.color || 'p'
      );
      
      if (moveAttempted) {
        return; // Ход сделан
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
  }, [selectedSquare, onPieceDrop, game, isAiThinking, apiKey]);

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
    setAiStrategy('Играю стратегически, чтобы выиграть партию.');
  }, [game]);

  // Функция отмены хода
  const undoMove = useCallback(() => {
    if (isAiThinking || moveHistory.length < 2) return;
    
    // Отменяем 2 хода (игрока и AI)
    game.undo(); // AI ход
    game.undo(); // Ход игрока
    
    setFen(game.fen());
    setMoveHistory(prev => prev.slice(0, -2));
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setError(null);
  }, [game, isAiThinking, moveHistory.length]);

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
                  disabled={isAiThinking || moveHistory.length < 2}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  ↶ Отменить ход
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
      </div>
    </div>
  );
}

export default App; 