import React from 'react';

/**
 * Модальное окно для выбора фигуры превращения пешки
 * @param {boolean} isOpen - Открыто ли модальное окно
 * @param {function} onSelect - Функция выбора фигуры (type) => void
 * @param {function} onCancel - Функция отмены
 * @param {boolean} isWhite - Является ли превращающаяся пешка белой
 */
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
        <h3 className="text-xl font-bold mb-4 text-center">
          Выберите фигуру для превращения
        </h3>
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

export default PromotionModal; 