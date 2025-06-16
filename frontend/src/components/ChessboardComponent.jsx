import { Chessboard } from 'react-chessboard'

function ChessboardComponent({
  fen,
  onPieceDrop,
  onSquareClick,
  selectedSquare,
  possibleMoves,
  lastMove,
  isDisabled
}) {
  // Создаем стили для подсветки клеток
  const customSquareStyles = {};

  // Подсвечиваем выбранную клетку
  if (selectedSquare) {
    customSquareStyles[selectedSquare] = {
      backgroundColor: '#20b2aa',
      border: '3px solid #1a9a9a'
    };
  }

  // Подсвечиваем возможные ходы
  possibleMoves.forEach(square => {
    customSquareStyles[square] = {
      background: 'radial-gradient(circle, #9bc53d 25%, transparent 25%)',
      borderRadius: '50%'
    };
  });

  // Подсвечиваем последний ход
  if (lastMove) {
    customSquareStyles[lastMove.from] = {
      ...customSquareStyles[lastMove.from],
      backgroundColor: '#ffffcc',
      border: '2px solid #ffcc00'
    };
    customSquareStyles[lastMove.to] = {
      ...customSquareStyles[lastMove.to],
      backgroundColor: '#ffffcc',
      border: '2px solid #ffcc00'
    };
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Chessboard
        position={fen}
        onPieceDrop={onPieceDrop}
        onSquareClick={onSquareClick}
        arePiecesDraggable={!isDisabled}
        customSquareStyles={customSquareStyles}
        customBoardStyle={{
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
        }}
        customDarkSquareStyle={{
          backgroundColor: '#b58863'
        }}
        customLightSquareStyle={{
          backgroundColor: '#f0d9b5'
        }}
        boardOrientation="white"
        animationDuration={200}
        showBoardNotation={true}
        customNotationStyle={{
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      />
      
      {/* Индикатор состояния доски */}
      {isDisabled && (
        <div className="mt-3 p-3 bg-gray-100 rounded-lg text-center">
          <span className="text-gray-600 font-medium">
            {!fen ? '🔑 Введите API ключ для начала' : '🤖 AI думает...'}
          </span>
        </div>
      )}
    </div>
  );
}

export default ChessboardComponent; 