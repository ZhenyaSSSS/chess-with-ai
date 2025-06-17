import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Явно указываем что слушаем все интерфейсы
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001', // Принудительно IPv4
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          // Логируем проксированные запросы
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`🔄 Проксируем: ${req.method} ${req.url} -> ${options.target}${req.url}`);
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          chess: ['chess.js', 'react-chessboard']
        }
      }
    }
  }
}) 