import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Компонент для перехвата и обработки ошибок React
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Обновляем состояние, чтобы показать UI ошибки
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Сохраняем детали ошибки
    this.setState({
      error,
      errorInfo
    });

    // Логируем ошибку в консоль
    console.error('ErrorBoundary перехватил ошибку:', error, errorInfo);

    // Здесь можно отправить ошибку в сервис мониторинга
    // reportError(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI в случае ошибки
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-600 to-pink-700 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Что-то пошло не так
              </h1>
              <p className="text-gray-600">
                Произошла неожиданная ошибка в приложении. Приносим извинения за неудобства.
              </p>
            </div>

            {/* Детали ошибки (только в dev режиме) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Детали ошибки:</h3>
                <code className="text-sm text-red-600 break-all">
                  {this.state.error.toString()}
                </code>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Кнопки действий */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Попробовать снова
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Перезагрузить страницу
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                На главную
              </button>
            </div>

            {/* Дополнительная информация */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Если проблема повторяется, попробуйте:
              </p>
              <ul className="text-sm text-gray-500 mt-2 space-y-1">
                <li>• Очистить кэш браузера</li>
                <li>• Проверить подключение к интернету</li>
                <li>• Обновить браузер</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    // Если ошибки нет, рендерим дочерние компоненты как обычно
    return this.props.children;
  }
}

export default ErrorBoundary; 