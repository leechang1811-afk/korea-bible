import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext<(msg: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {createPortal(
        <AnimatePresence>
          {msg && (
            <ToastMessage
              key={msg}
              message={msg}
              onClose={() => setMsg(null)}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

function ToastMessage({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed bottom-[max(4.25rem,calc(env(safe-area-inset-bottom)+3.4rem))] left-1/2 -translate-x-1/2 z-[9999] px-4 py-3 rounded-xl bg-[#0B1220] text-white text-sm font-medium shadow-lg"
    >
      {message}
    </motion.div>
  );
}
