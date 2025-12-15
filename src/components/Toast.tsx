import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

/**
 * Toast notification component
 * Auto-dismisses after specified duration
 * 
 * @param message - Toast message text
 * @param type - Toast type/variant
 * @param onClose - Close handler
 * @param duration - Auto-dismiss duration in ms (default: 3000)
 */
export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  onClose,
  duration = 3000 
}) => {
  const styles = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-amber-500',
    info: 'bg-blue-600'
  };
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);
  
  return (
    <div 
      className={`
        ${styles[type]} 
        text-white px-4 py-3 rounded-lg shadow-lg 
        flex items-center gap-3 min-w-[300px] max-w-md
        animate-in slide-in-from-top-5 fade-in
      `}
      role="alert"
    >
      <span className="text-lg font-bold">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      <button 
        onClick={onClose} 
        className="text-white/80 hover:text-white transition-colors"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
};

// Provide default export for legacy imports
export default Toast;
