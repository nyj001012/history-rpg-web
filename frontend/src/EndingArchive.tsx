import React, { useEffect, useRef, useState } from 'react';
import type { ReactNode, Ref } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { create } from 'zustand';

export const endingArchiveHref = '#endings';
const chapterSelectionHref = '#chapters';

type TextSize = 'small' | 'normal' | 'large';
type AnimationSpeed = 'slow' | 'normal' | 'fast';
type GamePreferences = {
  textSize: TextSize;
  animationSpeed: AnimationSpeed;
  music: boolean;
  sound: boolean;
  update: (preferences: Partial<Omit<GamePreferences, 'update'>>) => void;
};

const useGamePreferences = create<GamePreferences>((set) => ({
  textSize: 'normal',
  animationSpeed: 'normal',
  music: true,
  sound: true,
  update: (preferences) => set(preferences),
}));

const motionDurations = { slow: 1.5, normal: 1, fast: 0.65 } as const;
export const useGameTextSize = () => useGamePreferences((state) => state.textSize);
export const useGameMotionScale = () => useGamePreferences((state) => motionDurations[state.animationSpeed]);

export function ReportIcon({ className = 'chat-status-art' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="-0.75 -0.9 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M 2 5 C 5 3, 9 6, 13 4 Q 13.5 10.5, 12 17 C 8 19, 4 16, 1 18 Q 1.5 11.5, 2 5" />
      <path d="M 3.5 8 Q 6 7, 9 8" strokeWidth="0.8" />
      <path d="M 3 11 Q 5 10, 8.5 11" strokeWidth="0.8" />
      <path d="M 2.5 14 Q 5 13, 7 14" strokeWidth="0.8" />
      <path d="M 22 2 C 15 2.5, 13 8, 14 15 Q 15 16, 16 15.5 C 19 14.5, 21.5 9, 22 2 Z" strokeWidth="1" />
      <path d="M 22 2 C 17 7, 15.5 12, 15 15.5" strokeWidth="0.8" />
      <path d="M 16.94 9.03 Q 16.1 8.4, 15.5 7.6" strokeWidth="0.8" />
      <path d="M 15.44 13.23 Q 17.7 12.2, 19.5 10.6" strokeWidth="0.8" />
      <path d="M 14.2 15.2 L 13.3 17.8 L 12 21.5 L 14.5 19 L 15.8 15.5" />
      <path d="M 13.8 17.8 L 12 21.5" strokeWidth="0.8" />
    </svg>
  );
}

function HeaderIcon({ kind }: { kind: 'menu' | 'settings' | 'close' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === 'menu' && <path d="M4 6h16M4 12h16M4 18h16" />}
      {kind === 'close' && <path d="m6 6 12 12M18 6 6 18" />}
      {kind === 'settings' && <>
        <path d="m10 3-.5 2.3-1.8.8-2-1-2.6 2.6 1 2-.8 1.8L1 12l.5 2.5 2.3.5.8 1.8-1 2 2.6 2.6 2-1 1.8.8.5 2.3h3l.5-2.3 1.8-.8 2 1 2.6-2.6-1-2 .8-1.8 2.3-.5.5-2.5-2.3-.5-.8-1.8 1-2-2.6-2.6-2 1-1.8-.8-.5-2.3Z" transform="translate(1 -.5) scale(.91)" />
        <circle cx="12" cy="12" r="3" />
      </>}
    </svg>
  );
}

