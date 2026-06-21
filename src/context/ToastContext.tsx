import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const showSuccess = useCallback((msg: string, dur?: number) => showToast(msg, 'success', dur), [showToast]);
  const showError = useCallback((msg: string, dur?: number) => showToast(msg, 'error', dur), [showToast]);
  const showWarning = useCallback((msg: string, dur?: number) => showToast(msg, 'warning', dur), [showToast]);
  const showInfo = useCallback((msg: string, dur?: number) => showToast(msg, 'info', dur), [showToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-950/80 border-emerald-800/50 shadow-emerald-950/20',
          text: 'text-emerald-200',
          icon: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />,
        };
      case 'error':
        return {
          bg: 'bg-rose-950/80 border-rose-800/50 shadow-rose-950/20',
          text: 'text-rose-200',
          icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/80 border-amber-800/50 shadow-amber-950/20',
          text: 'text-amber-200',
          icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-900/90 border-slate-800/80 shadow-slate-950/40',
          text: 'text-slate-200',
          icon: <Info className="w-4 h-4 text-indigo-400 shrink-0" />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      {/* Toast container overlay */}
      <div className="fixed bottom-5 right-5 z-9999 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => {
            const styles = getToastStyles(t.type);
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.15 } }}
                className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 border rounded-xl backdrop-blur-xl shadow-2xl ${styles.bg} ${styles.text}`}
              >
                <div id={`toast-${t.id}`} className="flex items-center gap-2.5 min-w-0">
                  {styles.icon}
                  <p className="text-xs font-semibold leading-relaxed break-words">{t.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
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
