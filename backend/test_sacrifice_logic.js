const aiService = require('./src/services/aiService');

async function testSacrificeLogic() {
  console.log('🧪 Тестирование логики жертв AI...\n');
  
  // Позиция где AI может пожертвовать фигуру за мат
  const mateTestState = {
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 6',
    strategy: 'Атака на короля, ищу мат',
    apiKey: process.env.GOOGLE_API_KEY || 'test-key',
    model: 'gemini-2.5-flash-preview-04-17-thinking',
    aiSide: 'white'
  };
  
  console.log('📋 Тест 1: Позиция с возможным матом');
  console.log('- FEN:', mateTestState.fen);
  console.log('- AI играет за белых');
  console.log('- Цель: найти мат или сильную атаку\n');
  
  try {
    const result = await aiService.getAiMove(mateTestState);
    
    console.log('🤖 Результат AI:');
    console.log('Ход:', result.move);
    
    if (result.mateCheck) {
      console.log('\n⚔️ Проверка матов:');
      console.log(result.mateCheck);
      
      if (result.mateCheck.toLowerCase().includes('мат')) {
        console.log('✅ ОТЛИЧНО! AI нашел мат');
      } else {
        console.log('⚠️ AI не нашел мата');
      }
    }
    
    console.log('\n📊 Проверка атак:');
    console.log(result.attackCheck);
    
    console.log('\n💭 Объяснение:');
    console.log(result.reasoning);
    
    // Проверяем, оправдал ли AI жертву
    const reasoningLower = result.reasoning.toLowerCase();
    if (reasoningLower.includes('жертв') || 
        reasoningLower.includes('компенсац') || 
        reasoningLower.includes('мат')) {
      console.log('\n✅ AI правильно объяснил тактическую идею');
    } else {
      console.log('\n⚠️ AI не объяснил тактику');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Тест 2: Позиция где НЕ нужно жертвовать
  const safeTestState = {
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    strategy: 'Спокойное развитие',
    apiKey: process.env.GOOGLE_API_KEY || 'test-key',
    model: 'gemini-2.5-flash-preview-04-17-thinking',
    aiSide: 'black'
  };
  
  console.log('📋 Тест 2: Обычная позиция');
  console.log('- FEN:', safeTestState.fen);
  console.log('- AI играет за черных');
  console.log('- Цель: НЕ жертвовать фигуры без причины\n');
  
  try {
    const result = await aiService.getAiMove(safeTestState);
    
    console.log('🤖 Результат AI:');
    console.log('Ход:', result.move);
    
    console.log('\n💭 Объяснение:');
    console.log(result.reasoning);
    
    // Проверяем, что AI не делает глупых жертв
    const reasoningLower = result.reasoning.toLowerCase();
    if (reasoningLower.includes('безопасн') || 
        reasoningLower.includes('развит') || 
        reasoningLower.includes('контрол')) {
      console.log('\n✅ AI играет разумно без ненужных жертв');
    } else if (reasoningLower.includes('жертв') || 
               reasoningLower.includes('атак')) {
      console.log('\n⚠️ AI может быть слишком агрессивным');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
  }
}

// Запускаем только если есть API ключ
if (process.env.GOOGLE_API_KEY) {
  testSacrificeLogic();
} else {
  console.log('⚠️ Установите GOOGLE_API_KEY для запуска теста');
  console.log('Пример: set GOOGLE_API_KEY=your_key && node test_sacrifice_logic.js');
} 