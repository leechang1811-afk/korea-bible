import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

let showToastFn: (msg: string) => void;

function ToastInner({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed bottom-20 left-4 right-4 z-[100] mx-auto max-w-sm rounded-xl bg-[#0B1220] px-4 py-3 text-center text-sm text-white shadow-lg"
    >
      {message}
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    showToastFn = (m) => setMsg(m);
    return () => { showToastFn = () => {}; };
  }, []);
  return (
    <>
      {children}
      <AnimatePresence>
        {msg && (
          <ToastInner message={msg} onDone={() => setMsg(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

export function toast(message: string) {
  showToastFn?.(message);
}
