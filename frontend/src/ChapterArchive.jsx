import React, { useLayoutEffect, useRef, useState } from 'react';

export const mockArchive = {
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

const statusLabels = {
  'in-progress': '진행 중',
  available: '새 이야기',
  locked: '잠김',
};

const formatNumber = (number) => String(number).padStart(2, '0');

function ChapterCard({ chapter, onSelect }) {
  return (
    <li>
      <button
        className="chapter-card"
        type="button"
        disabled={chapter.status === 'locked'}
        onClick={() => onSelect(chapter)}
      >
        <span className="chapter-photo">
          <span className={`chapter-scene chapter-scene--${chapter.scene}`} aria-hidden="true">
            <span className="scene-landmark" />
            <span className="scene-figure scene-figure--left" />
            <span className="scene-figure scene-figure--middle" />
            <span className="scene-figure scene-figure--right" />
          </span>
          <span className="chapter-stamp">{statusLabels[chapter.status]}</span>
        </span>
        <span className="chapter-caption">
          <span className="chapter-number">CHAPTER {formatNumber(chapter.number)}</span>
          <span className="chapter-title">
            {chapter.title} <span className="chapter-year">{chapter.year}</span>
          </span>
          <span className="chapter-place">{chapter.place}</span>
        </span>
      </button>
    </li>
  );
}

export function ChapterArchive({ archive }) {
  const { chapters, resumeChapterId } = archive;
  const [dialogContent, setDialogContent] = useState(null);
  const dialogRef = useRef(null);
  const openChapters = chapters.filter((chapter) => chapter.status !== 'locked');
  const resumeChapter = openChapters.find((chapter) => chapter.id === resumeChapterId);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialogContent && !dialog.open) dialog.showModal();
  }, [dialogContent]);

  function selectChapter(chapter) {
    setDialogContent({
      label: `CHAPTER ${formatNumber(chapter.number)} / ${statusLabels[chapter.status]}`,
      title: chapter.title,
      context: `${chapter.year}년, ${chapter.place}`,
      text: '이 챕터는 미리보기 상태입니다. 게임 플레이는 준비 중입니다.',
    });
  }

  return (
    <div className="chapter-archive">
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
            <h1 id="archive-heading">어느 역사를 경험해보시겠습니까?</h1>
            <p className="archive-lede">마음이 가는 이야기를 골라보세요.</p>
          </section>

          <ul id="chapters" className="chapter-grid" aria-label="챕터 목차">
            {chapters.map((chapter) => (
              <ChapterCard key={chapter.id} chapter={chapter} onSelect={selectChapter} />
            ))}
          </ul>
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
          text: '열람 가능한 챕터를 선택해 기록을 미리 볼 수 있습니다. 잠긴 챕터는 열람할 수 없습니다.',
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
        {dialogContent?.label && <p className="archive-label">{dialogContent.label}</p>}
        <h2 id="archive-dialog-title">{dialogContent?.title}</h2>
        {dialogContent?.context && <p className="archive-dialog-context">{dialogContent.context}</p>}
        {dialogContent?.text && <p>{dialogContent.text}</p>}
        {dialogContent?.diagnostics && <a href="/connection">서버 연결 확인</a>}
        <form method="dialog">
          <button type="submit" autoFocus>닫기</button>
        </form>
      </dialog>
    </div>
  );
}
