import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Copy, Trash2, Download, RefreshCw } from 'lucide-react';

/**
 * Консоль отладки для мониторинга взаимодействия с AI
 */
function DebugConsole({ isOpen, onClose, debugLogs = [], onRefresh, onClear }) {
  const [filter, setFilter] = useState('all'); // all, prompts, responses, errors
  const consoleRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Автопрокрутка при новых логах
  useEffect(() => {
    if (autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [debugLogs, autoScroll]);

  if (!isOpen) return null;

  // Фильтрация логов
  const filteredLogs = debugLogs.filter(log => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  // Копирование логов в буфер обмена
  const copyLogs = () => {
    const text = filteredLogs.map(log => 
      `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`
    ).join('\n');
    navigator.clipboard.writeText(text);
  };

  // Экспорт логов в файл
  const exportLogs = () => {
    const text = filteredLogs.map(log => 
      `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`
    ).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-debug-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Форматирование сообщения для отображения
  const formatMessage = (log) => {
    if (log.type === 'prompt') {
      return (
        <div className="bg-blue-900/20 border-l-4 border-blue-400 p-3 rounded">
          <div className="text-blue-300 font-semibold mb-1">📤 ПРОМПТ → AI</div>
          <pre className="text-blue-100 text-sm whitespace-pre-wrap font-mono">
            {log.message}
          </pre>
          {log.model && (
            <div className="text-blue-400 text-xs mt-2">
              Модель: {log.model} | API: {log.apiVersion}
            </div>
          )}
        </div>
      );
    }

    if (log.type === 'response') {
      return (
        <div className="bg-green-900/20 border-l-4 border-green-400 p-3 rounded">
          <div className="text-green-300 font-semibold mb-1">📥 ОТВЕТ ← AI</div>
          <pre className="text-green-100 text-sm whitespace-pre-wrap font-mono">
            {log.message || '(Пустой ответ)'}
          </pre>
          {log.attempt && (
            <div className="text-green-400 text-xs mt-2">
              Попытка: {log.attempt} | Время: {log.duration}ms
            </div>
          )}
        </div>
      );
    }

    if (log.type === 'error') {
      return (
        <div className="bg-red-900/20 border-l-4 border-red-400 p-3 rounded">
          <div className="text-red-300 font-semibold mb-1">❌ ОШИБКА</div>
          <pre className="text-red-100 text-sm whitespace-pre-wrap font-mono">
            {log.message}
          </pre>
          {log.attempt && (
            <div className="text-red-400 text-xs mt-2">
              Попытка: {log.attempt}
            </div>
          )}
        </div>
      );
    }

    // Обычное сообщение
    return (
      <div className="bg-gray-800/20 border-l-4 border-gray-400 p-3 rounded">
        <div className="text-gray-300 font-semibold mb-1">ℹ️ ИНФО</div>
        <pre className="text-gray-100 text-sm whitespace-pre-wrap font-mono">
          {log.message}
        </pre>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">🐛 Консоль отладки AI</h2>
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
              {filteredLogs.length} записей
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Фильтры */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1 text-sm"
            >
              <option value="all">Все записи</option>
              <option value="prompt">Только промпты</option>
              <option value="response">Только ответы</option>
              <option value="error">Только ошибки</option>
            </select>

            {/* Автопрокрутка */}
            <label className="flex items-center gap-2 text-white text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              Автопрокрутка
            </label>

            {/* Кнопки действий */}
            <button
              onClick={copyLogs}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Копировать логи"
            >
              <Copy className="w-4 h-4" />
            </button>
            
            <button
              onClick={exportLogs}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Экспортировать логи"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={onRefresh}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors"
              title="Обновить логи"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <button
              onClick={onClear}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors"
              title="Очистить логи"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Содержимое консоли */}
        <div 
          ref={consoleRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-950/50"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Логи отладки пока пусты</p>
              <p className="text-sm">Сделайте ход AI чтобы увидеть процесс общения</p>
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div key={index} className="animate-fade-in">
                <div className="text-xs text-gray-500 mb-1">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                {formatMessage(log)}
              </div>
            ))
          )}
        </div>

        {/* Подвал */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div>
              Промпты: {debugLogs.filter(l => l.type === 'prompt').length} | 
              Ответы: {debugLogs.filter(l => l.type === 'response').length} | 
              Ошибки: {debugLogs.filter(l => l.type === 'error').length}
            </div>
            <div>
              Режим отладки активен
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DebugConsole; 