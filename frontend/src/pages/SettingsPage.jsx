import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Key, Bot, Save, Trash2, Download, Upload, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { gameService } from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';

function SettingsPage() {
  const {
    apiKey,
    selectedModel,
    setApiKey,
    setSelectedModel,
    exportSettings,
    importSettings,
    resetAllSettings
  } = useSettings();

  // Локальные состояния
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [localModel, setLocalModel] = useState(selectedModel || 'gemini-2.5-pro-preview-05-06');
  const [showApiKey, setShowApiKey] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [apiVersion, setApiVersion] = useState('v1beta');
  const [availableVersions, setAvailableVersions] = useState(['v1', 'v1beta', 'v2', 'demo']);

  // Загрузка доступных моделей при изменении API ключа или версии
  useEffect(() => {
    if (localApiKey && localApiKey.length > 20) {
      loadAvailableModels();
    }
  }, [localApiKey, apiVersion]);

  // Загрузка текущей версии API при монтировании
  useEffect(() => {
    loadCurrentApiVersion();
  }, []);

  /**
   * Загрузить текущую версию API
   */
  const loadCurrentApiVersion = async () => {
    try {
      const response = await fetch('/api/get-api-version');
      const data = await response.json();
      setApiVersion(data.currentVersion);
      setAvailableVersions(data.availableVersions);
    } catch (error) {
      console.error('Ошибка загрузки версии API:', error);
    }
  };

  /**
   * Загрузить список доступных моделей
   */
  const loadAvailableModels = async () => {
    try {
      setIsLoading(true);
      const models = await gameService.getAvailableModels(localApiKey, apiVersion);
      setAvailableModels(models);
      
      // НЕ МЕНЯЕМ выбранную модель - пользователь сам решает что выбирать
      
    } catch (error) {
      console.error('Ошибка загрузки моделей:', error);
      setMessage({ type: 'error', text: 'Ошибка загрузки моделей. Проверьте API ключ.' });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Сохранить настройки
   */
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setMessage({ type: '', text: '' });

      // Валидация API ключа
      if (!localApiKey) {
        setMessage({ type: 'error', text: 'API ключ обязателен' });
        return;
      }

      if (localApiKey.length < 20) {
        setMessage({ type: 'error', text: 'API ключ слишком короткий' });
        return;
      }

      // Тестируем API ключ
      await gameService.getAvailableModels(localApiKey, apiVersion);

      // Сохраняем версию API
      await fetch('/api/set-api-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: apiVersion })
      });

      // Сохраняем в контекст
      setApiKey(localApiKey);
      setSelectedModel(localModel);

      setMessage({ type: 'success', text: '✅ Настройки успешно сохранены!' });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setMessage({ type: 'error', text: 'Ошибка сохранения. Проверьте API ключ.' });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Сбросить настройки
   */
  const handleReset = () => {
    if (confirm('Вы уверены, что хотите сбросить все настройки?')) {
      resetAllSettings();
      setLocalApiKey('');
      setLocalModel('gemini-2.5-pro-preview-05-06');
      setAvailableModels([]);
      setMessage({ type: 'success', text: '✅ Настройки сброшены!' });
    }
  };

  /**
   * Экспорт настроек
   */
  const handleExport = () => {
    try {
      const settingsData = exportSettings();
      const blob = new Blob([settingsData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chess-ai-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: '✅ Настройки экспортированы!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка экспорта настроек' });
    }
  };

  /**
   * Импорт настроек
   */
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const success = importSettings(e.target.result);
        if (success) {
          // Обновляем локальные значения из контекста
          setLocalApiKey(apiKey || '');
          setLocalModel(selectedModel || 'gemini-2.5-pro-preview-05-06');
          setMessage({ type: 'success', text: '✅ Настройки импортированы!' });
        } else {
          setMessage({ type: 'error', text: 'Ошибка импорта. Неверный формат файла.' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Ошибка импорта. Неверный формат файла.' });
      }
    };
    reader.readAsText(file);
  };

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

        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚙️ Настройки</h1>
          <p className="text-blue-100">
            Настройте API ключи и модели искусственного интеллекта
          </p>
        </div>

        {/* Основная форма */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-6">
          
          {/* Сообщения */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-600/20 border border-green-400/30 text-green-100' 
                : 'bg-red-600/20 border border-red-400/30 text-red-100'
            }`}>
              {message.text}
            </div>
          )}

          {/* API ключ */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-white font-semibold mb-3">
              <Key className="w-5 h-5" />
              Google Gemini API ключ
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="Введите ваш API ключ Gemini..."
                className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:border-blue-400 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white transition-colors"
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-blue-200 text-sm mt-2">
              Получите бесплатный API ключ на{' '}
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-100 underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          {/* Версия API */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-white font-semibold mb-3">
              <Bot className="w-5 h-5" />
              Версия Google API
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableVersions.map((version) => (
                <button
                  key={version}
                  onClick={() => setApiVersion(version)}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    apiVersion === version
                      ? 'bg-blue-600/30 border-blue-400/50 shadow-lg'
                      : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-sm font-medium ${
                      apiVersion === version ? 'text-blue-300' : 'text-white'
                    }`}>
                      {version}
                    </div>
                    <div className={`text-xs mt-1 ${
                      apiVersion === version ? 'text-blue-200' : 'text-blue-300'
                    }`}>
                      {version === 'v1' && 'Стабильная'}
                      {version === 'v1beta' && 'Бета (по умолчанию)'}
                      {version === 'v2' && 'Новая версия'}
                      {version === 'demo' && 'Демо режим'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-blue-200 text-sm mt-2">
              Некоторые экспериментальные модели могут требовать определенную версию API.
              Если модели не загружаются, попробуйте другую версию.
            </p>
          </div>

          {/* Модель AI */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-white font-semibold mb-3">
              <Bot className="w-5 h-5" />
              Модель искусственного интеллекта
            </label>
            
            {isLoading ? (
              <div className="flex items-center gap-2 text-blue-200">
                <LoadingSpinner size="sm" />
                <span>Загрузка доступных моделей...</span>
              </div>
            ) : availableModels.length > 0 ? (
              <div className="space-y-3">
                {availableModels.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => (model.available || model.canSelectAnyway) && setLocalModel(model.id)}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      (model.available || model.canSelectAnyway) ? 'cursor-pointer' : 'cursor-not-allowed'
                    } ${
                                              localModel === model.id
                          ? 'bg-blue-600/30 border-blue-400/50 shadow-lg'
                          : model.available
                          ? 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
                          : model.canSelectAnyway
                          ? 'bg-orange-600/10 border-orange-500/30 hover:bg-orange-600/20 hover:border-orange-400/40'
                          : 'bg-gray-600/20 border-gray-500/30 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            localModel === model.id
                              ? 'bg-blue-400'
                              : model.available
                              ? 'bg-green-400'
                              : model.canSelectAnyway
                              ? 'bg-orange-400'
                              : 'bg-gray-400'
                          }`} />
                          <div>
                            <h4 className={`font-medium ${
                              model.available 
                                ? 'text-white' 
                                : model.canSelectAnyway 
                                ? 'text-orange-200' 
                                : 'text-gray-400'
                            }`}>
                              {model.name}
                            </h4>
                            {model.description && (
                              <p className={`text-sm mt-1 ${
                                model.available 
                                  ? 'text-blue-200' 
                                  : model.canSelectAnyway 
                                  ? 'text-orange-300' 
                                  : 'text-gray-500'
                              }`}>
                                {model.description}
                              </p>
                            )}
                            {model.canSelectAnyway && !model.available && (
                              <p className="text-xs mt-1 text-orange-400 font-medium">
                                ⚠️ Рискованный выбор - может не работать
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                                             <div className="flex items-center gap-2">
                         {!model.available && (
                           <>
                             <span className={`text-xs px-2 py-1 rounded-full ${
                               model.status === 'quota_exceeded' 
                                 ? 'bg-yellow-600/20 text-yellow-300' 
                                 : model.status === 'not_found'
                                 ? 'bg-gray-600/20 text-gray-300'
                                 : 'bg-red-600/20 text-red-300'
                             }`}>
                               {model.status === 'quota_exceeded' && '⏱️ Квота исчерпана'}
                               {model.status === 'not_found' && '🚫 Устарела'}
                               {model.status === 'known_problematic' && '⚠️ Проблемная'}
                               {model.status === 'skipped_quota_limit' && '⏸️ Пропущена'}
                               {!['quota_exceeded', 'not_found', 'known_problematic', 'skipped_quota_limit'].includes(model.status) && 'Недоступна'}
                             </span>
                           </>
                         )}
                         {model.available && model.status?.startsWith('cached') && (
                           <span className="bg-green-600/20 text-green-300 text-xs px-2 py-1 rounded-full">
                             📋 Кэш
                           </span>
                         )}
                         {localModel === model.id && (
                           <span className="bg-blue-600/20 text-blue-300 text-xs px-2 py-1 rounded-full">
                             Выбрана
                           </span>
                         )}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-600/20 border border-gray-500/30 rounded-lg p-6 text-center">
                <div className="text-gray-400 mb-3">
                  <Bot className="w-8 h-8 mx-auto mb-2" />
                  <h4 className="font-medium">Модели не загружены</h4>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  Введите действительный API ключ и нажмите "Обновить модели" для загрузки списка доступных моделей.
                </p>
                <button
                  onClick={loadAvailableModels}
                  disabled={!localApiKey || localApiKey.length < 20}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Загрузить модели
                </button>
              </div>
            )}
            
            {availableModels.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-blue-200 text-sm">
                  Доступно: {availableModels.filter(m => m.available).length} / {availableModels.length} моделей
                </div>
                
                {/* Информация о проблемах */}
                {availableModels.some(m => !m.available) && (
                  <div className="bg-yellow-600/10 border border-yellow-400/20 rounded-lg p-3">
                    <h4 className="text-yellow-300 font-medium text-sm mb-2">💡 Почему некоторые модели недоступны?</h4>
                    <div className="text-yellow-200 text-xs space-y-1">
                      {availableModels.some(m => m.status === 'quota_exceeded') && (
                        <div>⏱️ <strong>Квота исчерпана:</strong> Google ужесточил лимиты для бесплатных пользователей</div>
                      )}
                      {availableModels.some(m => m.status === 'not_found') && (
                        <div>🚫 <strong>Устаревшие:</strong> Google отключил старые модели (например, Gemini 1.0 Vision)</div>
                      )}
                                             {availableModels.some(m => m.status === 'known_problematic') && (
                         <div>⚠️ <strong>Проблемные:</strong> Известны проблемы с этими моделями, пропущены для экономии квоты</div>
                       )}
                       {availableModels.some(m => m.status === 'skipped_quota_limit') && (
                         <div>⏸️ <strong>Пропущены:</strong> Достигнут лимит тестирования (15 моделей за раз) для экономии квоты</div>
                       )}
                    </div>
                                         <div className="mt-2 text-yellow-200 text-xs">
                       <strong>Рекомендация:</strong> Используйте модели Gemini 2.0 Flash или 1.5 Flash - они более стабильны и экономичны.<br/>
                       <strong>Примечание:</strong> Проблемные модели можно выбрать на свой страх и риск (оранжевые карточки).
                     </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={saveSettings}
              disabled={isSaving || !localApiKey}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isSaving ? <LoadingSpinner size="sm" /> : <Save className="w-5 h-5" />}
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>

            <button
              onClick={loadAvailableModels}
              disabled={isLoading || !localApiKey}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : <Bot className="w-5 h-5" />}
              Обновить модели
            </button>
          </div>
        </div>

        {/* Дополнительные настройки */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Управление настройками</h2>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Экспорт
            </button>

            <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Импорт
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Сбросить
            </button>
          </div>

          <p className="text-blue-200 text-sm mt-4">
            Используйте экспорт/импорт для резервного копирования настроек или переноса между устройствами.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage; 