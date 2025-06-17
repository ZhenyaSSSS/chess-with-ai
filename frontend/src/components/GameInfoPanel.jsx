import { Clock, Brain, History, AlertCircle, X, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { useState } from 'react'

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
  const [showStrategy, setShowStrategy] = useState(false);
  const [expandedMoves, setExpandedMoves] = useState(new Set());

  // Отладочное логирование
  console.log('🎯 GameInfoPanel получил moveHistory:', moveHistory);
  console.log('🎯 AI ходы с reasoning:', moveHistory.filter(m => m.player === 'AI' && m.reasoning));
  
  // Детальный анализ последнего хода AI
  const lastAiMove = moveHistory.filter(m => m.player === 'AI').slice(-1)[0];
  if (lastAiMove) {
    console.log('🎯 Последний ход AI:', {
      san: lastAiMove.san,
      hasReasoning: !!lastAiMove.reasoning,
      reasoning: lastAiMove.reasoning,
      reasoningLength: lastAiMove.reasoning ? lastAiMove.reasoning.length : 0
    });
  }
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

  const toggleMoveExpansion = (index) => {
    const newExpanded = new Set(expandedMoves);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedMoves(newExpanded);
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

      {/* Последнее объяснение AI */}
      {(() => {
        const lastAiMove = moveHistory.filter(m => m.player === 'AI' && m.reasoning).slice(-1)[0];
        return lastAiMove && (
          <div className="bg-purple-50 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <MessageSquare className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="font-semibold text-purple-900">Последнее объяснение AI</h3>
              <span className="ml-2 text-xs text-purple-600 bg-purple-200 px-2 py-1 rounded-full">
                {lastAiMove.san}
              </span>
            </div>
            <p className="text-purple-800 text-sm leading-relaxed">
              {lastAiMove.reasoning}
            </p>
          </div>
        );
      })()}

      {/* Стратегия AI */}
      <div className="bg-blue-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Brain className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-blue-900">Стратегия AI</h3>
          </div>
          <button
            onClick={() => setShowStrategy(!showStrategy)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showStrategy ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        {showStrategy && (
          <p className="text-blue-800 text-sm leading-relaxed">
            {isAiThinking ? (
              <span className="animate-pulse">🤔 Размышляю над следующим ходом...</span>
            ) : (
              aiStrategy
            )}
          </p>
        )}
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
              <div key={index} className="bg-white rounded-lg text-sm">
                <div className="flex items-center justify-between p-2">
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
                    {move.player === 'AI' && move.reasoning && (
                      <button
                        onClick={() => toggleMoveExpansion(index)}
                        className="text-blue-500 hover:text-blue-700 mr-2"
                        title="Показать объяснение"
                      >
                        <MessageSquare className="h-3 w-3" />
                      </button>
                    )}
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(move.timestamp)}
                  </div>
                </div>
                
                {/* Объяснение хода AI */}
                {move.player === 'AI' && move.reasoning && expandedMoves.has(index) && (
                  <div className="px-2 pb-2">
                    <div className="bg-purple-50 border-l-4 border-purple-200 p-3 rounded-r-lg">
                      <div className="flex items-start">
                        <MessageSquare className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-purple-800">
                          <div className="font-medium mb-1">💭 Объяснение AI:</div>
                          <div className="leading-relaxed">{move.reasoning}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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