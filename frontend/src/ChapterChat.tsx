import React, { useEffect, useRef, useState } from 'react';

function InfluenceIcon() {
  return (
    <svg
      className="chat-status-art"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 18 Q 12 21 20.5 18 L 19.5 22 Q 12 24 4.5 22 Z" />
      <path d="M12 21v.01 M8 20v.01 M16 20v.01" strokeWidth="1.6" />
      <path d="M12 1 v 4" />
      <path d="M9.5 3 h 5" />
      <path d="M4 18 C 1.5 11, 5 6.5, 12 6.5 C 19 6.5, 22.5 11, 20 18" />
      <path d="M12 19 C 12 12, 8 8, 12 6.5 C 16 8, 12 12, 12 19 Z" />
      <path d="M7.5 18.5 C 7.5 13, 3.5 10, 6.5 8 C 9.5 10, 10 14, 7.5 18.5 Z" />
      <path d="M16.5 18.5 C 16.5 13, 20.5 10, 17.5 8 C 14.5 10, 14 14, 16.5 18.5 Z" />
    </svg>
  );
}

function CredibilityMedalIcon() {
  return (
    <svg
      className="chat-status-art"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="9" r="3.5" />
      <path d="M12 3 L14 4 L16 5 L17 7 L18 9 L17 11 L16 13 L14 14 L12 15 L10 14 L8 13 L7 11 L6 9 L7 7 L8 5 L10 4 Z" />
      <path d="M9 13.5 L6 22 L9.5 20 L12 22 L12 15 M12 22 L14.5 20 L18 22 L15 13.5" />
    </svg>
  );
}

function IdeologyIcon() {
  return (
    <svg
      className="chat-status-art"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M12 3v17" />
      <path d="M8 21h8" />
      <path d="M5 6h14" />
      <circle cx="12" cy="6" r="1" />
      <path d="M3 13l2-7l2 7" />
      <path d="M2 13h6" />
      <path d="M2 13c0 2 1.5 3 3 3s3-1 3-3" />
      <path d="M17 13l2-7l2 7" />
      <path d="M16 13h6" />
      <path d="M16 13c0 2 1.5 3 3 3s3-1 3-3" />
    </svg>
  );
}

function MethodIcon() {
  return (
    <svg
      className="chat-status-art"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 16 Q 12 8 21 3 Q 16 12 8 18 Z" />
      <path d="M7 17 L 19 5" strokeWidth="0.8" />
      <path d="M4 14 Q 8.5 15.5 10 20" />
      <path d="M7 17 L 4 20" />
      <circle cx="3" cy="21" r="1" />
      <path d="M18 16 Q 12 8 3 3 Q 8 12 16 18 Z" />
      <path d="M17 17 L 5 5" strokeWidth="0.8" />
      <path d="M20 14 Q 15.5 15.5 14 20" />
      <path d="M17 17 L 20 20" />
      <circle cx="21" cy="21" r="1" />
    </svg>
  );
}

const statTypes = [
  { icon: <IdeologyIcon />, name: '사상', index: 0 },
  { icon: <MethodIcon />, name: '수단', index: 1 },
  { icon: <InfluenceIcon />, name: '영향력', index: 2 },
] as const;

type ScenarioStat = {
  description: string;
  value: number;
};

type Scenario = {
  part?: number;
  day: string;
  report: string;
  setting: string;
  opening: string;
  pastAction?: string;
  response?: string[];
  consequence?: string;
  question: string;
  suggestions: string[];
  trust: number;
  trustCaption: string;
  reaction: string;
  classification: string;
  stats: [ScenarioStat, ScenarioStat, ScenarioStat];
  records: { kind: string; name: string; description: string }[];
};

