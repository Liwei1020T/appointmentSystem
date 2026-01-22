import React, { useEffect, useRef } from 'react';
import FocusTrap from './FocusTrap';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Modal dialog component
 *
 * @param isOpen - Whether modal is visible
 * @param onClose - Close handler
 * @param title - Modal title
 * @param children - Modal content
 * @param size - Modal width size
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal with Focus Trap */}
      <FocusTrap active={isOpen} restoreFocus>
        <div
          ref={modalRef}
          className={`relative bg-white rounded-2xl shadow-xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto ${className}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {title && (
            <div className="px-6 py-4 border-b border-border-subtle">
              <h2 id="modal-title" className="text-xl font-semibold text-text-primary">
                {title}
              </h2>
            </div>
          )}
          <div className="px-6 py-4 text-text-secondary">
            {children}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
};

// Provide default export for legacy imports
export default Modal;
