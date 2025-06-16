# 🚀 Деплой на Render.com

## 📋 Подготовка к деплою

### 1. GitHub репозиторий

```bash
# Инициализируем git (если еще не сделано)
git init

# Добавляем все файлы
git add .

# Делаем первый коммит
git commit -m "🎉 Initial commit: Chess with AI application

- ♟️ Полнофункциональная шахматная игра
- 🧠 AI противник на Gemini 2.5
- 🎨 Современный React UI
- 🔧 Node.js backend с API
- 📱 Адаптивный дизайн
- 🔒 Безопасность и валидация"

# Добавляем remote репозиторий
git remote add origin https://github.com/YOUR_USERNAME/chess-with-ai.git

# Пушим в GitHub
git push -u origin main
```

### 2. Создание GitHub репозитория

1. Идите на [GitHub](https://github.com)
2. Нажмите **"New repository"**
3. Название: `chess-with-ai`
4. Описание: `♟️ Professional chess game with Google Gemini AI opponent`
5. Выберите **Public**
6. **НЕ** инициализируйте с README (у нас уже есть)
7. Нажмите **"Create repository"**

## 🌐 Деплой на Render.com

### Автоматический деплой

1. **Регистрация на Render**
   - Перейдите на [render.com](https://dashboard.render.com)
   - Зарегистрируйтесь через GitHub

2. **Подключение репозитория**
   - Нажмите **"New +"** → **"Web Service"**
   - Выберите **"Build and deploy from a Git repository"**
   - Найдите и выберите ваш `chess-with-ai` репозиторий

3. **Настройка деплоя**
   ```
   Name: chess-with-ai
   Environment: Node
   Region: Oregon (US West) - ближайший к вам
   Branch: main
   Root Directory: . (корневая)
   
   Build Command: npm run install:all && npm run build
   Start Command: npm run start:production
   
   Plan: Free
   ```

4. **Переменные окружения**
   ```
   NODE_ENV = production
   ```

5. **Деплой**
   - Нажмите **"Create Web Service"**
   - Ждите завершения сборки (3-5 минут)

### Ручной деплой

Если автоматический не сработал:

```bash
# Клонируем на Render сервер
git clone https://github.com/YOUR_USERNAME/chess-with-ai.git
cd chess-with-ai

# Устанавливаем зависимости
npm run install:all

# Собираем фронтенд
npm run build

# Запускаем в продакшене
npm run start:production
```

## 🔧 Настройка домена

### Стандартный домен Render
Ваше приложение будет доступно по адресу:
```
https://chess-with-ai-XXXX.onrender.com
```

### Кастомный домен (опционально)
1. В настройках сервиса → **"Settings"** → **"Custom Domains"**
2. Добавьте ваш домен
3. Настройте DNS записи

## 🛠️ Мониторинг и логи

### Просмотр логов
1. В dashboard Render → ваш сервис
2. Вкладка **"Logs"**
3. Отслеживайте ошибки и производительность

### Проверка работы
```bash
# Health check
curl https://your-app.onrender.com/api/health

# Ответ должен быть:
{"status":"OK","timestamp":"2025-01-XX","version":"1.0.0"}
```

## 🚨 Устранение проблем

### Частые ошибки

1. **Build failed**
   ```bash
   # Проверьте что все зависимости указаны в package.json
   npm run install:all
   npm run build
   ```

2. **API не работает**
   - Проверьте что бэкенд запущен на правильном порту
   - Убедитесь что CORS настроен для вашего домена

3. **Медленный запуск**
   - Это нормально для Free плана Render
   - Первый запрос после простоя может занять 30+ секунд

### Debug команды

```bash
# Локальная проверка production сборки
npm run build
npm run start:production

# Проверка портов
lsof -i :3001  # На маке/линуксе
netstat -ano | findstr :3001  # На Windows
```

## 📊 Мониторинг производительности

### Метрики для отслеживания
- Время отклика API
- Использование памяти
- Частота ошибок
- Время ответа AI

### Оптимизация
- Кэширование статических файлов
- Gzip сжатие
- Lazy loading компонентов
- Оптимизация промптов для AI

## 🔄 Автоматическое обновление

Render автоматически пересобирает приложение при push в `main` ветку:

```bash
# Внести изменения
git add .
git commit -m "✨ Add new feature"
git push origin main

# Render автоматически пересоберет и задеплоит
```

## 🎯 Готово!

После успешного деплоя:
1. ✅ Приложение доступно по HTTPS
2. ✅ Автоматические обновления из GitHub
3. ✅ SSL сертификат от Render
4. ✅ Мониторинг и логи
5. ✅ Масштабирование при необходимости

**Ваша шахматная игра готова к использованию по всему миру! 🌍♟️** 