import React, { useEffect, useRef, useState } from 'react';

const statTypes = [
  { icon: '⚖︎', name: '사상' },
  { icon: '⚔︎', name: '수단' },
  { icon: '♕', name: '영향력' },
];

const scenarios = {
  'french-revolution': {
    part: 2,
    day: '혁명력 1일차',
    report: '상태 보고서 1789-07',
    setting: '1789년 7월 14일, 파리.',
    opening: '바스티유 감옥 앞은 분노한 군중으로 들끓고 있습니다. 당신은 어쩌다 보니 한 손에는 횃불을, 다른 손에는 왕실 주방에서 훔친 바게트를 들고 맨 앞줄에 서 있습니다.',
    pastAction: '바게트를 높이 들고 이것이야말로 프랑스의 진정한 왕이라고 외친다.',
    response: [
      '군중이 잠시 조용해집니다. 옆에 있던 인쇄공 자크가 당신을 수상하게 바라봅니다.',
      '하지만 굶주린 시민 몇 명은 바게트 왕이라는 말에 고개를 끄덕이기 시작했습니다.',
    ],
    consequence: '신뢰도가 7 하락했습니다. 바게트파 지지자가 3명 생겼습니다.',
    question: '왕실 근위대가 다가옵니다. 당신은 어떻게 하시겠습니까?',
    suggestions: ['빵 대신 케이크를 나눠준다', '조용히 군중 사이로 숨는다', '미래의 혁명 구호를 외친다'],
    trust: 38,
    trustCaption: '미치광이 취급',
    reaction: '저 사람, 빵이랑 대화하는 것 같은데?',
    classification: '위험한 혁명 선동가',
    stats: [
      { description: '극단적 혁명파', value: 82 },
      { description: '말보다 행동파', value: 47 },
      { description: '광장에 소문남', value: 63 },
    ],
    records: [
      { kind: '칭호', name: '단두대의 단골손님', description: '왕실 근위대에게 세 번 이상 붙잡혔습니다.' },
      { kind: '기념품', name: '왕실 주방의 바게트', description: '어째서인지 아직 따뜻합니다.' },
    ],
  },
  'last-night-of-joseon': {
    day: '한성의 첫날',
    report: '상태 보고서 1897-10',
    setting: '1897년 10월, 한성.',
    opening: '어둠이 내린 경운궁 담장 밖에 등불 하나가 흔들립니다. 내일의 국호가 적힌 문서 한 장과 도장이 당신 손에 들려 있습니다.',
    question: '순라군이 문서를 발견하기 전에 어떻게 하시겠습니까?',
    suggestions: ['도장을 찍기 전에 문서를 읽는다', '가까운 주막으로 몸을 숨긴다', '등불을 들어 순라군을 부른다'],
    trust: 58,
    trustCaption: '의심받는 중',
    reaction: '저 문서를 어쩌다 손에 넣은 거지?',
    classification: '수상한 문서 전달자',
    stats: [
      { description: '새 제국에 관심 있음', value: 52 },
      { description: '신중하게 움직임', value: 43 },
      { description: '궁 밖에서 낯선 얼굴', value: 22 },
    ],
    records: [],
  },
  prohibition: {
    day: '금주법 1일차',
    report: '상태 보고서 1920-01',
    setting: '1920년 1월, 시카고.',
    opening: '재즈 소리가 지하실 문틈으로 새어 나옵니다. 문지기가 당신을 보고 암호를 묻는데, 코트 주머니 속 쪽지에는 레몬 세 개만 그려져 있습니다.',
    question: '길 건너에서 순찰차가 멈춥니다. 어떻게 하시겠습니까?',
    suggestions: ['레모네이드 배달인 척한다', '문지기에게 쪽지를 보여준다', '재즈 소리를 따라 뒷문을 찾는다'],
    trust: 61,
    trustCaption: '신원 확인 중',
    reaction: '그 레몬은 초대장이었나?',
    classification: '신원 불명의 손님',
    stats: [
      { description: '금주법을 눈치 보는 중', value: 33 },
      { description: '임기응변에 능함', value: 62 },
      { description: '단골 손님과 어색함', value: 28 },
    ],
    records: [],
  },
};

export function hasChatScenario(chapterId) {
  return Object.hasOwn(scenarios, chapterId);
}

function StatIcons() {
  return statTypes.map(({ icon, name }) => <span className="chat-stat-icon" key={name}>{icon}</span>);
}

