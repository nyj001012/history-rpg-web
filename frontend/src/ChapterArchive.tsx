import React, { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { ChapterChat, hasChatScenario } from './ChapterChat.tsx';
import { EndingArchiveLayout, endingArchiveHref, useGameMotionScale } from './EndingArchive.tsx';

type ChapterStatus = 'in-progress' | 'available' | 'locked';

type Chapter = {
  id: string;
  number: number;
  title: string;
  year: number;
  place: string;
  scene: string;
  status: ChapterStatus;
};

type ChapterArchiveData = {
  resumeChapterId: string;
  chapters: Chapter[];
};

type DialogContent = {
  title: string;
  text?: string;
  diagnostics?: boolean;
};

type ChapterCardClickEvent = {
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  currentTarget: HTMLAnchorElement | HTMLButtonElement;
  preventDefault: () => void;
};

type ChapterCardProps = {
  chapter: Chapter;
  selected: boolean;
  onSelect: (chapter: Chapter, card: HTMLAnchorElement) => void;
  reduceMotion: boolean | null;
};

type ModalKeyEvent = {
  key: string;
  shiftKey: boolean;
  currentTarget: HTMLElement;
  preventDefault: () => void;
};

type OverlayPointerEvent = {
  target: EventTarget | null;
  currentTarget: HTMLElement;
};

export const mockArchive: ChapterArchiveData = {
  resumeChapterId: 'french-revolution',
  chapters: [
    {
      id: 'french-revolution',
      number: 1,
      title: '프랑스 대혁명',
      year: 1789,
      place: '파리, 프랑스',
      scene: 'gate',
      status: 'in-progress',
    },
    {
      id: 'last-night-of-joseon',
      number: 2,
      title: '조선의 마지막 밤',
      year: 1897,
      place: '한성, 조선',
      scene: 'palace',
      status: 'available',
    },
    {
      id: 'prohibition',
      number: 3,
      title: '금주법 시대',
      year: 1920,
      place: '시카고, 미국',
      scene: 'city',
      status: 'available',
    },
    {
      id: 'moon-landing',
      number: 4,
      title: '달 착륙 음모',
      year: 1969,
      place: '휴스턴, 미국',
      scene: 'moon',
      status: 'locked',
    },
    {
      id: 'vinland',
      number: 5,
      title: '바이킹의 신대륙',
      year: 1000,
      place: '빈란드, 미상',
      scene: 'vinland',
      status: 'locked',
    },
    {
      id: 'telegram',
      number: 6,
      title: '미래에서 온 전보',
      year: 1912,
      place: '대서양, 타이타닉',
      scene: 'radio',
      status: 'locked',
    },
  ],
};

const statusLabels: Record<ChapterStatus, string> = {
  'in-progress': '진행 중',
  available: '새 이야기',
  locked: '잠김',
};

const formatNumber = (number: number): string => String(number).padStart(2, '0');

const easeOutElastic = (progress: number): number => {
  const curve = (2 * Math.PI) / 3;
  if (progress === 0 || progress === 1) return progress;
  return 2 ** (-10 * progress) * Math.sin((progress * 10 - 0.75) * curve) + 1;
};

const chapterImageVariants = {
  rest: { x: 0, rotate: 0 },
  hover: { x: 2, rotate: 1.2 },
};

function ChapterCard({ chapter, selected, onSelect, reduceMotion }: ChapterCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const locked = chapter.status === 'locked' || !hasChatScenario(chapter.id);
  const Card = locked ? motion.button : motion.a;
  const transition = { duration: reduceMotion ? 0.01 : 0.133, ease: 'easeInOut' };
  const handleClick = (event: ChapterCardClickEvent): void => {
    if (locked || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!(event.currentTarget instanceof HTMLAnchorElement)) return;
    event.preventDefault();
    onSelect(chapter, event.currentTarget);
  };

  return (
    <li>
      <Card
        className="chapter-card"
        type={locked ? 'button' : undefined}
        disabled={locked || undefined}
        href={locked ? undefined : `#play/${chapter.id}`}
        onClick={handleClick}
        onHoverStart={() => {
          if (!locked && !reduceMotion) setIsHovered(true);
        }}
        onHoverEnd={() => setIsHovered(false)}
        aria-haspopup={locked ? undefined : 'dialog'}
        aria-expanded={locked ? undefined : selected}
        aria-label={locked ? undefined : `${chapter.title} 상세 보기`}
      >
        <motion.span
          className="chapter-photo"
          layoutId={`chapter-image-${chapter.id}`}
          animate={{ opacity: selected ? 0 : 1 }}
          transition={transition}
        >
          <motion.span
            className={`chapter-scene chapter-scene--${chapter.scene}`}
            aria-hidden="true"
            animate={isHovered ? 'hover' : 'rest'}
            variants={chapterImageVariants}
            transition={{ duration: 0.55, ease: easeOutElastic }}
          >
            <span className="scene-landmark" />
            <span className="scene-figure scene-figure--left" />
            <span className="scene-figure scene-figure--middle" />
            <span className="scene-figure scene-figure--right" />
          </motion.span>
          <span className="chapter-stamp">{statusLabels[chapter.status]}</span>
        </motion.span>
        <span className="chapter-caption">
          <span className="chapter-number">CHAPTER {formatNumber(chapter.number)}</span>
          <span className="chapter-title">
            {chapter.title} <span className="chapter-year">{chapter.year}</span>
          </span>
          <span className="chapter-place">{chapter.place}</span>
        </span>
      </Card>
    </li>
  );
}

type ChapterArchiveProps = {
  archive: ChapterArchiveData;
};

export function ChapterArchive({ archive }: ChapterArchiveProps) {
  const { chapters, resumeChapterId } = archive;
  const [dialogContent, setDialogContent] = useState<DialogContent | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [hash, setHash] = useState(() => window.location.hash);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selectedCardRef = useRef<HTMLAnchorElement | null>(null);
  const previousSelection = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const wasAwayFromLobby = useRef(false);
  const reduceMotion = useReducedMotion();
  const motionScale = useGameMotionScale();
  const motionTransition = { duration: reduceMotion ? 0.01 : 0.18 * motionScale, ease: 'easeInOut' };
  const openChapters = chapters.filter((chapter) => chapter.status !== 'locked');
  const resumeChapter = openChapters.find((chapter) => chapter.id === resumeChapterId);
  const activeChapter = openChapters.find((chapter) => hasChatScenario(chapter.id) && hash === `#play/${chapter.id}`);
  const isEndingArchive = hash === endingArchiveHref;

  useLayoutEffect(() => {
    function updateHash() {
      if (dialogRef.current?.open) dialogRef.current.close();
      setDialogContent(null);
      setSelectedChapter(null);
      setHash(window.location.hash);
    }
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialogContent && dialog && !dialog.open) dialog.showModal();
  }, [dialogContent]);

  useLayoutEffect(() => {
    if (selectedChapter) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
    if (previousSelection.current) selectedCardRef.current?.focus();
    previousSelection.current = false;
  }, [selectedChapter]);

  const openChapter = (chapter: Chapter, card: HTMLAnchorElement): void => {
    selectedCardRef.current = card;
    previousSelection.current = true;
    setSelectedChapter(chapter);
  };

  const closeChapter = (): void => setSelectedChapter(null);

  const startChapter = (): void => {
    if (!selectedChapter) return;
    window.location.hash = `play/${selectedChapter.id}`;
  };

  useLayoutEffect(() => {
    const isAwayFromLobby = Boolean(activeChapter) || isEndingArchive;
    if (!isAwayFromLobby && wasAwayFromLobby.current) headingRef.current?.focus();
    wasAwayFromLobby.current = isAwayFromLobby;
  }, [activeChapter, isEndingArchive]);

  if (activeChapter) return <ChapterChat key={activeChapter.id} chapter={activeChapter} />;
  if (isEndingArchive) return <EndingArchiveLayout chapters={chapters} />;

  return (
    <div className="chapter-archive">
      <motion.a
        className="ending-bookmark fixed right-0 top-24 rounded-l-lg bg-red-900 text-amber-50"
        href={endingArchiveHref}
        whileHover={reduceMotion ? undefined : { x: -5 }}
        transition={{ duration: 0.18 * motionScale, ease: 'easeOut' }}
      >
        엔딩 기록실
      </motion.a>
      <div className="archive-sheet">
        <header className="archive-header">
          <div>
            <p className="archive-label">대체역사 시뮬레이터</p>
            <p className="archive-brand">이야기 속으로</p>
          </div>
          <div className="archive-header-tools">
            <a className="archive-index" href="#chapters">
              <span className="archive-label">목차</span>
              <span>ARCHIVE 01</span>
            </a>
            <button
              aria-label="설정"
              className="archive-settings"
              type="button"
              onClick={() => setDialogContent({ title: '설정', diagnostics: true })}
            >
              <span aria-hidden="true">⚙</span>
            </button>
          </div>
        </header>

        <main>
          <section className="archive-intro" aria-labelledby="archive-heading">
            <div className="archive-intro-line">
              <span className="archive-label">what if...</span>
              <span>열람자 [닉네임]</span>
            </div>
            <h1 id="archive-heading" ref={headingRef} tabIndex={-1}>어느 역사를 경험해보시겠습니까?</h1>
            <p className="archive-lede">마음이 가는 이야기를 골라보세요.</p>
          </section>

          <LayoutGroup>
            <ul id="chapters" className="chapter-grid" aria-label="챕터 목차">
              {chapters.map((chapter) => (
                <ChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  selected={selectedChapter?.id === chapter.id}
                  onSelect={openChapter}
                  reduceMotion={reduceMotion}
                />
              ))}
            </ul>

            <AnimatePresence initial={false}>
              {selectedChapter && (
                <motion.div
                  className="chapter-confirm-overlay"
                  key="chapter-confirm-overlay"
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                  transition={motionTransition}
                  onMouseDown={(event: OverlayPointerEvent) => {
                    if (event.target === event.currentTarget) closeChapter();
                  }}
                  onTouchStart={(event: OverlayPointerEvent) => {
                    if (event.target === event.currentTarget) closeChapter();
                  }}
                >
                  <motion.section
                    className="chapter-confirm-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="chapter-confirm-title"
                    initial={reduceMotion ? false : { opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 40 }}
                    transition={motionTransition}
                    onKeyDown={(event: ModalKeyEvent) => {
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        closeChapter();
                      }
                      if (event.key === 'Tab') {
                        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
                        const first = buttons[0];
                        const last = buttons[buttons.length - 1];
                        if (event.shiftKey && document.activeElement === first) {
                          event.preventDefault();
                          last?.focus();
                        } else if (!event.shiftKey && document.activeElement === last) {
                          event.preventDefault();
                          first?.focus();
                        }
                      }
                    }}
                  >
                    <motion.span
                      className="chapter-confirm-photo chapter-photo"
                      layoutId={`chapter-image-${selectedChapter.id}`}
                      transition={motionTransition}
                    >
                      <span className={`chapter-scene chapter-scene--${selectedChapter.scene}`} aria-hidden="true">
                        <span className="scene-landmark" />
                        <span className="scene-figure scene-figure--left" />
                        <span className="scene-figure scene-figure--middle" />
                        <span className="scene-figure scene-figure--right" />
                      </span>
                      <span className="chapter-stamp">{statusLabels[selectedChapter.status]}</span>
                    </motion.span>
                    <h2 id="chapter-confirm-title" className="chapter-confirm-title">
                      {selectedChapter.title}이(가) 맞습니까?
                    </h2>
                    <p className="chapter-confirm-meta">
                      CHAPTER {formatNumber(selectedChapter.number)} / {selectedChapter.year} / {selectedChapter.place}
                    </p>
                    <div className="chapter-confirm-actions">
                      <button type="button" className="chapter-confirm-button" onClick={closeChapter} autoFocus>아니오</button>
                      <button type="button" className="chapter-confirm-button chapter-confirm-button--primary" onClick={startChapter}>네</button>
                    </div>
                  </motion.section>
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>
        </main>

        <footer className="archive-footer">
          <span>전체 {formatNumber(chapters.length)}권 / 열람 가능 {formatNumber(openChapters.length)}권</span>
        </footer>
      </div>

      {resumeChapter && (
        <button className="archive-resume" type="button" hidden disabled>
          <span>마지막 기록에서</span>
          <strong>이어서 하기 &gt; {resumeChapter.title}</strong>
        </button>
      )}
      <button
        aria-label="도움말"
        className="archive-help"
        type="button"
        onClick={() => setDialogContent({
          title: '기록보관소 이용 안내',
          text: '열람 가능한 챕터를 선택해 이야기를 시작할 수 있습니다. 잠긴 챕터는 열람할 수 없습니다.',
        })}
      >
        ?
      </button>

      <dialog
        ref={dialogRef}
        className="archive-dialog"
        aria-labelledby="archive-dialog-title"
        onClose={() => setDialogContent(null)}
      >
        <h2 id="archive-dialog-title">{dialogContent?.title}</h2>
        {dialogContent?.text && <p>{dialogContent.text}</p>}
        {dialogContent?.diagnostics && <a href="/connection">서버 연결 확인</a>}
        <form method="dialog">
          <button type="submit" autoFocus>닫기</button>
        </form>
      </dialog>
    </div>
  );
}
