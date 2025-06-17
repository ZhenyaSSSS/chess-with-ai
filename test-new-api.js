// Простой тест нового API
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testNewAPI() {
  try {
    console.log('🧪 Тестируем новый API...');

    // 1. Создаем сессию
    console.log('\n1. Создание сессии...');
    const sessionResponse = await fetch(`${BASE_URL}/api/games/chess/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        players: ['human', 'ai']
      })
    });

    if (!sessionResponse.ok) {
      throw new Error(`Ошибка создания сессии: ${sessionResponse.status} ${sessionResponse.statusText}`);
    }

    const sessionData = await sessionResponse.json();
    console.log('✅ Сессия создана:', sessionData);

    const sessionId = sessionData.sessionId;

    // 2. Получаем ход AI (будет ошибка без API ключа, но проверим структуру)
    console.log('\n2. Запрос хода AI...');
    const aiMoveResponse = await fetch(`${BASE_URL}/api/sessions/${sessionId}/ai-move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: 'test-key',
        model: 'gemini-2.5-pro-preview-05-06',
        strategy: 'Тестовая стратегия',
        aiSide: 'black'
      })
    });

    console.log('Статус ответа AI:', aiMoveResponse.status);
    const aiMoveData = await aiMoveResponse.json();
    console.log('Ответ AI:', aiMoveData);

  } catch (error) {
    console.error('❌ Ошибка теста:', error.message);
  }
}

if (require.main === module) {
  testNewAPI();
}

module.exports = testNewAPI; 