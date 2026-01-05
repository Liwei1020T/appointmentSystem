import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

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
    success: 'border-l-success',
    error: 'border-l-danger',
    warning: 'border-l-warning',
    info: 'border-l-info'
  };

  // Icon components for each type
  const IconComponents = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  };

  const IconComponent = IconComponents[type];

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4">
      <div
        className={`
          ${styles[type]} 
          text-text-primary px-4 py-3 rounded-lg shadow-lg 
          flex items-center gap-3 min-w-[280px] max-w-md
          glass-strong border border-border-subtle border-l-4 animate-in slide-in-from-top-5 fade-in
        `}
        role="alert"
      >
        <IconComponent className="w-5 h-5 text-text-secondary flex-shrink-0" />
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="text-text-tertiary hover:text-text-primary transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Provide default export for legacy imports
export default Toast;
