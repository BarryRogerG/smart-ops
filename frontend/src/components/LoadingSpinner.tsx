interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ 
  message = 'Loading...', 
  subMessage,
  size = 'md' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
      <div className="relative">
        {/* Outer spinning ring */}
        <svg
          className={`${sizeClasses[size]} animate-spin text-indigo-600`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {/* Inner pulsing dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${size === 'lg' ? 'h-4 w-4' : size === 'md' ? 'h-3 w-3' : 'h-2 w-2'} bg-indigo-600 rounded-full animate-pulse`} />
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <div className="text-lg font-medium text-gray-700 mb-1">
          {message}
        </div>
        {subMessage && (
          <div className="text-sm text-gray-500 mt-1">
            {subMessage}
          </div>
        )}
      </div>
    </div>
  );
}