export function GameHeader({
  title, headingId, headingRef, activePage,
}: {
  title: ReactNode;
  headingId?: string;
  headingRef?: Ref<HTMLHeadingElement>;
  activePage: 'chat' | 'endings';
}) {
  const drawerRef = useRef<HTMLDialogElement>(null);
  const settingsRef = useRef<HTMLDialogElement>(null);
  const [openPanel, setOpenPanel] = useState<'navigation' | 'settings' | null>(null);
  const { textSize, animationSpeed, music, sound, update } = useGamePreferences();
  const motionScale = useGameMotionScale();
  const reduceMotion = useReducedMotion();

  function showPanel(panel: 'navigation' | 'settings') {
    const dialog = panel === 'navigation' ? drawerRef.current : settingsRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    setOpenPanel(panel);
  }

  return (
    <header className="game-header sticky top-0 z-50">
      <button type="button" className="game-header-control" aria-label="메뉴" aria-haspopup="dialog" aria-controls="game-navigation" aria-expanded={openPanel === 'navigation'} onClick={() => showPanel('navigation')}>
        <HeaderIcon kind="menu" />
      </button>
      {headingId
        ? <h1 className="game-header-title" id={headingId} ref={headingRef} tabIndex={-1}>{title}</h1>
        : <p className="game-header-title">{title}</p>}
      <button type="button" className="game-header-control" aria-label="설정" aria-haspopup="dialog" aria-controls="game-settings" aria-expanded={openPanel === 'settings'} onClick={() => showPanel('settings')}>
        <HeaderIcon kind="settings" />
      </button>
      <dialog
        id="game-navigation"
        className="game-nav-dialog"
        ref={drawerRef}
        aria-labelledby="game-navigation-title"
        onClose={() => setOpenPanel(null)}
        onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}
      >
        <motion.div
          className="game-drawer"
          initial={false}
          animate={{ x: openPanel === 'navigation' || reduceMotion ? '0%' : '-100%' }}
          transition={{ duration: reduceMotion || openPanel !== 'navigation' ? 0 : 0.3 * motionScale, ease: 'easeOut' }}
        >
          <div className="game-panel-heading">
            <h2 id="game-navigation-title">메뉴</h2>
            <button type="button" className="game-header-control" aria-label="메뉴 닫기" onClick={() => drawerRef.current?.close()}>
              <HeaderIcon kind="close" />
            </button>
          </div>
          <nav aria-label="화면 이동">
            <a href={chapterSelectionHref} onClick={() => drawerRef.current?.close()}>챕터 선택</a>
            <a href={endingArchiveHref} aria-current={activePage === 'endings' ? 'page' : undefined} onClick={() => drawerRef.current?.close()}>엔딩 기록실</a>
          </nav>
        </motion.div>
      </dialog>
      <dialog
        id="game-settings"
        className="game-settings-dialog"
        ref={settingsRef}
        aria-labelledby="game-settings-title"
        onClose={() => setOpenPanel(null)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
        }}
      >
        <form method="dialog" className="game-settings-form">
          <div className="game-panel-heading">
            <h2 id="game-settings-title">설정</h2>
            <button className="game-header-control" aria-label="설정 닫기"><HeaderIcon kind="close" /></button>
          </div>
          <label>텍스트 크기
            <select value={textSize} onChange={(event) => update({ textSize: event.target.value as TextSize })}>
              <option value="small">작게</option>
              <option value="normal">보통</option>
              <option value="large">크게</option>
            </select>
          </label>
          <label>배경음 <input type="checkbox" checked={music} onChange={(event) => update({ music: event.target.checked })} /></label>
          <label>효과음 <input type="checkbox" checked={sound} onChange={(event) => update({ sound: event.target.checked })} /></label>
          <label>애니메이션 속도
            <select value={animationSpeed} onChange={(event) => update({ animationSpeed: event.target.value as AnimationSpeed })}>
              <option value="slow">느리게</option>
              <option value="normal">보통</option>
              <option value="fast">빠르게</option>
            </select>
          </label>
        </form>
      </dialog>
    </header>
  );
}

type Ending = {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  reachedOn: string;
  stats: { influence: number; ideology: number; tactics: number };
};

const endings: readonly Ending[] = [
  { id: 'french-guillotine', chapterId: 'french-revolution', title: '단두대의 이슬', description: '광장의 함성이 멎었다. 마차가 지나간 자리에는 당신이 흘린 모자 하나만 남았다.', reachedOn: '2025-05-10', stats: { influence: 80, ideology: 10, tactics: 100 } },
  { id: 'french-earbuds', chapterId: 'french-revolution', title: '에어팟을 낀 마리 앙투아네트', description: '왕비는 이어폰 한쪽을 빼고 창밖을 바라봤다. 광장이 이렇게 조용한 줄은 처음 알았다고 말했다.', reachedOn: '2025-05-12', stats: { influence: 65, ideology: 42, tactics: 24 } },
  { id: 'joseon-seal', chapterId: 'last-night-of-joseon', title: '새벽에 찍힌 국새', description: '경운궁의 등불이 꺼질 무렵, 아직 마르지 않은 붉은 인장이 새 국호 아래 남았다.', reachedOn: '2025-05-11', stats: { influence: 72, ideology: 56, tactics: 38 } },
];