const scenarios: Record<string, Scenario | undefined> = {
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

function ReportIcon() {
  return (
    <svg
      className="chat-status-art"
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

export function hasChatScenario(chapterId: string) {
  return Object.hasOwn(scenarios, chapterId);
}

type StatName = '신뢰도' | (typeof statTypes)[number]['name'];

type ChatStatusProps = {
  scenario: Scenario;
  showDashboard: boolean;
  onToggleDashboard: () => void;
};

function ChatStatus({ scenario, showDashboard, onToggleDashboard }: ChatStatusProps) {
  const [selected, setSelected] = useState<StatName>('신뢰도');
  const trustStatus = { icon: <CredibilityMedalIcon />, name: '신뢰도', value: scenario.trust, description: scenario.trustCaption } as const;
  const statuses = [
    trustStatus,
    ...statTypes.map(({ index, ...type }) => ({ ...type, ...scenario.stats[index] })),
  ];
  const { name: activeName, value, description } = statuses.find(({ name }) => name === selected) ?? trustStatus;

  return (
    <div className="chat-status" role="group" aria-label="현재 상태">
      <div
        className="chat-trust"
        role="meter"
        aria-label={activeName}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={`${value}, ${description}`}
      >
        <span className="chat-trust-fill" style={{ width: `${value}%` }} />
        <span className="chat-trust-score">{activeName} {value}</span>
        <span className="chat-trust-caption">{description}</span>
      </div>
      {statuses.map(({ icon, name }) => (
        <button
          key={name}
          className="chat-stat-icon chat-status-icon"
          type="button"
          aria-label={name}
          aria-pressed={selected === name}
          title={name}
          onClick={() => setSelected(name)}
        >
          <span aria-hidden="true">{icon}</span>
        </button>
      ))}
      <button
        className="chat-stat-icon chat-status-icon chat-mobile-stats"
        type="button"
        aria-label="광기판독기 및 능력치"
        aria-controls="chat-dashboard"
        aria-expanded={showDashboard}
        onClick={onToggleDashboard}
      >
        <ReportIcon />
      </button>
    </div>
  );
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

function ChatDashboard({ open, scenario }: { open: boolean; scenario: Scenario }) {
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
          {statTypes.map(({ icon, name, index }) => {
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
                  <meter className="chat-stat-track" min={0} max={100} value={value} aria-label={name} />
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

type ChapterChatProps = {
  chapter: { id: string; number: number; title: string };
};

export function ChapterChat({ chapter }: ChapterChatProps) {
  const scenario = hasChatScenario(chapter.id) ? scenarios[chapter.id] : undefined;
  const [draft, setDraft] = useState('');
  const [actions, setActions] = useState<string[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [dialog, setDialog] = useState<'' | 'settings' | 'help'>('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    const log = logRef.current;
    if (actions.length && log) {
      log.scrollTop = log.scrollHeight;
    }
  }, [actions]);

  useEffect(() => {
    const element = dialogRef.current;
    if (dialog && element && !element.open) {
      element.showModal();
    }
  }, [dialog]);

  function chooseSuggestion(text: string) {
    setDraft(text);
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      textarea.animate([{ backgroundColor: '#efc9ab' }, { backgroundColor: 'transparent' }], 260);
    }
  }

  function submitAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const action = draft.trim();
    if (!action) return;
    setActions((previous) => [...previous, action]);
    setDraft('');
    textareaRef.current?.focus();
  }

  function handleComposerKey(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const { isComposing, keyCode } = event.nativeEvent;
    if (event.key === 'Enter' && !event.shiftKey && !isComposing && keyCode !== 229) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  if (!scenario) return null;

  return (
    <main className="chapter-chat">
      <section className="chat-play" aria-labelledby="chat-heading">
        <header className="chat-header">
          <div className="chat-heading-row">
            <a className="chat-icon-button" href="#chapters" aria-label="목차로 돌아가기">
              <span aria-hidden="true">☰</span>
            </a>
            <h1 id="chat-heading" ref={headingRef} tabIndex={-1}><span>제{scenario.part ?? chapter.number}장</span> {chapter.title}</h1>
            <button className="chat-icon-button" type="button" onClick={() => setDialog('settings')} aria-label="설정">
              <span aria-hidden="true">⚙</span>
            </button>
          </div>
          <ChatStatus
            scenario={scenario}
            showDashboard={showDashboard}
            onToggleDashboard={() => setShowDashboard((previous) => !previous)}
          />
        </header>

        <div ref={logRef} className="chat-log" role="log" aria-label="챕터 대화" tabIndex={0}>
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
              rows={1}
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
