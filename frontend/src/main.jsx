import React from 'react';
import { createRoot } from 'react-dom/client';
import { motion, useReducedMotion } from 'framer-motion';
import { create } from 'zustand';
import { ChapterArchive, mockArchive } from './ChapterArchive.tsx';
import './main.css';

const useConnection = create((set) => ({
  status: 'idle',
  async check() {
    set({ status: 'pending' });
    try {
      const response = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
      const data = response.ok ? await response.json() : null;
      set({ status: data?.status === 'ok' ? 'online' : 'offline' });
    } catch {
      set({ status: 'offline' });
    }
  },
}));

const messages = {
  idle: '아직 연결을 확인하지 않았습니다.',
  pending: '연결을 확인하는 중입니다.',
  online: '서버에 연결되었습니다.',
  offline: '서버에 연결할 수 없습니다.',
};

function ConnectionDiagnostics() {
  const status = useConnection((state) => state.status);
  const check = useConnection((state) => state.check);
  const reduceMotion = useReducedMotion();

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-950 px-6 py-12 text-zinc-100">
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl border-t border-amber-400/60 py-8"
      >
        <h1 className="mb-8 text-3xl font-semibold tracking-tight sm:text-5xl">대체역사 시뮬레이터</h1>
        <button
          type="button"
          onClick={check}
          disabled={status === 'pending'}
          className="rounded bg-amber-300 px-4 py-2 font-medium text-zinc-950 hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300 disabled:opacity-70"
        >
          서버 연결 확인
        </button>
        <p role="status" className="mt-4 text-zinc-300">{messages[status]}</p>
      </motion.section>
    </main>
  );
}

const isDiagnostics = window.location.pathname.replace(/\/$/, '') === '/connection';

if (!isDiagnostics) {
  document.title = '이야기 속으로';
}

createRoot(document.getElementById('root')).render(
  isDiagnostics ? <ConnectionDiagnostics /> : <ChapterArchive archive={mockArchive} />,
);
