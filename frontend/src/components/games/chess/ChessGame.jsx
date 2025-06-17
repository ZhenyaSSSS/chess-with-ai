import React, { useState } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import useChessGame from '../../../hooks/useChessGame';
import ChessboardComponent from '../../ChessboardComponent';
import GameInfoPanel from '../../GameInfoPanel';
import ApiKeyModal from '../../ApiKeyModal';
import PromotionModal from './PromotionModal';
import DebugConsole from '../../DebugConsole';

/**
 * Основной компонент шахматной игры
 */
function ChessGame() {
  const { 
    apiKey, 
    selectedModel, 
    setApiKey, 
    setSelectedModel 
  } = useSettings();

  const [showDebugConsole, setShowDebugConsole] = useState(false);

  // Используем старый, стабильный хук для шахматной логики
  const {
    fen,
    gameStatus,
    isAiThinking,
    error,
    moveHistory,
    aiStrategy,
    selectedSquare,
    possibleMoves,
    lastMove,
    playerSide,
    aiSide,
    showPromotionModal,
    onPieceDrop,
    onSquareClick,
    startNewGame,
    undoMove,
    switchSides,
    clearError,
    handlePromotionSelect,
    handlePromotionCancel,
    isGameOver,
    canUndo,
    canSwitchSides
  } = useChessGame(apiKey, selectedModel);

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
                isDisabled={isAiThinking || !apiKey || isGameOver}
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
                  disabled={!canUndo}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  ↶ Отменить ход
                </button>
                <button
                  onClick={switchSides}
                  disabled={!canSwitchSides}
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
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={() => setShowDebugConsole(true)}
                  disabled={!apiKey}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  🐛 Консоль Отладки
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
              onClearError={clearError}
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

        {/* Консоль отладки */}
        <DebugConsole
          isVisible={showDebugConsole}
          onClose={() => setShowDebugConsole(false)}
        />
      </div>
    </div>
  );
}

export default ChessGame; 