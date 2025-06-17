import React, { useState, useEffect, useCallback } from 'react';
import { Terminal, Trash2, RefreshCw, Power, PowerOff, X, Server, AlertTriangle, MessageSquare, Info } from 'lucide-react';
import { toggleDebugMode as apiToggleDebug, getDebugLogs as apiGetLogs, clearDebugLogs as apiClearLogs } from '../services/apiService';

const LogIcon = ({ type }) => {
  switch (type) {
    case 'prompt': return <MessageSquare size={16} className="text-blue-400" />;
    case 'response': return <Server size={16} className="text-green-400" />;
    case 'error': return <AlertTriangle size={16} className="text-red-400" />;
    case 'info':
    case 'success':
    case 'warn':
    default:
      return <Info size={16} className="text-gray-400" />;
  }
};

const LogEntry = ({ log }) => (
  <div className="border-b border-gray-700 p-2 text-sm flex items-start">
    <div className="flex-shrink-0 w-24 text-gray-400">
      <div className="flex items-center">
        <LogIcon type={log.type} />
        <span className="ml-2 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
      </div>
      <div className="text-xs text-gray-500 ml-6">{log.type.toUpperCase()}</div>
    </div>
    <div className="flex-grow pl-2">
      <p className="font-medium text-gray-200">{log.message}</p>
      {log.extra && (
        <pre className="text-xs text-gray-400 bg-gray-800 p-2 mt-1 rounded-md overflow-x-auto">
          {JSON.stringify(log.extra, null, 2)}
        </pre>
      )}
    </div>
  </div>
);

function DebugConsole({ isVisible, onClose }) {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!isEnabled) return;
    setIsLoading(true);
    try {
      const logs = await apiGetLogs();
      setLogs(logs.slice().reverse()); // Показываем новые логи сверху
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить логи. Бэкенд доступен?');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled]);

  const toggleDebugMode = async () => {
    const newState = !isEnabled;
    try {
      await apiToggleDebug(newState);
      setIsEnabled(newState);
      if (newState) {
        fetchLogs();
      } else {
        setLogs([]); // Очищаем логи при выключении
      }
    } catch (err) {
      setError('Не удалось переключить режим отладки.');
      console.error(err);
    }
  };

  const clearLogs = async () => {
    try {
      await apiClearLogs();
      setLogs([]);
    } catch (err) {
      setError('Не удалось очистить логи.');
      console.error(err);
    }
  };

  useEffect(() => {
    if (isVisible && isEnabled) {
      fetchLogs();
    }
  }, [isVisible, isEnabled, fetchLogs]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-1/3 bg-gray-900 text-white border-t-2 border-indigo-500 shadow-lg z-50 flex flex-col">
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center">
          <Terminal className="mr-2 text-indigo-400" />
          <h2 className="text-lg font-bold">Консоль Отладки</h2>
        </div>
        <div className="flex items-center space-x-2">
          {isEnabled && (
            <>
              <button onClick={fetchLogs} disabled={isLoading} className="p-1 hover:bg-gray-700 rounded-full disabled:opacity-50">
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <button onClick={clearLogs} className="p-1 hover:bg-gray-700 rounded-full">
                <Trash2 size={18} />
              </button>
            </>
          )}
          <button onClick={toggleDebugMode} className={`p-1 hover:bg-gray-700 rounded-full ${isEnabled ? 'text-green-500' : 'text-red-500'}`}>
            {isEnabled ? <Power size={18} /> : <PowerOff size={18} />}
          </button>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-full">
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="overflow-y-auto flex-grow">
        {error && <div className="p-4 text-red-500 bg-red-900">{error}</div>}
        {!isEnabled ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Отладка выключена. Нажмите {<Power size={16} className="inline mx-1" />} чтобы включить.
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Нет логов для отображения. Сделайте ход, чтобы появились данные.
          </div>
        ) : (
          logs.map((log, index) => <LogEntry key={`${log.timestamp}-${index}`} log={log} />)
        )}
      </div>
    </div>
  );
}

export default DebugConsole; 