const recentEndings = [...endings].sort((a, b) => b.reachedOn.localeCompare(a.reachedOn));

export function EndingArchiveLayout({ chapters }: { chapters: readonly { id: string; title: string }[] }) {
  const [filter, setFilter] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const latestRecordRef = useRef<HTMLElement>(null);
  const pendingJump = useRef(false);
  const reduceMotion = useReducedMotion();
  const motionScale = useGameMotionScale();
  const textSize = useGameTextSize();
  const latest: Ending | undefined = recentEndings[0];
  const visibleEndings = recentEndings.filter((ending) => filter === null || filter === ending.chapterId);

  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!pendingJump.current) return;
    pendingJump.current = false;
    latestRecordRef.current?.focus();
  }, [filter]);

  function openLatestRecord() {
    if (latestRecordRef.current) {
      latestRecordRef.current.focus();
      return;
    }
    pendingJump.current = true;
    setFilter(null);
  }

  return (
    <div className="ending-archive" data-game-text-size={textSize}>
      <GameHeader title="엔딩 기록실" activePage="endings" />
      <motion.main
        className="ending-archive-sheet"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.24 * motionScale, ease: 'easeOut' }}
      >
        <div className="ending-archive-summary">
          <h1 id="ending-archive-title" ref={headingRef} tabIndex={-1}>엔딩 기록</h1>
          {latest && (
            <section className="ending-latest" aria-labelledby="ending-latest-heading">
              <h2 id="ending-latest-heading">최근에 맞은 결말</h2>
              <button type="button" className="ending-latest-link" onClick={openLatestRecord}>{latest.title}</button>
            </section>
          )}
        </div>
        <div className="ending-filters" role="group" aria-label="챕터 필터">
          <button type="button" aria-pressed={filter === null} onClick={() => setFilter(null)}>전체</button>
          {chapters.map((chapter) => (
            <button key={chapter.id} type="button" aria-pressed={filter === chapter.id} onClick={() => setFilter(chapter.id)}>{chapter.title}</button>
          ))}
        </div>
        {visibleEndings.length === 0 && <p className="ending-empty" role="status">기록 없음</p>}
        {visibleEndings.length > 0 && <motion.ul
          key={filter ?? 'all'}
          className="ending-grid"
          aria-label="엔딩 기록 목록"
          initial={reduceMotion ? false : 'hidden'}
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.1 * motionScale } } }}
        >
          {visibleEndings.map((ending) => {
            const chapterTitle = chapters.find((chapter) => chapter.id === ending.chapterId)?.title;
            return (
              <motion.li
                key={ending.id}
                className="ending-card"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.26 * motionScale, ease: 'easeOut' } },
                }}
                whileHover={reduceMotion ? undefined : {
                  y: -4,
                  transition: { type: 'tween', duration: 0.18 * motionScale, ease: 'easeOut' },
                }}
              >
                <article
                  ref={latest?.id === ending.id ? latestRecordRef : undefined}
                  tabIndex={latest?.id === ending.id ? -1 : undefined}
                  aria-labelledby={`ending-title-${ending.id}`}
                >
                  <p className="ending-card-chapter">{chapterTitle}</p>
                  <h2 id={`ending-title-${ending.id}`}>{ending.title}</h2>
                  <dl className="ending-card-stats">
                    <div><dt><span aria-hidden="true">👑</span><span className="sr-only">영향력</span></dt><dd>{ending.stats.influence}</dd></div>
                    <div><dt><span aria-hidden="true">⚖️</span><span className="sr-only">이념</span></dt><dd>{ending.stats.ideology}</dd></div>
                    <div><dt><span aria-hidden="true">⚔️</span><span className="sr-only">수단</span></dt><dd>{ending.stats.tactics}</dd></div>
                  </dl>
                  <p className="ending-card-memory">{ending.description}</p>
                  <span className="ending-card-seal"><ReportIcon className="ending-card-report" /></span>
                </article>
              </motion.li>
            );
          })}
        </motion.ul>}
      </motion.main>
    </div>
  );
}
