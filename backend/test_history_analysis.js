const aiService = require('./src/services/aiService');

async function testHistoryAnalysis() {
  console.log('🧪 Тестирование анализа предыдущего хода AI...\n');
  
  // Симулируем ситуацию где AI сделал плохой ход в прошлом
  const gameState = {
    fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3',
    strategy: 'Быстрое развитие фигур, контроль центра',
    apiKey: process.env.GOOGLE_API_KEY,
    model: 'gemini-2.5-flash-preview-04-17-thinking',
    aiSide: 'black',
    lastAiMove: {
      move: 'g8f6',
      san: 'Nf6',
      reasoning: 'Я развиваю коня на f6 для контроля центра. Это хорошее развивающее поле для коня.'
    }
  };
  
  console.log('📋 Тестовая ситуация:');
  console.log('- Текущая позиция:', gameState.fen);
  console.log('- Прошлый ход AI:', gameState.lastAiMove.move, '(' + gameState.lastAiMove.san + ')');
  console.log('- Прошлое объяснение:', gameState.lastAiMove.reasoning);
  console.log('- Проблема: Конь на f6 может быть атакован пешкой e5!\n');
  
  try {
    const result = await aiService.getAiMove(gameState);
    
    console.log('🤖 Ответ AI:');
    console.log('Новый ход:', result.move);
    
    if (result.lastMoveAnalysis) {
      console.log('\n🔍 Анализ предыдущего хода:');
      console.log(result.lastMoveAnalysis);
      
      // Проверяем, признал ли AI свою ошибку
      const analysisLower = result.lastMoveAnalysis.toLowerCase();
      if (analysisLower.includes('ошибка') || 
          analysisLower.includes('неправильн') || 
          analysisLower.includes('под атак') ||
          analysisLower.includes('опасн')) {
        console.log('\n✅ ОТЛИЧНО! AI признал свою ошибку в прошлом ходе');
      } else {
        console.log('\n❌ AI не признал ошибку в прошлом ходе');
      }
    } else {
      console.log('\n❌ AI не предоставил анализ предыдущего хода');
    }
    
    console.log('\n⚔️ Проверка матов:');
    console.log(result.mateCheck || 'Проверка матов не найдена');
    
    console.log('\n📊 Проверка атак:');
    console.log(result.attackCheck || 'Проверка атак не найдена');
    
    console.log('\n💭 Объяснение нового хода:');
    console.log(result.reasoning);
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
  }
}

testHistoryAnalysis(); 