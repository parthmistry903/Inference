import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastConfig: Record<ToastType, { icon: React.ReactNode; color: string }> = {
  success: { icon: <CheckCircle2 className="h-5 w-5" />, color: '#3A7A72' },
  error:   { icon: <XCircle      className="h-5 w-5" />, color: '#9A4545' },
  info:    { icon: <Info         className="h-5 w-5" />, color: '#635E59' },
  warning: { icon: <AlertTriangle className="h-5 w-5"/>, color: '#B07A3E' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = crypto.randomUUID();
      setToasts((cur) => [...cur, { id, message, type }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed right-4 top-4 z-[70] flex w-[320px] flex-col gap-2 max-sm:left-4 max-sm:right-4 max-sm:w-auto">
          {toasts.map((item) => {
            const { icon, color } = toastConfig[item.type];
            return (
              <div
                key={item.id}
                className="animate-slide-in-right flex items-start gap-3 rounded-2xl border border-[#2A2420] bg-[#171512] p-3 shadow-xl backdrop-blur-md"
              >
                <div className="mt-0.5 flex-shrink-0" style={{ color }}>{icon}</div>
                <p className="min-w-0 flex-1 font-sans text-[13.5px] font-medium text-[#EDEAE5] mt-0.5">{item.message}</p>
                <Button variant="ghost" size="sm" className="h-7 w-7 flex-shrink-0 p-0 text-[#635E59] hover:text-[#EDEAE5] hover:bg-white/5" onClick={() => dismiss(item.id)} aria-label="Dismiss">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
