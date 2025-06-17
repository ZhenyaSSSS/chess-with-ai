import React, { useState } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useNewChessGame } from '../../../hooks/useNewChessGame';
import ChessboardComponent from '../../ChessboardComponent';
import GameInfoPanel from '../../GameInfoPanel';
import ApiKeyModal from '../../ApiKeyModal';
import PromotionModal from './PromotionModal';
import DebugConsole from '../../DebugConsole';
import gameService from '../../../services/gameService';

/**
 * Основной компонент шахматной игры
 * Объединяет всю логику и UI для игры в шахматы с AI
 */
function ChessGame() {
  const { 
    apiKey, 
    selectedModel, 
    setApiKey, 
    setSelectedModel 
  } = useSettings();

  // Состояние отладки
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [debugMode, setDebugMode] = useState(false);

  // Используем кастомный хук для шахматной логики
  const {
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
    isGameOver,
    canUndo,
    canSwitchSides
  } = useNewChessGame(apiKey, selectedModel);

  // Обработчики отладки
  const handleToggleDebug = async () => {
    try {
      const newMode = !debugMode;
      await gameService.toggleDebugMode(newMode);
      setDebugMode(newMode);
      
      if (newMode) {
        // Загружаем существующие логи
        const logs = await gameService.getDebugLogs();
        setDebugLogs(logs);
        setShowDebugConsole(true);
      }
    } catch (error) {
      console.error('Ошибка переключения режима отладки:', error);
    }
  };

  const handleShowDebugConsole = async () => {
    try {
      const logs = await gameService.getDebugLogs();
      setDebugLogs(logs);
      setShowDebugConsole(true);
    } catch (error) {
      console.error('Ошибка загрузки логов отладки:', error);
    }
  };

  const handleClearDebugLogs = async () => {
    try {
      await gameService.clearDebugLogs();
      setDebugLogs([]);
    } catch (error) {
      console.error('Ошибка очистки логов:', error);
    }
  };

  // Периодическое обновление логов когда консоль открыта
  React.useEffect(() => {
    if (showDebugConsole && debugMode) {
      const interval = setInterval(async () => {
        try {
          const logs = await gameService.getDebugLogs();
          setDebugLogs(logs);
        } catch (error) {
          console.error('Ошибка обновления логов:', error);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [showDebugConsole, debugMode]);

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

              {/* Кнопки отладки */}
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={handleToggleDebug}
                  className={`flex-1 font-semibold py-2 px-4 rounded-lg transition-colors ${
                    debugMode 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  🐛 {debugMode ? 'Выключить отладку' : 'Включить отладку'}
                </button>
                <button
                  onClick={handleShowDebugConsole}
                  disabled={!apiKey}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  📋 Консоль отладки
                </button>
                {debugLogs.length > 0 && (
                  <button
                    onClick={handleClearDebugLogs}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    🧹 Очистить логи ({debugLogs.length})
                  </button>
                )}
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
          isOpen={showDebugConsole}
          onClose={() => setShowDebugConsole(false)}
          debugLogs={debugLogs}
        />
      </div>
    </div>
  );
}

export default ChessGame; 