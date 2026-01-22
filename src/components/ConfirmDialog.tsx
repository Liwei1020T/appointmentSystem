import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  details?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'warning' | 'danger' | 'info';
  loading?: boolean;
}

/**
 * Confirmation dialog component for destructive or important actions.
 *
 * @param isOpen - Whether dialog is visible
 * @param onClose - Close handler
 * @param onConfirm - Confirm action handler
 * @param title - Dialog title
 * @param message - Main message
 * @param details - Optional details section (e.g., list of items to be replaced)
 * @param confirmLabel - Confirm button text
 * @param cancelLabel - Cancel button text
 * @param variant - Visual style variant
 * @param loading - Show loading state on confirm button
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  details,
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'warning',
  loading = false,
}) => {
  const variantStyles = {
    warning: {
      icon: 'bg-warning/10 text-warning',
      button: 'bg-warning text-white hover:bg-warning/90',
    },
    danger: {
      icon: 'bg-danger/10 text-danger',
      button: 'bg-danger text-white hover:bg-danger/90',
    },
    info: {
      icon: 'bg-info/10 text-info',
      button: 'bg-accent text-white hover:bg-accent/90',
    },
  };

  const styles = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        {/* Icon */}
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${styles.icon}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>

        {/* Title */}
        <h3 className="mt-4 text-lg font-semibold text-text-primary">
          {title}
        </h3>

        {/* Message */}
        <p className="mt-2 text-sm text-text-secondary">
          {message}
        </p>

        {/* Details */}
        {details && (
          <div className="mt-4 p-3 rounded-lg bg-ink text-left text-sm text-text-secondary">
            {details}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-border-subtle text-text-secondary font-medium hover:bg-ink transition-colors disabled:opacity-50"
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-50 ${styles.button}`}
            aria-label={confirmLabel}
          >
            {loading ? '处理中...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
