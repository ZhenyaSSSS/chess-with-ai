import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Settings, Info, Gamepad2 } from 'lucide-react';

// Контексты и хуки
import { useGameContext } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';

// Компоненты
import LoadingSpinner from '../components/common/LoadingSpinner';

// Константы
import { GAME_CONFIG, GAME_TYPES } from '../utils/constants';

/**
 * Главная страница приложения
 */
function HomePage() {
  const { 
    supportedGames, 
    loadSupportedGames, 
    isLoading, 
    error,
    activeSessions 
  } = useGameContext();
  
  const { apiKey, isFirstLaunch } = useSettings();

  // Загружаем список поддерживаемых игр при монтировании
  useEffect(() => {
    if (supportedGames.length === 0) {
      loadSupportedGames();
    }
  }, [supportedGames.length, loadSupportedGames]);

  // Получаем игры для отображения (или используем локальную конфигурацию как fallback)
  const gamesToShow = supportedGames.length > 0 
    ? supportedGames.map(gameType => ({
        id: gameType,
        ...GAME_CONFIG[gameType]
      })).filter(game => game.name) // Фильтруем только валидные игры
    : Object.values(GAME_CONFIG);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Заголовок */}
        <header className="text-center mb-12">
          <div className="mb-6">
            <Gamepad2 className="w-20 h-20 text-white mx-auto mb-4" />
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              🎮 Игры с AI
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Сразитесь с умным искусственным интеллектом в различных играх
            </p>
          </div>

          {/* Показываем приветствие для первого запуска */}
          {isFirstLaunch && (
            <div className="bg-blue-600/30 backdrop-blur-sm rounded-xl p-6 mb-8 border border-blue-400/30">
              <h2 className="text-2xl font-semibold text-white mb-2">
                👋 Добро пожаловать!
              </h2>
              <p className="text-blue-100">
                Выберите игру и введите API ключ Google Gemini для начала
              </p>
            </div>
          )}
        </header>

        {/* Статистика активных сессий */}
        {activeSessions.size > 0 && (
          <div className="bg-green-600/20 backdrop-blur-sm rounded-xl p-4 mb-8 border border-green-400/30">
            <div className="flex items-center justify-center gap-3">
              <Play className="w-5 h-5 text-green-300" />
              <span className="text-green-100">
                У вас {activeSessions.size} активных игровых сессий
              </span>
            </div>
          </div>
        )}

        {/* Загрузка */}
        {isLoading && (
          <div className="text-center mb-8">
            <LoadingSpinner size="lg" text="Загрузка игр..." />
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <div className="bg-red-600/20 backdrop-blur-sm rounded-xl p-6 mb-8 border border-red-400/30 text-center">
            <p className="text-red-100">Ошибка загрузки игр: {error}</p>
            <button
              onClick={loadSupportedGames}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {/* Сетка игр */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {gamesToShow.map((game) => {
            const hasActiveSession = Array.from(activeSessions.values())
              .some(session => session.gameType === game.id);

            return (
              <GameCard 
                key={game.id}
                game={game}
                hasActiveSession={hasActiveSession}
                hasApiKey={!!apiKey}
              />
            );
          })}
        </div>

        {/* Дополнительные ссылки */}
        <div className="flex flex-wrap justify-center gap-4">
          <InfoCard
            icon={<Settings className="w-6 h-6" />}
            title="Настройки"
            description="Настройте AI модели и предпочтения"
            href="/settings"
          />
          <InfoCard
            icon={<Info className="w-6 h-6" />}
            title="О проекте"
            description="Узнайте больше о приложении"
            href="/about"
            disabled={true} // Временно отключено
          />
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 pb-8">
          <p className="text-blue-200 text-sm">
            Создано с ❤️ для демонстрации возможностей AI
          </p>
        </footer>
      </div>
    </div>
  );
}

/**
 * Карточка игры
 */
function GameCard({ game, hasActiveSession, hasApiKey }) {
  return (
    <div className="group">
      <Link
        to={game.route}
        className="block bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
      >
        {/* Иконка и статус */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-4xl">{game.icon}</div>
          <div className="flex flex-col items-end gap-1">
            {hasActiveSession && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Активна
              </span>
            )}
            {!hasApiKey && (
              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                Нужен ключ
              </span>
            )}
          </div>
        </div>

        {/* Название и описание */}
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">
          {game.name}
        </h3>
        <p className="text-blue-100 text-sm mb-4 leading-relaxed">
          {game.description}
        </p>

        {/* Особенности игры */}
        {game.features && (
          <div className="flex flex-wrap gap-1 mb-4">
            {game.features.slice(0, 2).map((feature) => (
              <span
                key={feature}
                className="bg-blue-600/30 text-blue-200 text-xs px-2 py-1 rounded-full"
              >
                {getFeatureName(feature)}
              </span>
            ))}
          </div>
        )}

        {/* Кнопка запуска */}
        <div className="flex items-center justify-between">
          <span className="text-blue-200 text-sm">
            Игроков: {game.minPlayers}-{game.maxPlayers}
          </span>
          <div className="flex items-center gap-2 text-blue-200 group-hover:text-white transition-colors">
            <Play className="w-4 h-4" />
            <span className="text-sm font-medium">Играть</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

/**
 * Информационная карточка
 */
function InfoCard({ icon, title, description, href, disabled = false }) {
  const className = `
    flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10
    ${disabled 
      ? 'opacity-50 cursor-not-allowed' 
      : 'hover:bg-white/10 hover:border-white/20 transition-all duration-300'
    }
  `;

  const content = (
    <>
      <div className="text-blue-200">{icon}</div>
      <div>
        <h4 className="text-white font-medium">{title}</h4>
        <p className="text-blue-200 text-sm">{description}</p>
      </div>
    </>
  );

  if (disabled) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link to={href} className={className}>
      {content}
    </Link>
  );
}

/**
 * Получить название особенности игры
 */
function getFeatureName(feature) {
  const featureNames = {
    'drag-drop': 'Перетаскивание',
    'promotion': 'Превращение',
    'castling': 'Рокировка',
    'en-passant': 'Взятие на проходе',
    'click-to-move': 'Клик для хода'
  };
  
  return featureNames[feature] || feature;
}

export default HomePage; 