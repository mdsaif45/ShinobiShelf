import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

/**
 * App-wide transient notifications.
 *
 * Several mutating actions (approve, decline, return, add book) previously
 * changed state with no visible acknowledgement, and their failures went only
 * to console.error — so a user could not tell whether a click had registered.
 * ProfilePage had a local version of this; it is promoted here so every tab
 * reports outcomes the same way instead of each inventing its own.
 */

type ToastTone = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  notify: (message: string, tone?: ToastTone) => void;
  notifyError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  notify: () => {},
  notifyError: () => {},
});

export const useToast = () => useContext(ToastContext);

const VISIBLE_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      // Date.now alone can collide when two actions resolve in the same tick.
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((current) => [...current, { id, message, tone }]);
      setTimeout(() => dismiss(id), VISIBLE_MS);
    },
    [dismiss]
  );

  const notifyError = useCallback((message: string) => notify(message, 'error'), [notify]);

  const value = useMemo(() => ({ notify, notifyError }), [notify, notifyError]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Bottom-centre on small screens, bottom-right from sm up, so it never
          covers a primary action on a phone. */}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[70] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-4 sm:translate-x-0">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-2xl border p-3 shadow-lg ${
                toast.tone === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-[#E5E0D8] bg-white text-[#2C2C2C]'
              }`}
            >
              {toast.tone === 'error' ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4B5320]" />
              )}
              <p className="min-w-0 flex-1 text-xs leading-relaxed">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-full p-0.5 text-[#8C867E] transition-colors hover:text-[#2C2C2C]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
