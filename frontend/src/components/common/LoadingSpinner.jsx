import { RefreshCw } from 'lucide-react';

/**
 * Универсальный компонент индикатора загрузки
 */
function LoadingSpinner({ 
  size = 'md', 
  color = 'white', 
  text = null,
  className = ''
}) {
  // Размеры спиннера
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
    '2xl': 'w-16 h-16'
  };

  // Цвета спиннера
  const colorClasses = {
    white: 'text-white',
    blue: 'text-blue-500',
    gray: 'text-gray-500',
    green: 'text-green-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500',
    purple: 'text-purple-500'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <RefreshCw 
        className={`
          animate-spin 
          ${sizeClasses[size] || sizeClasses.md} 
          ${colorClasses[color] || colorClasses.white}
        `}
      />
      {text && (
        <p className={`mt-2 text-sm ${colorClasses[color] || colorClasses.white}`}>
          {text}
        </p>
      )}
    </div>
  );
}

export default LoadingSpinner; 