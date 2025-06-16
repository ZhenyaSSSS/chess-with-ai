import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from '../App'

// Мокаем API сервис
jest.mock('../services/apiService', () => ({
  getAiMove: jest.fn()
}));

import { getAiMove } from '../services/apiService'

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('должен отображать модальное окно для ввода API ключа при загрузке', () => {
    render(<App />);
    
    expect(screen.getByText('API ключ Gemini')).toBeInTheDocument();
    expect(screen.getByText('Введите ваш API ключ Google Gemini для начала игры')).toBeInTheDocument();
  });

  it('должен показывать заголовок приложения', () => {
    render(<App />);
    
    expect(screen.getByText('🎯 Шахматы с AI')).toBeInTheDocument();
    expect(screen.getByText('Сразитесь с умным противником на базе Google Gemini')).toBeInTheDocument();
  });

  it('должен закрывать модальное окно после ввода API ключа', async () => {
    render(<App />);
    
    // Находим поле ввода API ключа
    const apiKeyInput = screen.getByPlaceholderText('Введите ваш Gemini API ключ...');
    const submitButton = screen.getByText('Начать игру');
    
    // Вводим API ключ
    fireEvent.change(apiKeyInput, { target: { value: 'AIzaSyTest-api-key-123456789' } });
    fireEvent.click(submitButton);
    
    // Проверяем что модальное окно закрылось
    await waitFor(() => {
      expect(screen.queryByText('API ключ Gemini')).not.toBeInTheDocument();
    });
  });

  it('должен отображать шахматную доску после ввода API ключа', async () => {
    render(<App />);
    
    // Вводим API ключ
    const apiKeyInput = screen.getByPlaceholderText('Введите ваш Gemini API ключ...');
    const submitButton = screen.getByText('Начать игру');
    
    fireEvent.change(apiKeyInput, { target: { value: 'AIzaSyTest-api-key-123456789' } });
    fireEvent.click(submitButton);
    
    // Проверяем что появились элементы игры
    await waitFor(() => {
      expect(screen.getByText('🔄 Новая игра')).toBeInTheDocument();
      expect(screen.getByText('↶ Отменить ход')).toBeInTheDocument();
      expect(screen.getByText('🔑 Сменить ключ')).toBeInTheDocument();
    });
  });

  it('должен показывать правильный статус игры', async () => {
    render(<App />);
    
    // Вводим API ключ
    const apiKeyInput = screen.getByPlaceholderText('Введите ваш Gemini API ключ...');
    const submitButton = screen.getByText('Начать игру');
    
    fireEvent.change(apiKeyInput, { target: { value: 'AIzaSyTest-api-key-123456789' } });
    fireEvent.click(submitButton);
    
    // Проверяем начальный статус
    await waitFor(() => {
      expect(screen.getByText('Белые ходят')).toBeInTheDocument();
    });
  });

  it('должен показывать панель информации об игре', async () => {
    render(<App />);
    
    // Вводим API ключ
    const apiKeyInput = screen.getByPlaceholderText('Введите ваш Gemini API ключ...');
    fireEvent.change(apiKeyInput, { target: { value: 'AIzaSyTest-api-key-123456789' } });
    fireEvent.click(screen.getByText('Начать игру'));
    
    await waitFor(() => {
      expect(screen.getByText('Стратегия AI')).toBeInTheDocument();
      expect(screen.getByText('История ходов')).toBeInTheDocument();
      expect(screen.getByText('Партия еще не началась')).toBeInTheDocument();
    });
  });

  it('должен обрабатывать кнопку "Новая игра"', async () => {
    render(<App />);
    
    // Вводим API ключ
    const apiKeyInput = screen.getByPlaceholderText('Введите ваш Gemini API ключ...');
    fireEvent.change(apiKeyInput, { target: { value: 'AIzaSyTest-api-key-123456789' } });
    fireEvent.click(screen.getByText('Начать игру'));
    
    await waitFor(() => {
      const newGameButton = screen.getByText('🔄 Новая игра');
      expect(newGameButton).toBeInTheDocument();
      
      // Кликаем кнопку (должна сбросить игру)
      fireEvent.click(newGameButton);
      expect(screen.getByText('Белые ходят')).toBeInTheDocument();
    });
  });

  it('должен обрабатывать кнопку "Сменить ключ"', async () => {
    render(<App />);
    
    // Вводим API ключ
    const apiKeyInput = screen.getByPlaceholderText('Введите ваш Gemini API ключ...');
    fireEvent.change(apiKeyInput, { target: { value: 'AIzaSyTest-api-key-123456789' } });
    fireEvent.click(screen.getByText('Начать игру'));
    
    await waitFor(() => {
      const changeKeyButton = screen.getByText('🔑 Сменить ключ');
      fireEvent.click(changeKeyButton);
    });
    
    // Должно снова показать модальное окно
    await waitFor(() => {
      expect(screen.getByText('API ключ Gemini')).toBeInTheDocument();
    });
  });

  it('должен блокировать кнопку "Отменить ход" когда нет ходов', async () => {
    render(<App />);
    
    // Вводим API ключ
    const apiKeyInput = screen.getByPlaceholderText('Введите ваш Gemini API ключ...');
    fireEvent.change(apiKeyInput, { target: { value: 'AIzaSyTest-api-key-123456789' } });
    fireEvent.click(screen.getByText('Начать игру'));
    
    await waitFor(() => {
      const undoButton = screen.getByText('↶ Отменить ход');
      expect(undoButton).toBeDisabled();
    });
  });

  it('должен отображать подсказки для игрока', async () => {
    render(<App />);
    
    // Вводим API ключ
    const apiKeyInput = screen.getByPlaceholderText('Введите ваш Gemini API ключ...');
    fireEvent.change(apiKeyInput, { target: { value: 'AIzaSyTest-api-key-123456789' } });
    fireEvent.click(screen.getByText('Начать игру'));
    
    await waitFor(() => {
      expect(screen.getByText('💡 Подсказки')).toBeInTheDocument();
      expect(screen.getByText('• Кликните на фигуру, затем на клетку назначения')).toBeInTheDocument();
      expect(screen.getByText('• Или перетащите фигуру на новое место')).toBeInTheDocument();
    });
  });
}); 