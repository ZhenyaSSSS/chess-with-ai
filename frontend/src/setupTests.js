import '@testing-library/jest-dom'

// Мокаем fetch для тестирования API вызовов
global.fetch = jest.fn()

// Мокаем console.error чтобы не засорять вывод тестов
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Очищаем моки после каждого теста
afterEach(() => {
  jest.clearAllMocks()
}) 