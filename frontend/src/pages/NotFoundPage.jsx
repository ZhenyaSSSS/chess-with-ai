import { Link } from 'react-router-dom';
import { Home, ArrowLeft, AlertCircle } from 'lucide-react';

/**
 * Страница 404 - не найдено
 */
function NotFoundPage() {
  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        
        {/* Основной контент */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <AlertCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
          
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Страница не найдена
          </h2>
          <p className="text-blue-100 mb-8 leading-relaxed">
            К сожалению, запрашиваемая страница не существует или была перемещена.
          </p>

          {/* Кнопки навигации */}
          <div className="flex flex-col gap-3">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              На главную
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </button>
          </div>

          {/* Дополнительная информация */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <p className="text-blue-200 text-sm">
              Если вы считаете, что это ошибка, пожалуйста, сообщите нам
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage; 