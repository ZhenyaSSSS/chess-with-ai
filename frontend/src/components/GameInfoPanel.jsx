import { Clock, Brain, History, AlertCircle, X } from 'lucide-react'

function GameInfoPanel({ 
  gameStatus, 
  isAiThinking, 
  aiStrategy, 
  moveHistory, 
  error, 
  onClearError,
  playerSide = 'white',
  aiSide = 'black'
}) {
  const getStatusIcon = () => {
    if (isAiThinking) return '🤖';
    if (gameStatus.includes('Мат')) return '🏆';
    if (gameStatus.includes('Ничья') || gameStatus.includes('Пат')) return '🤝';
    if (gameStatus.includes('ШАХ')) return '⚔️';
    return '♟️';
  };

  const getStatusClass = () => {
    if (isAiThinking) return 'status-thinking';
    if (gameStatus.includes('Мат')) return 'status-game-over';
    if (gameStatus.includes('ШАХ')) return 'status-check';
    return 'status-your-turn';
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-6">
      {/* Информация о сторонах */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 mb-3 text-center">⚔️ Стороны</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl mb-1">👤</div>
            <div className="font-medium text-green-700">Вы</div>
            <div className="text-sm text-gray-600 capitalize">
              {playerSide === 'white' ? '♔ Белые' : '♚ Черные'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🤖</div>
            <div className="font-medium text-purple-700">AI</div>
            <div className="text-sm text-gray-600 capitalize">
              {aiSide === 'white' ? '♔ Белые' : '♚ Черные'}
            </div>
          </div>
        </div>
      </div>

      {/* Статус игры */}
      <div className="text-center">
        <div className={`game-status-indicator ${getStatusClass()} text-lg`}>
          <span className="mr-2">{getStatusIcon()}</span>
          {gameStatus}
        </div>
      </div>

      {/* Ошибки */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg animate-slide-in">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={onClearError}
              className="ml-2 text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Стратегия AI */}
      <div className="bg-blue-50 rounded-xl p-4">
        <div className="flex items-center mb-3">
          <Brain className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="font-semibold text-blue-900">Стратегия AI</h3>
        </div>
        <p className="text-blue-800 text-sm leading-relaxed">
          {isAiThinking ? (
            <span className="animate-pulse">🤔 Размышляю над следующим ходом...</span>
          ) : (
            aiStrategy
          )}
        </p>
      </div>

      {/* История ходов */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center mb-3">
          <History className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="font-semibold text-gray-900">История ходов</h3>
          <span className="ml-auto bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
            {moveHistory.length}
          </span>
        </div>
        
        <div className="max-h-64 overflow-y-auto space-y-2">
          {moveHistory.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              Партия еще не началась
            </p>
          ) : (
            moveHistory.map((move, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white rounded-lg text-sm"
              >
                <div className="flex items-center">
                  <span className="font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs mr-3">
                    {Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'}
                  </span>
                  <span className="font-medium">
                    {move.san}
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <span className={`px-2 py-1 rounded-full mr-2 ${
                    move.player === 'AI' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {move.player === 'AI' ? '🤖' : '👤'}
                  </span>
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(move.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-700">
            {moveHistory.filter(m => m.player === 'Человек').length}
          </div>
          <div className="text-sm text-green-600">Ваши ходы</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-700">
            {moveHistory.filter(m => m.player === 'AI').length}
          </div>
          <div className="text-sm text-purple-600">Ходы AI</div>
        </div>
      </div>

      {/* Подсказки */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <h4 className="font-medium text-yellow-800 mb-2">💡 Подсказки</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Кликните на фигуру, затем на клетку назначения</li>
          <li>• Или перетащите фигуру на новое место</li>
          <li>• Зеленые точки показывают возможные ходы</li>
          <li>• Желтые клетки показывают последний ход</li>
        </ul>
      </div>
    </div>
  );
}

export default GameInfoPanel; 