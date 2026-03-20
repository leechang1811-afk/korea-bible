import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import BibleHome from './pages/BibleHome';

const BibleBookViewer = lazy(() => import('./pages/BibleBookViewer'));
const BibleVersePicker = lazy(() => import('./pages/BibleVersePicker'));
const BibleDaily = lazy(() => import('./pages/BibleDaily'));
const BibleSettings = lazy(() => import('./pages/BibleSettings'));
const BibleJournal = lazy(() => import('./pages/BibleJournal'));
const BibleProgress = lazy(() => import('./pages/BibleProgress'));

function PageFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center bg-white">
      <div className="w-6 h-6 border-2 border-[#1B64F2] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<BibleHome />} />
          <Route path="/bible" element={<BibleBookViewer />} />
          <Route path="/verse-picker" element={<BibleVersePicker />} />
          <Route path="/read" element={<BibleDaily />} />
          <Route path="/settings" element={<BibleSettings />} />
          <Route path="/journal" element={<BibleJournal />} />
          <Route path="/progress" element={<BibleProgress />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}
