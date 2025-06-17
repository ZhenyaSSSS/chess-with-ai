import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';

// Контексты
import { GameProvider } from './context/GameContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';

// Константы
import { ROUTES } from './utils/constants';

// Компоненты загрузки
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// Ленивая загрузка страниц
const HomePage = lazy(() => import('./pages/HomePage'));
const ChessGamePage = lazy(() => import('./pages/ChessGamePage'));
const TicTacToePage = lazy(() => import('./pages/TicTacToePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Компонент для применения темы
function ThemeProvider({ children }) {
  const { userPreferences } = useSettings();

  useEffect(() => {
    // Применяем тему к документу
    const theme = userPreferences.theme;
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Применяем пользовательские CSS переменные
    const colors = {
      light: {
        '--primary': '#3b82f6',
        '--secondary': '#6366f1',
        '--success': '#10b981',
        '--warning': '#f59e0b',
        '--error': '#ef4444',
        '--background': '#ffffff',
        '--surface': '#f8fafc',
        '--text': '#1f2937'
      },
      dark: {
        '--primary': '#60a5fa',
        '--secondary': '#818cf8',
        '--success': '#34d399',
        '--warning': '#fbbf24',
        '--error': '#f87171',
        '--background': '#111827',
        '--surface': '#1f2937',
        '--text': '#f9fafb'
      }
    };
    
    const themeColors = colors[theme] || colors.light;
    Object.entries(themeColors).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
  }, [userPreferences.theme]);

  return children;
}

// Главный компонент приложения
function AppContent() {
  const { settingsLoaded } = useSettings();

  // Показываем загрузку пока настройки не загружены
  if (!settingsLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-white mt-4 text-lg">Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <GameProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700">
          <Router>
            <ErrorBoundary>
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="text-white mt-4 text-lg">Загрузка...</p>
              </div>
            </div>
              }>
                <Routes>
                  {/* Главная страница */}
                  <Route path={ROUTES.HOME} element={<HomePage />} />
                  
                  {/* Страница шахмат */}
                  <Route path={ROUTES.CHESS} element={<ChessGamePage />} />
                  
                  {/* Страница крестиков-ноликов */}
                  <Route path={ROUTES.TICTACTOE} element={<TicTacToePage />} />
                  
                  {/* Страница настроек */}
                  <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
                  
                  {/* Перенаправление с неизвестных маршрутов на главную */}
                  <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
                  <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </Router>
        </div>
      </GameProvider>
    </ThemeProvider>
  );
}

// Корневой компонент App
function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App; 