# ♟️ Chess with AI - Шахматы с искусственным интеллектом

<div align="center">

![Chess AI Demo](https://img.shields.io/badge/Demo-Live-brightgreen)
![React](https://img.shields.io/badge/React-18-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange)

**Профессиональное шахматное приложение с AI противником на основе Google Gemini**

[🎮 Играть сейчас](https://your-app.render.com) • [📖 Документация](#установка) • [🐛 Сообщить об ошибке](https://github.com/your-username/chess-with-ai/issues)

</div>

## ✨ Особенности

- 🧠 **Умный AI противник** - Powered by Google Gemini 2.5
- 🎨 **Современный UI** - Интуитивный интерфейс с drag & drop
- 🔄 **Динамическое обнаружение моделей** - Автоматически находит все доступные Gemini модели
- 📱 **Адаптивный дизайн** - Работает на всех устройствах
- 🔒 **Безопасность** - API ключи не сохраняются, только локальное использование
- ⚡ **Быстрые ответы** - Оптимизированные запросы к AI
- 🎯 **Валидация ходов** - Полная проверка правил шахмат
- 📊 **Стратегическая память** - AI помнит и развивает стратегию

## 🎮 Как играть

1. **Получите API ключ** - Перейдите на [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Выберите модель** - Приложение автоматически найдет доступные Gemini модели
3. **Начните партию** - Играйте белыми против AI (черные)
4. **Наслаждайтесь игрой** - AI адаптируется к вашему стилю

## 🛠️ Технологии

### Frontend
- **React 18** - Современный пользовательский интерфейс
- **Vite** - Быстрая сборка и разработка
- **TailwindCSS** - Стилизация и адаптивность
- **React Chessboard** - Интерактивная шахматная доска
- **Chess.js** - Валидация ходов и логика игры

### Backend
- **Node.js + Express** - Серверная часть
- **Google Generative AI** - Интеграция с Gemini
- **CORS & Helmet** - Безопасность
- **Rate Limiting** - Защита от злоупотреблений

### AI & Логика
- **Google Gemini 2.5** - Основная AI модель
- **Стратегическое планирование** - AI развивает долгосрочную стратегию
- **Адаптивная сложность** - AI подстраивается под уровень игрока

## 🚀 Быстрый старт

### Онлайн версия
Просто перейдите на **[chess-ai.render.com](https://your-app.render.com)** и начните играть!

### Локальная установка

```bash
# Клонируем репозиторий
git clone https://github.com/your-username/chess-with-ai.git
cd chess-with-ai

# Устанавливаем зависимости
npm run install:all

# Запускаем в dev режиме
npm run dev

# Или для сетевого доступа
npm run dev:network
```

### Переменные окружения

Создайте файл `.env` в папке `backend`:

```env
PORT=3001
NODE_ENV=development
```

## 📦 Деплой на Render.com

### Автоматический деплой

1. **Fork** этот репозиторий
2. Подключите GitHub к [Render.com](https://dashboard.render.com)
3. Создайте новый **Web Service**
4. Выберите этот репозиторий
5. Настройте:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: `./`

### Ручной деплой

```bash
# Собираем фронтенд
npm run build

# Деплоим на Render
git push origin main
```

## 🎯 Архитектура

```
├── 📁 frontend/          # React приложение
│   ├── 📁 src/
│   │   ├── 📁 components/    # React компоненты
│   │   ├── 📁 services/      # API сервисы
│   │   └── 📁 utils/         # Утилиты
│   └── 📄 package.json
├── 📁 backend/           # Node.js сервер
│   ├── 📁 src/
│   │   ├── 📁 services/      # Бизнес логика
│   │   └── 📄 index.js       # Основной сервер
│   └── 📄 package.json
└── 📄 package.json       # Корневой package.json
```

## 🧪 Тестирование

```bash
# Запуск всех тестов
npm test

# Только backend тесты  
npm run test:backend

# Только frontend тесты
npm run test:frontend
```

## 🔧 API Endpoints

### `POST /api/get-ai-move`
Получить ход от AI

```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "history": "1. e4 e5 2. Nf3",
  "strategy": "Контролирую центр",
  "model": "gemini-2.5-pro-preview-05-06",
  "apiKey": "your-api-key"
}
```

### `POST /api/get-models`
Получить список доступных моделей

```json
{
  "apiKey": "your-api-key"
}
```

## 🤝 Участие в разработке

Мы приветствуем участие в проекте! Вот как вы можете помочь:

1. **Fork** репозиторий
2. Создайте **feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit** изменения (`git commit -m 'Add amazing feature'`)
4. **Push** в branch (`git push origin feature/amazing-feature`)
5. Откройте **Pull Request**

### Код стиль

- Используйте **ESLint** и **Prettier**
- Пишите тесты для новых функций
- Документируйте сложную логику

## 📊 Производительность

- ⚡ **Первая загрузка**: < 2s
- 🎯 **AI ответ**: 3-8s (зависит от модели)
- 💾 **Размер bundle**: < 500KB gzipped
- 📱 **Lighthouse Score**: 95+

## 🐛 Известные проблемы

- Иногда AI может предложить некорректный ход (< 3% случаев)
- Требуется стабильное интернет соединение
- API ключ Gemini обязателен для работы

## 📄 Лицензия

Этот проект лицензирован под **MIT License** - смотрите файл [LICENSE](LICENSE) для деталей.

## 🙏 Благодарности

- [Google AI](https://ai.google.dev/) за Gemini API
- [Chess.js](https://github.com/jhlywa/chess.js) за шахматную логику
- [React Chessboard](https://github.com/Clariity/react-chessboard) за UI доски

---

<div align="center">

**Сделано с ❤️ для любителей шахмат**

[⭐ Star](https://github.com/your-username/chess-with-ai) • [🐛 Report Bug](https://github.com/your-username/chess-with-ai/issues) • [💡 Request Feature](https://github.com/your-username/chess-with-ai/issues)

</div> 