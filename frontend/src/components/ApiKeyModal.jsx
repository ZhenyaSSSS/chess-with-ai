import { useState, useEffect } from 'react'
import { Eye, EyeOff, Key, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react'
import { gameService } from '../services/apiService'

function ApiKeyModal({ isOpen, onApiKeySubmit }) {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-pro-preview-05-06');
  const [availableModels, setAvailableModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Дефолтные модели (fallback если не удалось загрузить)
  const defaultModels = [
    {
      id: 'gemini-2.5-pro-preview-05-06',
      name: 'Gemini 2.5 Pro Preview 05-06',
      description: 'Лучшая версия 2.5 Pro (стабильная)',
      available: true
    },
    {
      id: 'gemini-2.5-pro-preview-06-05',
      name: 'Gemini 2.5 Pro Preview 06-05',
      description: 'Новая версия (могут быть проблемы)',
      available: true
    },
    {
      id: 'gemini-2.5-flash-preview-05-20',
      name: 'Gemini 2.5 Flash Preview',
      description: 'Быстрая модель Gemini 2.5',
      available: true
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro (Legacy)',
      description: 'Устаревшая, но стабильная',
      available: true
    }
  ];

  // Загружаем актуальные модели при вводе API ключа
  const loadModels = async (key) => {
    if (!key || key.length < 20) return;
    
    setIsLoadingModels(true);
    try {
      const models = await gameService.getAvailableModels(key);
      if (models && models.length > 0) {
        setAvailableModels(models);
        console.log('Загружены актуальные модели:', models);
      } else {
        setAvailableModels(defaultModels);
      }
    } catch (error) {
      console.warn('Не удалось загрузить модели, используем дефолтные:', error);
      setAvailableModels(defaultModels);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Изначально показываем дефолтные модели
  useEffect(() => {
    if (availableModels.length === 0) {
      setAvailableModels(defaultModels);
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Пожалуйста, введите API ключ');
      return;
    }

    if (apiKey.length < 20) {
      setError('API ключ слишком короткий. Проверьте правильность ввода.');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // Простая валидация: проверяем что это похоже на Gemini API ключ
      if (!apiKey.startsWith('AI') && !apiKey.includes('-')) {
        throw new Error('Неверный формат API ключа. Убедитесь, что вы скопировали его полностью.');
      }

      // Сохраняем ключ и модель
      onApiKeySubmit(apiKey.trim(), selectedModel);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleInputChange = (e) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    if (error) setError(''); // Очищаем ошибку при вводе
    
    // Автозагрузка моделей при достаточной длине ключа
    if (newKey.length >= 25) {
      loadModels(newKey);
    }
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-in">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Key className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            API ключ Gemini
          </h2>
          <p className="text-gray-600 text-sm">
            Введите ваш API ключ Google Gemini для начала игры
          </p>
        </div>

        {/* Инструкции */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Как получить API ключ:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Перейдите на Google AI Studio</li>
            <li>2. Войдите в аккаунт Google</li>
            <li>3. Создайте новый API ключ</li>
            <li>4. Скопируйте ключ и вставьте сюда</li>
          </ol>
          <a
            href="https://makersuite.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Получить API ключ
            <ExternalLink className="h-4 w-4 ml-1" />
          </a>
                 </div>

         {/* Выбор модели */}
         <div className="bg-gray-50 rounded-lg p-4 mb-6">
           <div className="flex items-center justify-between mb-3">
             <h3 className="font-semibold text-gray-900">🧠 Выберите AI модель:</h3>
             {apiKey && apiKey.length >= 25 && (
               <button
                 onClick={() => loadModels(apiKey)}
                 disabled={isLoadingModels}
                 className="text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center text-sm"
               >
                 <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingModels ? 'animate-spin' : ''}`} />
                 Обновить
               </button>
             )}
           </div>
           
           {isLoadingModels && (
             <div className="flex items-center justify-center py-4">
               <RefreshCw className="h-5 w-5 animate-spin text-blue-600 mr-2" />
               <span className="text-blue-600">Загружаю актуальные модели...</span>
             </div>
           )}
           
           {/* Селект для выбора модели */}
           <div className="mb-3">
             <select
               value={selectedModel}
               onChange={(e) => setSelectedModel(e.target.value)}
               className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
             >
               {availableModels.map((model) => (
                 <option 
                   key={model.id} 
                   value={model.id}
                 >
                   {model.name} {!model.available ? '(Недоступно)' : ''} 
                   {model.available && model.version === '2.5' ? ' ⚡ Новая' : ''}
                 </option>
               ))}
             </select>
           </div>

           {/* Информация о выбранной модели */}
           {selectedModel && (
             <div className="bg-white rounded-lg p-3 border border-gray-200">
               {(() => {
                 const selected = availableModels.find(m => m.id === selectedModel);
                 if (!selected) return null;
                 
                 return (
                   <div>
                     <div className="flex items-center justify-between mb-2">
                       <h4 className="font-medium text-gray-900">{selected.name}</h4>
                       <div className="flex gap-1">
                         {selected.available ? (
                           <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                             ✅ Доступна
                           </span>
                         ) : (
                           <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                             ❌ Недоступна
                           </span>
                         )}
                         {selected.version === '2.5' && (
                           <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                             ⚡ v{selected.version}
                           </span>
                         )}
                       </div>
                     </div>
                     
                     <p className="text-sm text-gray-600 mb-2">{selected.description}</p>
                     
                     {/* Дополнительная информация */}
                     <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                       <div>
                         <span className="font-medium">Ввод:</span> {selected.inputTokenLimit || 'N/A'}
                       </div>
                       <div>
                         <span className="font-medium">Вывод:</span> {selected.outputTokenLimit || 'N/A'}
                       </div>
                     </div>
                     
                     {selected.error && (
                       <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                         <strong>Ошибка:</strong> {selected.error}
                       </div>
                     )}
                     
                     {selected.capabilities && selected.capabilities.length > 0 && (
                       <div className="mt-2">
                         <span className="text-xs font-medium text-gray-500">Возможности:</span>
                         <div className="flex flex-wrap gap-1 mt-1">
                           {selected.capabilities.map(cap => (
                             <span key={cap} className="text-xs bg-gray-100 px-2 py-1 rounded">
                               {cap}
                             </span>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 );
               })()}
             </div>
           )}
           
           {/* Статистика моделей */}
           {availableModels.length > 0 && (
             <div className="mt-3 text-xs text-gray-500 text-center">
               Доступно: {availableModels.filter(m => m.available).length} из {availableModels.length} моделей
             </div>
           )}
         </div>

         <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API ключ
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={handleInputChange}
                placeholder="Введите ваш Gemini API ключ..."
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                autoComplete="off"
                disabled={isValidating}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Ошибка */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isValidating || !apiKey.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Проверяем ключ...
              </>
            ) : (
              'Начать игру'
            )}
          </button>
        </form>

        {/* Безопасность */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start">
            <div className="text-2xl mr-3">🔒</div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Безопасность</h4>
              <p className="text-sm text-gray-600">
                Ваш API ключ используется только для общения с Gemini и не сохраняется на сервере.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApiKeyModal;