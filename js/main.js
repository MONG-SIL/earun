import {
  DEFAULT_PROFILE,
  INTERESTS,
  LEVEL_OPTIONS,
  MINUTES,
  PURPOSE_OPTIONS,
  PURPOSES,
  SAMPLE_NOTE,
  STYLE_OPTIONS,
  STYLES,
  composeEpisode,
  isDue,
  seoulKey,
  seoulLabel,
  streakFrom,
} from "./content.js";
import { extractPdf } from "./pdftext.js";
import { clearStore, load, persist } from "./store.js";
import { gatherSources } from "./wiki.js";

const VIEWS = ["welcome", "setup", "today", "player", "create", "archive", "me"];
const TITLES = {
  welcome: "이어런 — 자투리 시간을 학습으로",
  setup: "루틴 만들기 — 이어런",
  today: "오늘 — 이어런",
  player: "듣기 — 이어런",
  create: "만들기 — 이어런",
  archive: "기록 — 이어런",
  me: "마이 — 이어런",
};
const FEEDBACKS = [
  ["easier", "더 쉽게"],
  ["exam", "시험 핵심만"],
  ["dialogue", "대화로"],
  ["memory", "암기 반복"],
  ["examples", "예시 더"],
  ["longer", "더 길게"],
];

const state = {
  view: "welcome",
  profile: null,
  draft: null,
  studio: null,
  cards: [],
  episode: null,
  playing: false,
  lineIndex: 0,
  rate: 1,
  compare: false,
  loading: false,
  error: "",
  voiceLabel: "기기의 음성",
  notifiedOn: "",
};

let token = 0;

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function mark(onDark = false) {
  const bg = onDark ? "#f4efe6" : "#1c4639";
  const stroke = onDark ? "#1c4639" : "#f4efe6";
  return `<svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="${bg}"/><path d="M10 20c2.2 0 3.4-2.2 3.4-8S12.2 4 10 4" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round"/><path d="M14.2 23c3.6 0 6-3.6 6-11s-2.4-11-6-11" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round"/><circle cx="9.2" cy="20" r="1.4" fill="#e23b16"/></svg>`;
}

function brand(clickable, onDark = false) {
  const inner = `${mark(onDark)}<span>이어런</span>`;
  if (!clickable) return `<span class="brand">${inner}</span>`;
  const view = state.profile ? "today" : "welcome";
  return `<button type="button" class="brand brand-btn" data-action="nav" data-view="${view}">${inner}</button>`;
}

function boot() {
  const saved = load();
  state.profile = saved.profile || null;
  state.cards = Array.isArray(saved.cards) ? saved.cards : [];
  state.notifiedOn = localStorage.getItem("earun.notified") || "";
  const requested = location.hash.replace(/^#\//, "");
  let view = VIEWS.includes(requested) ? requested : (state.profile ? "today" : "welcome");
  if (!state.profile && !["welcome", "setup"].includes(view)) view = "welcome";
  if (view === "player") state.episode = state.cards[0] || null;
  if (view === "player" && !state.episode) view = state.profile ? "today" : "welcome";
  if (view === "setup") state.draft = blankDraft();
  if (view === "create") ensureStudio();
  document.body.addEventListener("click", onClick);
  document.body.addEventListener("change", onChange);
  document.body.addEventListener("keydown", onKey);
  window.addEventListener("popstate", () => {
    const next = location.hash.replace(/^#\//, "") || (state.profile ? "today" : "welcome");
    go(VIEWS.includes(next) ? next : "welcome", { hash: false });
  });
  go(view, { replace: true });
  checkRoutine();
  setInterval(checkRoutine, 20000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkRoutine();
  });
}

function blankDraft() {
  const profile = state.profile || DEFAULT_PROFILE;
  return {
    step: 0,
    name: profile.name === "게스트" ? "" : (profile.name || ""),
    interests: [...(profile.interests || DEFAULT_PROFILE.interests)],
    keyword: profile.keyword || "",
    purpose: profile.purpose || "commute",
    style: profile.style || "radio",
    level: profile.level || "intermediate",
    minutes: Number(profile.minutes) || 5,
    routine: profile.routine || "08:00",
    notify: profile.notify || "default",
  };
}

function ensureStudio() {
  const profile = state.profile || DEFAULT_PROFILE;
  const previous = state.studio;
  state.studio = {
    mode: previous?.mode || "interest",
    interests: [...(profile.interests || [])],
    keyword: profile.keyword || "",
    purpose: profile.purpose,
    style: profile.style,
    level: profile.level,
    minutes: Number(profile.minutes) || 5,
    note: previous?.note || "",
    noteTitle: previous?.noteTitle || "",
    parsing: false,
  };
}

function go(view, { hash = true, replace = false } = {}) {
  if (!state.profile && !["welcome", "setup"].includes(view)) view = "welcome";
  if (view === "player" && !state.episode && !state.loading) view = state.profile ? "today" : "welcome";
  if (view === "setup" && !state.draft) state.draft = blankDraft();
  if (view === "create") ensureStudio();
  state.view = view;
  const next = `#/${view}`;
  if (hash && location.hash !== next) {
    if (replace) history.replaceState(null, "", next);
    else history.pushState(null, "", next);
  }
  document.title = TITLES[view] || "이어런";
  render();
}

function render() {
  const bare = state.view === "welcome" || state.view === "setup";
  const mobile = window.matchMedia("(max-width: 860px)").matches;
  document.documentElement.style.setProperty("--toast-bottom", !bare && mobile ? "96px" : "24px");
  document.querySelector("#app").innerHTML = shell(bare);
  if (state.view === "player" && state.episode && (state.playing || state.lineIndex > 0)) {
    setActiveLine(Math.min(state.lineIndex, state.episode.lines.length - 1), false);
  }
}

function shell(bare) {
  return `<div class="app ${bare ? "is-bare" : ""}">
    ${bare ? "" : sideHtml()}
    <main class="main" id="main">
      ${bare ? `<div class="topbar">${brand(false)}<a href="./earun-brief.pdf">소개 PDF</a></div>` : ""}
      ${viewHtml()}
    </main>
    ${bare ? "" : tabHtml()}
    ${miniHtml()}
  </div>`;
}

function sideHtml() {
  const profile = state.profile;
  return `<aside class="side">
    ${brand(true, true)}
    <nav>
      ${navButton("today", "오늘")}
      ${navButton("create", "만들기")}
      ${navButton("archive", "기록")}
      ${navButton("me", "마이")}
    </nav>
    <div class="side-foot">
      <span>매일 ${esc(profile?.routine || "08:00")}</span>
      <span>${esc(PURPOSES[profile?.purpose] || "")} · ${esc(profile?.minutes || 5)}분</span>
    </div>
  </aside>`;
}

function tabHtml() {
  return `<nav class="tabbar">
    ${navButton("today", "오늘")}
    ${navButton("create", "만들기")}
    ${navButton("archive", "기록")}
    ${navButton("me", "마이")}
  </nav>`;
}

function navButton(view, label) {
  return `<button type="button" class="nav ${state.view === view ? "is-on" : ""}" data-action="nav" data-view="${view}">${label}</button>`;
}

function miniHtml() {
  if (!state.episode || state.view === "player" || state.loading) return "";
  if (!state.playing && state.lineIndex <= 0) return "";
  const total = state.episode.lines.length;
  const current = Math.min(total, state.lineIndex + (state.playing ? 1 : 0));
  return `<div class="mini">
    <button type="button" class="btn play sm" data-action="toggle">${state.playing ? "일시정지" : "재생"}</button>
    <button type="button" class="mini-title" data-action="nav" data-view="player">
      <strong>${esc(state.episode.title)}</strong>
      <span>${current} / ${total}</span>
    </button>
  </div>`;
}

function viewHtml() {
  if (state.view === "welcome") return viewWelcome();
  if (state.view === "setup") return viewSetup();
  if (state.view === "today") return viewToday();
  if (state.view === "player") return viewPlayer();
  if (state.view === "create") return viewCreate();
  if (state.view === "archive") return viewArchive();
  return viewMe();
}

function viewWelcome() {
  return `<section class="hero">
    <p class="eyebrow">개인 맞춤형 AI 오디오 학습</p>
    <h1>읽어야 할 것을,<br>들을 수 있는 하루로.</h1>
    <p class="lede">관심사와 내 노트를 라디오, 대화, 강의, 암기 오디오로 바꿉니다. 재생 옆에는 스크립트와 출처, 이미지가 함께 남습니다.</p>
    <div class="cta">
      <button type="button" class="btn primary" data-action="start-guest">오늘의 오디오 들어보기</button>
      <button type="button" class="btn ghost" data-action="start-setup">내 루틴 만들기</button>
    </div>
    <p class="quiet">출퇴근 10분, 시험 전 5분, 영어 표현처럼 상황만 고르면 됩니다. 개인 자료는 서버로 보내지 않습니다.</p>
  </section>
  <section class="features">
    <article><strong>관심사만 고르면</strong><p>테크, 경제, 과학, 시사 설명을 글과 이미지, 출처와 함께 모아 옵니다.</p></article>
    <article><strong>상황에 맞게</strong><p>시험, 이동, 영어, 뉴스 목적과 네 가지 말투로 같은 자료도 다르게 읽습니다.</p></article>
    <article><strong>내 노트도 방송으로</strong><p>붙여 넣은 글과 PDF를 브라우저 안에서 암기용 오디오와 카드로 바꿉니다.</p></article>
  </section>
  <section class="about">
    <h2>왜 이어런인가</h2>
    <p class="lede">읽어야 할 것은 많은데 앉아서 볼 시간은 부족합니다. 이어런은 귀가 자유로운 시간을 학습 루틴으로 만들고, 들은 문장과 출처를 카드로 남겨 나중에 눈으로 다시 확인하게 합니다.</p>
  </section>`;
}

function viewSetup() {
  const draft = state.draft || blankDraft();
  const steps = [
    ["뭐라고 부를까요?", "오디오 첫 문장에 이름을 넣습니다. 비워 두면 게스트로 시작합니다."],
    ["무엇을 들을까요?", "관심사를 고르면 공개된 설명과 이미지를 모아 옵니다. 영어는 따라 하는 표현으로 만듭니다."],
    ["어떤 상황인가요?", "목적과 말투, 난이도, 분량에 맞춰 같은 자료도 다르게 읽습니다."],
    ["언제 들을까요?", "정한 시각부터 40분 사이에 열면 오늘의 듣기를 안내합니다. 알림은 이 브라우저에서만 옵니다."],
  ];
  const [title, body] = steps[draft.step];
  let fields = "";
  if (draft.step === 0) {
    fields = `<input id="wiz-name" type="text" maxlength="20" placeholder="이름 또는 닉네임" value="${esc(draft.name)}" autocomplete="nickname" />`;
  } else if (draft.step === 1) {
    fields = `${interestButtons(draft.interests, "wiz-interest")}
      <input id="wiz-keyword" type="text" maxlength="40" placeholder="직접 듣고 싶은 주제 (선택)" value="${esc(draft.keyword)}" />`;
  } else if (draft.step === 2) {
    fields = `<p class="label">목적</p>${choiceButtons(PURPOSE_OPTIONS, "purpose", draft.purpose)}
      <p class="label">말투</p>${choiceButtons(STYLE_OPTIONS, "style", draft.style)}
      <p class="label">난이도</p>${choiceButtons(LEVEL_OPTIONS, "level", draft.level)}
      <p class="label">분량</p>${minuteButtons(draft.minutes)}`;
  } else {
    fields = `<input id="wiz-routine" type="time" value="${esc(draft.routine)}" />
      <div class="row" style="margin-top:16px">
        <button type="button" class="btn ghost" data-action="notify">알림 켜기</button>
        <span id="notify-state" class="quiet">${draft.notify === "granted" ? "알림이 켜져 있습니다." : "알림을 켜지 않아도 앱 안에서 안내합니다."}</span>
      </div>`;
  }
  return `<section class="panel">
    <div class="wizard-top"><p class="eyebrow">${draft.step + 1} / 4</p></div>
    <h2>${title}</h2>
    <p class="lede">${body}</p>
    ${fields}
    <div class="cta">
      <button type="button" class="btn ghost" data-action="wizard-back">이전</button>
      <button type="button" class="btn primary" data-action="wizard-next">${draft.step === 3 ? "첫 오디오 만들기" : "다음"}</button>
    </div>
  </section>`;
}

function viewToday() {
  const profile = state.profile || DEFAULT_PROFILE;
  const today = seoulKey();
  const featured = state.cards.find((card) => seoulKey(new Date(card.createdAt)) === today) || null;
  const rest = state.cards.filter((card) => card.id !== featured?.id).slice(0, 4);
  const name = profile.name && profile.name !== "게스트" ? `${profile.name} 님` : "오늘";
  const due = isDue(profile.routine);
  const done = featured && (featured.progress || 0) >= 0.8;
  return `<header class="page-head">
      <p class="eyebrow">${esc(seoulLabel())}</p>
      <h1>${esc(name)}의 듣기</h1>
      <p class="quiet">매일 ${esc(profile.routine)} · ${esc(PURPOSES[profile.purpose])} · ${esc(STYLES[profile.style])} · ${esc(profile.minutes)}분 목표</p>
    </header>
    ${due && !done ? `<aside class="banner"><div><strong>지금이 루틴 시간입니다</strong><p>오늘의 오디오를 열어 두었습니다. 재생은 버튼으로 시작합니다.</p></div><button type="button" class="btn play" data-action="routine-play">재생 화면으로</button></aside>` : ""}
    <section class="stats">
      <article><b>${listenedMinutes()}</b><span>들은 분</span></article>
      <article><b>${state.cards.length}</b><span>카드</span></article>
      <article><b>${streakFrom(state.cards)}</b><span>연속 일</span></article>
    </section>
    ${featured ? featuredCard(featured) : emptyToday()}
    ${rest.length ? `<h2 style="margin-top:28px">지난 카드</h2>${rest.map(archiveCard).join("")}` : ""}`;
}

function emptyToday() {
  return `<article class="hero-card empty">
    <p class="eyebrow">오늘의 이어런</p>
    <h2>아직 오늘의 오디오가 없습니다</h2>
    <p class="lede">관심사를 고르면 설명과 이미지를 모아 듣고, 노트는 직접 올릴 수 있습니다.</p>
    <div class="cta">
      <button type="button" class="btn primary" data-action="generate">관심사로 만들기</button>
      <button type="button" class="btn ghost" data-action="nav" data-view="create">노트 · PDF로 만들기</button>
    </div>
  </article>`;
}

function featuredCard(card) {
  return `<article class="hero-card">
    ${coverHtml(card.cover, card.title)}
    <div>
      <p class="eyebrow">오늘</p>
      <h2>${esc(card.title)}</h2>
      <p class="dek">${esc(card.dek)}</p>
      ${termHtml(card.terms)}
      ${factHtml(card.facts)}
      <div class="cta">
        <button type="button" class="btn play" data-action="open-card" data-id="${esc(card.id)}">들어보기</button>
      </div>
    </div>
  </article>`;
}

function viewPlayer() {
  if (state.loading) {
    return `<section class="panel"><p class="eyebrow">이어런</p><h2>듣기 좋은 말로 다시 배열하는 중</h2><p class="lede">글과 이미지를 모아, 고른 상황과 말투의 스크립트로 만들고 있습니다.</p><div class="skel"></div></section>`;
  }
  if (state.error) {
    return `<section class="panel"><h2>만들지 못했습니다</h2><p class="lede">${esc(state.error)}</p><div class="cta"><button type="button" class="btn primary" data-action="dismiss-error">돌아가기</button></div></section>`;
  }
  const episode = state.episode;
  if (!episode) return emptyToday();
  const total = episode.lines.length || 1;
  const width = Math.min(100, (Math.min(state.lineIndex, total) / total) * 100);
  return `<section class="player ${state.compare ? "is-compare" : ""}">
    <div class="player-grid">
      <div class="player-side">
        ${coverHtml(episode.cover, episode.title)}
        <p class="eyebrow">${esc(seoulLabel(new Date(episode.createdAt)))}</p>
        <h2>${esc(episode.title)}</h2>
        <p class="dek">${esc(episode.dek)}</p>
        ${termHtml(episode.terms)}
        <div class="transport">
          <button type="button" class="btn play" data-action="toggle">${state.playing ? "일시정지" : "재생"}</button>
          <button type="button" class="btn ghost" data-action="restart">처음부터</button>
          <div class="wave ${state.playing ? "is-on" : ""}" aria-hidden="true">${"<i></i>".repeat(12)}</div>
        </div>
        <button type="button" class="scrub" data-action="scrub" aria-label="재생 위치"><span style="width:${width}%"></span></button>
        <div class="rates">
          ${rateButton(0.85, "느리게")}
          ${rateButton(1, "보통")}
          ${rateButton(1.15, "빠르게")}
          ${rateButton(1.35, "더 빠르게")}
        </div>
        <p class="quiet"><span id="count">${Math.min(total, state.lineIndex + 1)} / ${total}</span> · <span id="voice">${esc(state.voiceLabel)}</span></p>
        <p class="quiet">스페이스바로 재생과 멈춤. 문장을 누르면 그 위치부터 읽습니다.</p>
      </div>
      <div>
        <div class="row">
          <button type="button" class="text-btn ${state.compare ? "is-on" : ""}" data-action="compare">원문 비교</button>
        </div>
        <div class="script" id="script">
          ${episode.lines.map((line, index) => `<div class="line" data-i="${index}"><button type="button" data-action="jump" data-i="${index}"><span class="who">${esc(line.speaker)}</span><span class="say">${esc(line.text)}</span>${line.origin && line.origin !== line.text ? `<span class="origin">${esc(line.origin)}</span>` : ""}</button></div>`).join("")}
        </div>
        <h3 class="label">이렇게 다시 만들기</h3>
        <div class="choices">
          ${FEEDBACKS.map(([id, label]) => `<button type="button" class="chip" data-action="feedback" data-feedback="${id}"><b>${label}</b></button>`).join("")}
        </div>
        ${factHtml(episode.facts)}
        <h3 class="label">출처와 이미지</h3>
        <div class="sources">${(episode.sources || []).map(sourceHtml).join("")}</div>
        ${episode.offlineNote ? `<p class="note">${esc(episode.offlineNote)}</p>` : ""}
        ${episode.attribution ? `<p class="note">${esc(episode.attribution)}</p>` : ""}
        <p class="sr" id="live" aria-live="polite"></p>
      </div>
    </div>
  </section>`;
}

function viewCreate() {
  const studio = state.studio || {
    mode: "interest",
    interests: [],
    keyword: "",
    purpose: "commute",
    style: "radio",
    level: "intermediate",
    minutes: 5,
    note: "",
    parsing: false,
  };
  const noteMode = studio.mode === "note";
  return `<header class="page-head"><p class="eyebrow">만들기</p><h1>오늘의 오디오</h1></header>
    <div class="modes">
      <button type="button" class="mode ${noteMode ? "" : "is-on"}" data-action="mode" data-mode="interest">관심사로</button>
      <button type="button" class="mode ${noteMode ? "is-on" : ""}" data-action="mode" data-mode="note">내 자료로</button>
    </div>
    <div class="split">
      <section class="panel">
        ${noteMode ? `<p class="lede">붙여 넣은 글이나 PDF를 이 브라우저 안에서만 읽고, 고른 말투로 다시 배열합니다.</p>
          <textarea id="note" placeholder="외우고 싶은 노트, 기사, 강의 정리를 붙여 넣으세요.">${esc(studio.note)}</textarea>
          <div class="row">
            <label class="file">PDF · 텍스트 파일<input id="file" type="file" accept=".pdf,.txt,.md,text/plain,application/pdf" /></label>
            <button type="button" class="text-btn" data-action="sample-note">예시 노트 넣기</button>
          </div>
          <p class="quiet">${studio.parsing ? "PDF에서 문장을 읽는 중입니다." : studio.note ? `${studio.note.length.toLocaleString("ko-KR")}자` : "스캔본 PDF는 문장이 없을 수 있습니다."}</p>`
          : `${interestButtons(studio.interests, "studio-interest")}
          <input id="studio-keyword" type="text" maxlength="40" placeholder="오늘 꼭 듣고 싶은 주제 (선택)" value="${esc(studio.keyword)}" />`}
        <p class="label">목적</p>${choiceButtons(PURPOSE_OPTIONS, "purpose", studio.purpose)}
        <p class="label">말투</p>${choiceButtons(STYLE_OPTIONS, "style", studio.style)}
        <p class="label">난이도</p>${choiceButtons(LEVEL_OPTIONS, "level", studio.level)}
        <p class="label">분량</p>${minuteButtons(studio.minutes)}
        <div class="cta">
          <button type="button" class="btn primary" data-action="generate" ${state.loading ? "disabled" : ""}>${noteMode ? "자료로 만들기" : "관심사로 만들기"}</button>
        </div>
      </section>
      <section>
        <article class="features" style="margin-top:0;grid-template-columns:1fr">
          <article><strong>스크립트가 같이 남습니다</strong><p>재생 중인 문장이 가사처럼 표시되고, 원문과 나란히 볼 수 있습니다.</p></article>
          <article><strong>다시 만들 수 있습니다</strong><p>더 쉽게, 시험 핵심만, 대화로, 암기 반복처럼 방향을 바꿔 새 카드를 만듭니다.</p></article>
          <article><strong>자료는 기기에만</strong><p>노트와 PDF 원문은 이어런 서버로 전송되지 않습니다. 지식 글은 브라우저가 위키백과에서 직접 가져옵니다.</p></article>
        </article>
      </section>
    </div>`;
}

function viewArchive() {
  if (!state.cards.length) {
    return `<header class="page-head"><p class="eyebrow">기록</p><h1>아직 카드가 없습니다</h1><p class="lede">들은 오디오와 스크립트는 이 브라우저에 카드로 남습니다.</p></header>`;
  }
  return `<header class="page-head"><p class="eyebrow">기록</p><h1>날짜별 학습 카드</h1><p class="quiet">스크립트, 출처, 들은 정도가 함께 저장됩니다.</p></header>${state.cards.map(archiveCard).join("")}`;
}

function archiveCard(card) {
  const when = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(card.createdAt));
  const progress = Math.round((card.progress || 0) * 100);
  return `<article class="acard">
    <button type="button" data-action="open-card" data-id="${esc(card.id)}">
      <span class="acard-top">
        ${card.cover ? `<img src="${esc(card.cover)}" alt="">` : `<span class="mono">${esc((card.title || "이").slice(0, 1))}</span>`}
        <span><strong>${esc(card.title)}</strong><em>${esc(when)} · ${esc(card.dek || "")}</em></span>
      </span>
      <span class="meter" aria-label="들은 정도 ${progress}%"><span style="width:${progress}%"></span></span>
    </button>
    <button type="button" class="text-btn" data-action="delete-card" data-id="${esc(card.id)}">삭제</button>
  </article>`;
}

function viewMe() {
  const profile = state.profile || DEFAULT_PROFILE;
  return `<header class="page-head"><p class="eyebrow">마이</p><h1>루틴과 소개</h1></header>
    <div class="split">
      <section class="panel">
        <p class="label">이름</p>
        <input id="me-name" type="text" maxlength="20" value="${esc(profile.name === "게스트" ? "" : profile.name)}" placeholder="게스트" />
        <p class="label">관심사</p>
        ${interestButtons(profile.interests || [], "me-interest")}
        <input id="me-keyword" type="text" maxlength="40" placeholder="직접 입력 주제" value="${esc(profile.keyword || "")}" />
        <p class="label">목적</p>${choiceButtons(PURPOSE_OPTIONS, "purpose", profile.purpose)}
        <p class="label">말투</p>${choiceButtons(STYLE_OPTIONS, "style", profile.style)}
        <p class="label">난이도</p>${choiceButtons(LEVEL_OPTIONS, "level", profile.level)}
        <p class="label">분량</p>${minuteButtons(profile.minutes)}
        <p class="label">루틴 시간</p>
        <input id="me-routine" type="time" value="${esc(profile.routine || "08:00")}" />
        <div class="cta">
          <button type="button" class="btn ghost" data-action="notify">알림 ${profile.notify === "granted" ? "켜짐" : "켜기"}</button>
          <button type="button" class="btn primary" data-action="save-me">저장</button>
        </div>
        <button type="button" class="text-btn" data-action="reset">이 기기의 기록 지우기</button>
      </section>
      <section class="panel">
        <p class="eyebrow">서비스</p>
        <h2>이어런</h2>
        <p class="lede">사용자가 읽어야 하는 콘텐츠를, 귀가 자유로운 시간에 듣는 학습으로 바꿉니다.</p>
        <ol>
          <li>관심사와 최신 공개 문서를 라디오·대화·강의·암기로 재구성합니다.</li>
          <li>재생과 동시에 스크립트, 원문 비교, 이미지, 출처를 보여 줍니다.</li>
          <li>정한 시간에 알리고, 날짜별 카드로 다시 듣게 합니다.</li>
          <li>PDF와 노트는 서버에 올리지 않고 이 브라우저에서 변환합니다.</li>
        </ol>
        <div class="cta"><a class="btn ghost" href="./earun-brief.pdf">소개 자료 PDF</a></div>
      </section>
    </div>`;
}

function coverHtml(image, title) {
  if (image) return `<div class="cover"><img src="${esc(image)}" alt="${esc(title)}"></div>`;
  return `<div class="cover"><span class="mono">${esc((title || "이").slice(0, 1))}</span></div>`;
}

function termHtml(terms) {
  if (!terms?.length) return "";
  return `<div class="terms">${terms.map((term) => `<span>${esc(term)}</span>`).join("")}</div>`;
}

function factHtml(facts) {
  if (!facts?.length) return "";
  return `<ul class="facts">${facts.map((fact) => `<li><p>${esc(fact.text)}</p><small>${esc(fact.source || "")}</small></li>`).join("")}</ul>`;
}

function sourceHtml(source) {
  const thumb = source.image
    ? `<img src="${esc(source.image)}" alt="">`
    : `<span class="mono">${esc((source.title || "출").slice(0, 1))}</span>`;
  const inner = `${thumb}<span><strong>${esc(source.title)}</strong><em>${esc(source.provider || "")}</em></span>`;
  if (!source.url) return `<div class="src">${inner}</div>`;
  return `<a class="src" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
}

function choiceButtons(options, group, current) {
  return `<div class="choices">${options.map((item) => `<button type="button" class="chip ${item.id === current ? "is-on" : ""}" data-action="pick" data-group="${group}" data-value="${item.id}"><b>${esc(item.label)}</b><small>${esc(item.hint)}</small></button>`).join("")}</div>`;
}

function minuteButtons(current) {
  const labels = { 5: "짧게", 10: "보통", 20: "길게" };
  return `<div class="choices">${MINUTES.map((minutes) => `<button type="button" class="chip ${Number(current) === minutes ? "is-on" : ""}" data-action="pick" data-group="minutes" data-value="${minutes}"><b>${minutes}분</b><small>${labels[minutes]}</small></button>`).join("")}</div>`;
}

function interestButtons(selected, action) {
  return `<div class="choices">${INTERESTS.map((item) => `<button type="button" class="chip ${selected?.includes(item.id) ? "is-on" : ""}" data-action="${action}" data-id="${item.id}"><b>${esc(item.label)}</b><small>${esc(item.hint)}</small></button>`).join("")}</div>`;
}

function rateButton(rate, label) {
  return `<button type="button" data-action="rate" data-rate="${rate}" class="${state.rate === rate ? "is-on" : ""}">${label}</button>`;
}

function captureFields() {
  const read = (selector) => document.querySelector(selector);
  const name = read("#wiz-name");
  if (name && state.draft) state.draft.name = name.value.trim();
  const keyword = read("#wiz-keyword");
  if (keyword && state.draft) state.draft.keyword = keyword.value.trim();
  const routine = read("#wiz-routine");
  if (routine && state.draft) state.draft.routine = routine.value || state.draft.routine;
  const meName = read("#me-name");
  if (meName && state.profile && meName.value.trim()) state.profile.name = meName.value.trim();
  const meKeyword = read("#me-keyword");
  if (meKeyword && state.profile) state.profile.keyword = meKeyword.value.trim();
  const meRoutine = read("#me-routine");
  if (meRoutine && state.profile && meRoutine.value) state.profile.routine = meRoutine.value;
  const note = read("#note");
  if (note && state.studio) state.studio.note = note.value;
  const studioKeyword = read("#studio-keyword");
  if (studioKeyword && state.studio) state.studio.keyword = studioKeyword.value.trim();
}

function bucketForPick() {
  if (state.view === "setup") return state.draft;
  if (state.view === "create") return state.studio;
  return state.profile;
}

function toggleInterest(listName, id) {
  const bucket = listName === "wiz-interest" ? state.draft : listName === "studio-interest" ? state.studio : state.profile;
  if (!bucket) return;
  const current = new Set(bucket.interests || []);
  if (current.has(id)) current.delete(id);
  else current.add(id);
  bucket.interests = INTERESTS.map((item) => item.id).filter((item) => current.has(item));
  if (listName === "me-interest") persist(state);
  render();
}

async function onClick(event) {
  const el = event.target.closest("[data-action]");
  if (!el) return;
  captureFields();
  const action = el.dataset.action;
  if (state.loading && ["generate", "start-guest", "wizard-next", "feedback", "routine-play"].includes(action)) return;
  if (state.view === "me" && action !== "reset") persist(state);
  try {
    if (action === "nav") go(el.dataset.view);
    else if (action === "start-guest") await startGuest();
    else if (action === "start-setup") {
      state.draft = blankDraft();
      go("setup");
    } else if (action === "wizard-back") {
      if (state.draft.step === 0) go("welcome");
      else {
        state.draft.step -= 1;
        render();
      }
    } else if (action === "wizard-next") await wizardNext();
    else if (action === "wiz-interest" || action === "studio-interest" || action === "me-interest") toggleInterest(action, el.dataset.id);
    else if (action === "pick") {
      const bucket = bucketForPick();
      if (!bucket) return;
      bucket[el.dataset.group] = el.dataset.group === "minutes" ? Number(el.dataset.value) : el.dataset.value;
      if (state.view === "me") persist(state);
      render();
    } else if (action === "notify") await enableNotify();
    else if (action === "generate") await generateFromCurrent();
    else if (action === "routine-play") await routinePlay();
    else if (action === "open-card") openCard(el.dataset.id);
    else if (action === "delete-card") deleteCard(el.dataset.id);
    else if (action === "toggle") {
      if (state.playing) stopPlayback();
      else startPlayback(Math.min(state.lineIndex, (state.episode?.lines.length || 1) - 1));
    } else if (action === "restart") startPlayback(0);
    else if (action === "jump") startPlayback(Number(el.dataset.i));
    else if (action === "scrub") scrub(event, el);
    else if (action === "rate") setRate(Number(el.dataset.rate));
    else if (action === "compare") toggleCompare();
    else if (action === "feedback") await regenerate(el.dataset.feedback);
    else if (action === "mode") {
      state.studio.mode = el.dataset.mode;
      render();
    } else if (action === "sample-note") {
      state.studio.mode = "note";
      state.studio.note = SAMPLE_NOTE;
      state.studio.noteTitle = "소비자물가지수";
      render();
    } else if (action === "save-me") {
      persist(state);
      toast("루틴을 저장했습니다.");
    } else if (action === "dismiss-error") {
      state.error = "";
      if (state.episode) render();
      else go(state.profile ? "today" : "welcome");
    } else if (action === "reset") resetAll();
  } catch {
    state.loading = false;
    toast("잠시 문제가 생겼습니다. 다시 시도해 주세요.");
  }
}

async function onChange(event) {
  const input = event.target;
  if (input.id !== "file" || !input.files?.[0]) return;
  const file = input.files[0];
  ensureStudio();
  state.studio.parsing = true;
  state.studio.mode = "note";
  render();
  try {
    const pdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";
    const text = pdf ? await extractPdf(file) : await file.text();
    if (!text.trim()) toast("텍스트를 찾지 못했습니다. 스캔본이면 문장을 붙여 넣어 주세요.");
    state.studio.note = text.slice(0, 8000);
    state.studio.noteTitle = file.name.replace(/\.[^.]+$/, "");
  } catch {
    toast("파일을 읽지 못했습니다. 문장을 붙여 넣어 주세요.");
  } finally {
    state.studio.parsing = false;
    render();
  }
}

function onKey(event) {
  if (event.code !== "Space") return;
  const tag = event.target.tagName;
  if (["INPUT", "TEXTAREA", "BUTTON", "A", "SELECT"].includes(tag)) return;
  if (state.view !== "player" && !state.playing) return;
  event.preventDefault();
  if (state.playing) stopPlayback();
  else if (state.episode) startPlayback(Math.min(state.lineIndex, state.episode.lines.length - 1));
}

async function startGuest() {
  state.profile = { ...DEFAULT_PROFILE, interests: [...DEFAULT_PROFILE.interests] };
  persist(state);
  await generateAndOpen();
}

async function wizardNext() {
  if (state.draft.step === 1 && state.draft.interests.length === 0 && !state.draft.keyword) {
    toast("관심사를 하나 고르거나, 주제를 적어 주세요.");
    return;
  }
  if (state.draft.step < 3) {
    state.draft.step += 1;
    render();
    return;
  }
  state.profile = {
    name: state.draft.name || "게스트",
    interests: state.draft.interests.length ? [...state.draft.interests] : ["tech"],
    keyword: state.draft.keyword,
    purpose: state.draft.purpose,
    style: state.draft.style,
    level: state.draft.level,
    minutes: Number(state.draft.minutes) || 5,
    routine: state.draft.routine || "08:00",
    notify: state.draft.notify || "default",
  };
  persist(state);
  await generateAndOpen();
}

async function generateFromCurrent() {
  const noteMode = state.view === "create" && state.studio?.mode === "note";
  const note = noteMode ? (state.studio.note || "").trim() : "";
  if (noteMode && note.length < 20) {
    toast("조금 더 긴 문장을 넣어 주세요.");
    return;
  }
  if (!noteMode && state.view === "create" && state.studio && state.studio.interests.length === 0 && !state.studio.keyword) {
    toast("관심사를 하나 고르거나, 주제를 적어 주세요.");
    return;
  }
  await generateAndOpen({ note, noteTitle: state.studio?.noteTitle || "내 학습 자료" });
}

async function routinePlay() {
  const today = seoulKey();
  const card = state.cards.find((item) => seoulKey(new Date(item.createdAt)) === today);
  if (card) {
    state.episode = card;
    state.lineIndex = 0;
    go("player");
    return;
  }
  await generateAndOpen();
}

async function regenerate(feedback) {
  if (!state.episode) return;
  const sources = (state.episode.sources || []).filter((source) => source.kind !== "english" && source.provider !== "이어런 영어 교재");
  await generateAndOpen({ feedback, sources });
}

async function generateAndOpen({ note = "", noteTitle = "내 학습 자료", feedback = "", sources = null } = {}) {
  if (state.loading) return;
  stopPlayback();
  const useStudio = !feedback && state.view === "create" && state.studio;
  if (useStudio && state.profile) {
    const patch = {
      purpose: state.studio.purpose,
      style: state.studio.style,
      level: state.studio.level,
      minutes: state.studio.minutes,
      keyword: state.studio.keyword,
    };
    if (!note) patch.interests = [...state.studio.interests];
    state.profile = { ...state.profile, ...patch };
  }
  const profile = {
    ...(feedback && state.episode?.profileSnapshot ? state.episode.profileSnapshot : state.profile),
    noteOnly: Boolean(note) || Boolean(feedback && state.episode?.profileSnapshot?.noteOnly),
  };
  if (!profile) return;
  state.loading = true;
  state.error = "";
  state.lineIndex = 0;
  state.compare = false;
  go("player");
  try {
    let nextSources = sources;
    if (!nextSources) {
      nextSources = note
        ? [{
            title: noteTitle || "내 학습 자료",
            url: "",
            image: "",
            extract: note.slice(0, 8000),
            provider: "내가 올린 자료",
            kind: "upload",
            offline: false,
          }]
        : await gatherSources(profile);
    }
    const episode = composeEpisode({ profile, sources: nextSources, feedback });
    episode.id = crypto.randomUUID();
    episode.createdAt = Date.now();
    episode.progress = 0;
    state.cards.unshift(episode);
    state.cards = state.cards.slice(0, 24);
    state.episode = episode;
    persist(state);
  } catch {
    state.error = "오디오를 만들지 못했습니다. 주제를 바꾸거나 문장을 직접 넣어 주세요.";
  } finally {
    state.loading = false;
    render();
  }
}

function openCard(id) {
  const card = state.cards.find((item) => item.id === id);
  if (!card) return;
  stopPlayback();
  state.episode = card;
  state.lineIndex = 0;
  state.error = "";
  go("player");
}

function deleteCard(id) {
  const card = state.cards.find((item) => item.id === id);
  if (!card || !window.confirm(`‘${card.title}’ 카드를 지울까요?`)) return;
  if (state.episode?.id === id) stopPlayback();
  state.cards = state.cards.filter((item) => item.id !== id);
  if (state.episode?.id === id) state.episode = state.cards[0] || null;
  persist(state);
  render();
}

function resetAll() {
  if (!window.confirm("이 브라우저에 저장된 루틴과 카드를 모두 지울까요?")) return;
  stopPlayback();
  clearStore();
  state.profile = null;
  state.cards = [];
  state.episode = null;
  state.draft = null;
  state.studio = null;
  go("welcome");
}

async function enableNotify() {
  if (!("Notification" in window)) {
    toast("이 브라우저는 알림을 지원하지 않습니다.");
    return;
  }
  const permission = await Notification.requestPermission();
  if (state.draft) state.draft.notify = permission;
  if (state.profile) {
    state.profile.notify = permission;
    persist(state);
  }
  const node = document.querySelector("#notify-state");
  if (node) node.textContent = permission === "granted" ? "알림이 켜져 있습니다." : "알림이 꺼져 있습니다. 열 때마다 카드로 안내합니다.";
  toast(permission === "granted" ? "알림을 켰습니다." : "알림을 허용하지 않아도 앱 안에서는 안내합니다.");
}

function checkRoutine() {
  const profile = state.profile;
  if (!profile?.routine || state.loading || state.playing) return;
  if (!isDue(profile.routine)) return;
  const key = seoulKey();
  const done = state.cards.some((card) => seoulKey(new Date(card.createdAt)) === key && (card.progress || 0) >= 0.8);
  if (done) return;
  if (state.view === "today" && !document.querySelector(".banner")) render();
  if (profile.notify === "granted" && "Notification" in window && Notification.permission === "granted" && state.notifiedOn !== key) {
    state.notifiedOn = key;
    localStorage.setItem("earun.notified", key);
    const who = profile.name && profile.name !== "게스트" ? `${profile.name} 님, ` : "";
    const notice = new Notification("이어런", { body: `${who}오늘의 오디오가 준비됐습니다.` });
    notice.onclick = () => {
      window.focus();
      go("today");
    };
  }
}

function listenedMinutes() {
  return state.cards.reduce((sum, card) => sum + Math.round((card.estimate || 0) * (card.progress || 0)), 0);
}

function setRate(rate) {
  state.rate = rate;
  document.querySelectorAll("[data-action=rate]").forEach((button) => {
    button.classList.toggle("is-on", Number(button.dataset.rate) === rate);
  });
}

function toggleCompare() {
  state.compare = !state.compare;
  document.querySelector(".player")?.classList.toggle("is-compare", state.compare);
  document.querySelector("[data-action=compare]")?.classList.toggle("is-on", state.compare);
}

function scrub(event, el) {
  if (!state.episode?.lines?.length) return;
  const rect = el.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  const index = Math.floor(ratio * (state.episode.lines.length - 1));
  startPlayback(index);
}

function setActiveLine(index, scroll) {
  document.querySelectorAll(".line").forEach((node) => {
    node.classList.toggle("is-on", Number(node.dataset.i) === index);
  });
  const live = document.querySelector("#live");
  if (live) live.textContent = `${index + 1}번째 문장`;
  const count = document.querySelector("#count");
  if (count && state.episode) count.textContent = `${index + 1} / ${state.episode.lines.length}`;
  syncTransport();
  if (scroll) document.querySelector(`.line[data-i="${index}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function syncTransport() {
  document.querySelectorAll("[data-action=toggle]").forEach((button) => {
    button.textContent = state.playing ? "일시정지" : "재생";
    button.setAttribute("aria-pressed", String(state.playing));
  });
  document.querySelector(".wave")?.classList.toggle("is-on", state.playing);
  const total = state.episode?.lines?.length || 1;
  const width = Math.min(100, (Math.min(state.lineIndex, total) / total) * 100);
  const bar = document.querySelector(".scrub > span");
  if (bar) bar.style.width = `${width}%`;
}

function markProgress() {
  if (!state.episode) return;
  const card = state.cards.find((item) => item.id === state.episode.id);
  if (!card) return;
  const total = state.episode.lines.length || 1;
  card.progress = Math.max(card.progress || 0, Math.min(1, state.lineIndex / total));
  persist(state);
}

async function startPlayback(index) {
  if (!state.episode?.lines?.length || state.loading) return;
  if (!window.speechSynthesis) {
    toast("이 브라우저는 음성 합성을 지원하지 않습니다. Chrome을 권합니다.");
    return;
  }
  const my = ++token;
  window.speechSynthesis.cancel();
  await wait(120);
  if (my !== token) return;
  state.playing = true;
  syncTransport();
  const voices = await loadVoices();
  const lines = state.episode.lines;
  const start = Math.max(0, Math.min(index, lines.length - 1));
  for (let i = start; i < lines.length; i += 1) {
    if (my !== token) return;
    state.lineIndex = i;
    setActiveLine(i, true);
    await speak(lines[i], voices, my);
    if (my !== token) return;
    if (lines[i].pauseMs) await wait(lines[i].pauseMs);
  }
  if (my !== token) return;
  state.playing = false;
  state.lineIndex = lines.length;
  markProgress();
  syncTransport();
  toast("끝까지 들었습니다. 카드에 남겨 두었습니다.");
}

function stopPlayback() {
  token += 1;
  window.speechSynthesis?.cancel();
  const wasPlaying = state.playing;
  state.playing = false;
  if (wasPlaying || state.lineIndex > 0) markProgress();
  syncTransport();
}

function speak(line, voices, my) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearInterval(kick);
      resolve();
    };
    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.lang = line.lang || "ko-KR";
    const voice = pickVoice(utterance.lang, voices);
    if (voice) {
      utterance.voice = voice;
      state.voiceLabel = voice.name;
      const label = document.querySelector("#voice");
      if (label) label.textContent = voice.name;
    }
    utterance.rate = state.rate;
    utterance.onend = finish;
    utterance.onerror = finish;
    const limit = 4000 + (line.text.length * 160) / Math.max(0.85, state.rate);
    const timer = setTimeout(() => {
      window.speechSynthesis.cancel();
      finish();
    }, limit);
    const kick = setInterval(() => {
      if (my !== token || settled) return;
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    }, 10000);
    window.speechSynthesis.speak(utterance);
  });
}

function loadVoices() {
  return new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length) {
      resolve(existing);
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", finish, { once: true });
    setTimeout(finish, 700);
  });
}

function pickVoice(lang, voices) {
  const prefix = lang.toLowerCase().slice(0, 2);
  const list = voices.filter((voice) => voice.lang.toLowerCase().startsWith(prefix));
  return list.find((voice) => /yuna|sora|heami|google/i.test(voice.name)) || list.find((voice) => voice.localService) || list[0] || null;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toast(message) {
  let node = document.querySelector(".toast");
  if (!node) {
    node = document.createElement("div");
    node.className = "toast";
    document.body.appendChild(node);
  }
  node.textContent = message;
  node.classList.add("is-on");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("is-on"), 2600);
}

boot();