function PixelPortrait() {
  return (
    <div className="chat-portrait" aria-hidden="true">
      <div className="chat-portrait-shadow" />
      <div className="chat-portrait-ear chat-portrait-ear-left" />
      <div className="chat-portrait-ear chat-portrait-ear-right" />
      <div className="chat-portrait-face">
        <i className="chat-portrait-eye chat-portrait-eye-left" />
        <i className="chat-portrait-eye chat-portrait-eye-right" />
        <i className="chat-portrait-nose" />
        <i className="chat-portrait-mouth" />
      </div>
      <i className="chat-portrait-hair chat-portrait-hair-left" />
      <i className="chat-portrait-hair chat-portrait-hair-center" />
      <i className="chat-portrait-hair chat-portrait-hair-right" />
      <i className="chat-portrait-sweat" />
    </div>
  );
}

function ChatDashboard({ open, scenario }) {
  const { report, reaction, classification, stats, records } = scenario;
  return (
    <aside
      id="chat-dashboard"
      className="chat-dashboard"
      data-open={open}
      aria-labelledby="chat-dashboard-heading"
      tabIndex={0}
    >
      <header className="chat-panel-heading">
        <span>{report}</span>
        <h2 id="chat-dashboard-heading">광기판독기</h2>
      </header>

      <div className="chat-detector">
        <div className="chat-detector-scene">
          <div className="chat-detector-copy">
            <p>주변인 반응</p>
            <blockquote>“{reaction}”</blockquote>
          </div>
          <PixelPortrait />
        </div>
        <div className="chat-detector-scale">
          <span>정상</span>
          <span className="chat-detector-track" aria-hidden="true" />
          <span>위험</span>
        </div>
      </div>

      <section aria-labelledby="chat-stats-heading">
        <header className="chat-panel-heading">
          <span>능력치 분석</span>
          <h3 id="chat-stats-heading">3대 지표</h3>
        </header>
        <ul className="chat-stats">
          {statTypes.map(({ icon, name }, index) => {
            const { description, value } = stats[index];
            return (
              <li key={name}>
                <span className="chat-stat-icon" aria-hidden="true">{icon}</span>
                <div className="chat-stat-data">
                  <div className="chat-stat-label">
                    <strong>{name}</strong>
                    <span>{description}</span>
                    <b>{value}</b>
                  </div>
                  <meter className="chat-stat-track" min="0" max="100" value={value} aria-label={name} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="chat-classification">현재 당신은 <strong>{classification}</strong>로 분류됩니다.</p>
      </section>

      <section aria-labelledby="chat-records-heading">
        <header className="chat-panel-heading">
          <span>획득한 기록</span>
          <h3 id="chat-records-heading">아카이브 {String(records.length).padStart(2, '0')}</h3>
        </header>
        {records.length > 0 ? <ol className="chat-records">
          {records.map(({ kind, name, description }, index) => (
            <li key={name}>
              <span className="chat-record-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <p className="chat-record-kind">{kind}</p>
                <h4>{name}</h4>
                <p className="chat-record-description">{description}</p>
              </div>
            </li>
          ))}
        </ol> : <p className="chat-records-empty">아직 획득한 기록이 없습니다.</p>}
        <p className="chat-record-note">기록은 자동 갱신됨 / 열람 등급 수상함</p>
      </section>
    </aside>
  );
}

export function ChapterChat({ chapter }) {
  const scenario = scenarios[chapter.id];
  const { trust, trustCaption } = scenario;
  const [draft, setDraft] = useState('');
  const [actions, setActions] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [dialog, setDialog] = useState('');
  const headingRef = useRef(null);
  const logRef = useRef(null);
  const textareaRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (actions.length) {
      const log = logRef.current;
      log.scrollTop = log.scrollHeight;
    }
  }, [actions]);

  useEffect(() => {
    if (dialog && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [dialog]);

  function chooseSuggestion(text) {
    setDraft(text);
    const textarea = textareaRef.current;
    textarea.focus();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      textarea.animate([{ backgroundColor: '#efc9ab' }, { backgroundColor: 'transparent' }], 260);
    }
  }

  function submitAction(event) {
    event.preventDefault();
    const action = draft.trim();
    if (!action) return;
    setActions((previous) => [...previous, action]);
    setDraft('');
    textareaRef.current.focus();
  }

  function handleComposerKey(event) {
    const { isComposing, keyCode } = event.nativeEvent;
    if (event.key === 'Enter' && !event.shiftKey && !isComposing && keyCode !== 229) {
      event.preventDefault();
      event.currentTarget.form.requestSubmit();
    }
  }

  return (
    <main className="chapter-chat">
      <section className="chat-play" aria-labelledby="chat-heading">
        <header className="chat-header">
          <div className="chat-heading-row">
            <a className="chat-icon-button" href="#chapters" aria-label="목차로 돌아가기">
              <span aria-hidden="true">☰</span>
            </a>
            <h1 id="chat-heading" ref={headingRef} tabIndex="-1"><span>제{scenario.part ?? chapter.number}장</span> {chapter.title}</h1>
            <button className="chat-icon-button" type="button" onClick={() => setDialog('settings')} aria-label="설정">
              <span aria-hidden="true">⚙</span>
            </button>
          </div>
          <div className="chat-status">
            <div
              className="chat-trust"
              role="meter"
              aria-label="신뢰도"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={trust}
              aria-valuetext={`신뢰도 ${trust}, ${trustCaption}`}
            >
              <span className="chat-trust-fill" style={{ width: `${trust}%` }} />
              <span className="chat-trust-score">신뢰도 {trust}</span>
              <span className="chat-trust-caption">{trustCaption}</span>
            </div>
            <div className="chat-stat-icons" aria-hidden="true"><StatIcons /></div>
            <button
              className="chat-mobile-stats"
              type="button"
              aria-label="광기판독기 및 능력치"
              aria-controls="chat-dashboard"
              aria-expanded={showDashboard}
              onClick={() => setShowDashboard((previous) => !previous)}
            >
              <span aria-hidden="true"><StatIcons /></span>
            </button>
          </div>
        </header>

        <div ref={logRef} className="chat-log" role="log" aria-label="챕터 대화" tabIndex="0">
          <div className="chat-date-marker">{scenario.day}</div>
          <article className="chat-narrative">
            <h2>{scenario.setting}</h2>
            <p>{scenario.opening}</p>
          </article>
          {scenario.pastAction && <p className="chat-player-message">{scenario.pastAction}</p>}
          {scenario.response && (
            <div className="chat-narrative">
              {scenario.response.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          )}
          {scenario.consequence && (
            <aside className="chat-history-change" aria-label="역사 수정 알림">
              <strong>역사 수정</strong>
              <p>{scenario.consequence}</p>
            </aside>
          )}
          <p className="chat-question">{scenario.question}</p>
          {actions.map((action, index) => (
            <div className="chat-turn" key={index}>
              <p className="chat-player-message">{action}</p>
              <p className="chat-action-result">행동을 기록했습니다. 다음 이야기는 준비 중입니다.</p>
            </div>
          ))}
        </div>

        <form className="chat-composer" onSubmit={submitAction}>
          <div className="chat-suggestions" aria-label="예시 행동" role="group">
            {scenario.suggestions.map((text, index) => (
              <button key={text} type="button" onClick={() => chooseSuggestion(text)}>
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span> {text}
              </button>
            ))}
          </div>
          <div className="chat-input-row">
            <label className="sr-only" htmlFor="chat-action">당신의 행동</label>
            <textarea
              id="chat-action"
              ref={textareaRef}
              rows="1"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKey}
              placeholder="당신의 행동을 입력하세요..."
              aria-describedby="chat-composer-note"
            />
            <button className="chat-submit" type="submit" disabled={!draft.trim()}>
              <span aria-hidden="true">➤</span> 실행
            </button>
          </div>
          <p id="chat-composer-note" className="chat-composer-note">입력한 행동은 되돌릴 수 없습니다. 아마도요.</p>
        </form>
      </section>
      <ChatDashboard open={showDashboard} scenario={scenario} />
      <button className="chat-help" type="button" aria-label="도움말" onClick={() => setDialog('help')}>?</button>
      <dialog ref={dialogRef} className="chat-dialog" aria-labelledby="chat-dialog-heading" onClose={() => setDialog('')}>
        <h2 id="chat-dialog-heading">{dialog === 'settings' ? '설정' : '도움말'}</h2>
        {dialog === 'settings'
          ? <a href="/connection">서버 연결 확인</a>
          : <p>예시 행동을 누르면 입력창에 담깁니다. 문장을 고친 뒤 실행을 누를 수 있습니다.</p>}
        <form method="dialog"><button type="submit">닫기</button></form>
      </dialog>
    </main>
  );
}
