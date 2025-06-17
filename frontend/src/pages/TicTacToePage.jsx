import { Link } from 'react-router-dom';
import { ArrowLeft, Grid3X3 } from 'lucide-react';

/**
 * Страница крестиков-ноликов (временная заглушка)
 */
function TicTacToePage() {
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Навигация */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-white hover:text-blue-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к играм
          </Link>
        </div>

        {/* Временная заглушка */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
          <Grid3X3 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">
            ⭕ Крестики-нолики
          </h1>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Классическая игра крестики-нолики против AI. 
            Эта страница будет реализована в следующих этапах рефакторинга.
          </p>
          
          {/* Планируемые функции */}
          <div className="bg-green-600/20 rounded-lg p-4 mb-6">
            <h3 className="text-white font-semibold mb-2">Планируемые функции:</h3>
            <ul className="text-green-200 text-sm space-y-1">
              <li>🎯 Простой клик-интерфейс</li>
              <li>🤖 Умный AI противник</li>
              <li>📊 Статистика игр</li>
              <li>⚙️ Настройки сложности</li>
              <li>🏆 Система достижений</li>
            </ul>
          </div>

          {/* Информация о разработке */}
          <div className="bg-blue-600/20 rounded-lg p-4">
            <p className="text-blue-200 text-sm">
              🚀 Эта игра будет добавлена после завершения миграции шахмат
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicTacToePage; 