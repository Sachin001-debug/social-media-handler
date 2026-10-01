import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 4);
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />;
      case 'danger':
      case 'error':
        return <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-[#172033] shrink-0" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-[#16A34A]';
      case 'danger':
      case 'error':
        return 'border-l-4 border-l-[#DC2626]';
      case 'warning':
        return 'border-l-4 border-l-[#D97706]';
      case 'info':
      default:
        return 'border-l-4 border-l-[#172033]';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-white border border-[#E5E7EB] ${getBorderColor(
              toast.type
            )} rounded-lg shadow-modal p-3.5 flex items-start gap-3 transition-all duration-200`}
          >
            {getIcon(toast.type)}
            <div className="flex-1 text-sm font-medium text-[#111827] leading-snug">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#6B7280] hover:text-[#111827] p-0.5 rounded transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
