const SENSITIVE = /자살|피살|사망|숨졌|숨진|사상자|성폭|학살|테러|음란|포르노|강간|시신|미사일|공습|피격|총격/;

export const INTERESTS = [
  { id: "tech", label: "테크", hint: "인공지능, 반도체" },
  { id: "economy", label: "경제", hint: "물가, 금리" },
  { id: "sports", label: "스포츠", hint: "대회와 규칙" },
  { id: "english", label: "영어", hint: "바로 쓰는 표현" },
  { id: "science", label: "과학", hint: "기후, 자연" },
  { id: "society", label: "시사", hint: "배경이 되는 소식" },
];

export const PURPOSE_OPTIONS = [
  { id: "commute", label: "통학·출퇴근", hint: "화면 없이 장면으로" },
  { id: "exam", label: "시험 대비", hint: "정의와 확인 질문" },
  { id: "english", label: "영어", hint: "표현을 겹쳐 듣기" },
  { id: "news", label: "뉴스 브리핑", hint: "배경부터 짧게" },
];

export const STYLE_OPTIONS = [
  { id: "radio", label: "라디오", hint: "진행자가 장면을 잇습니다" },
  { id: "dialogue", label: "대화", hint: "둘이 번갈아 설명합니다" },
  { id: "lecture", label: "강의", hint: "수업처럼 번호를 붙입니다" },
  { id: "memory", label: "암기", hint: "핵심 문장을 반복합니다" },
];

export const LEVEL_OPTIONS = [
  { id: "beginner", label: "초급", hint: "짧게 풀어서" },
  { id: "intermediate", label: "중급", hint: "기본 속도의 설명" },
  { id: "advanced", label: "고급", hint: "문장을 더 담아서" },
];

export const MINUTES = [5, 10, 20];

export const PURPOSES = Object.fromEntries(PURPOSE_OPTIONS.map((item) => [item.id, item.label]));
export const STYLES = Object.fromEntries(STYLE_OPTIONS.map((item) => [item.id, item.label]));
export const LEVELS = Object.fromEntries(LEVEL_OPTIONS.map((item) => [item.id, item.label]));

export const DEFAULT_PROFILE = {
  name: "게스트",
  interests: ["tech", "english"],
  keyword: "",
  purpose: "commute",
  style: "radio",
  level: "intermediate",
  minutes: 5,
  routine: "08:00",
  notify: "default",
};

const QUERIES = {
  tech: ["클라우드 컴퓨팅", "반도체", "로봇", "인공지능"],
  economy: ["환율", "국내총생산", "기준금리", "인플레이션"],
  sports: ["마라톤", "FIFA 월드컵", "올림픽"],
  science: ["광합성", "태양계", "백신", "기후 변화"],
  society: ["저작권", "선거 제도", "국제 연합", "윤초"],
};

const KNOWN_TERMS = ["인공지능", "인플레이션", "기준금리", "기후 변화", "윤초", "반도체", "환율", "광합성", "올림픽"];

const REACTIONS = {
  exam: [
    "시험이면 이 문장을 정의로 표시해 두세요.",
    "숫자는 따로 적고, 문장은 소리로 남기면 됩니다.",
    "선택지에서 헷갈리면 이 정의로 돌아오세요.",
  ],
  commute: [
    "지금은 이해만 하고 지나가도 됩니다.",
    "도착해서 카드의 한 줄만 다시 보면 충분합니다.",
    "눈은 길 위에 두고, 귀만 따라오면 됩니다.",
  ],
  english: [
    "한국어 뜻을 먼저 떠올리고 영어를 붙여 보세요.",
    "완벽하지 않아도 입으로 한 번 말하면 남습니다.",
    "오늘 표현은 카드에서 다시 볼 수 있습니다.",
  ],
  news: [
    "평가는 잠시 미루고, 설명 문장만 가져가세요.",
    "배경을 먼저 들으면 이어서 읽는 글이 빨라집니다.",
    "출처 링크는 스크립트 아래에 남겨 둡니다.",
  ],
};

const ENGLISH = {
  beginner: [
    ["On my way.", "가는 길이에요."],
    ["Running a bit late.", "조금 늦고 있어요."],
    ["I'll be there in ten.", "십 분이면 도착해요."],
    ["Could you say that again?", "다시 한번 말해 주실래요?"],
    ["Let me think.", "잠깐 생각할게요."],
    ["Sounds good.", "좋아요."],
    ["Thanks for waiting.", "기다려 줘서 고마워요."],
    ["I got it.", "알겠어요."],
  ],
  intermediate: [
    ["I'll circle back this afternoon.", "오후에 다시 정리해서 말씀드릴게요."],
    ["The short version is this.", "짧게 말하면 이렇습니다."],
    ["I'm still getting up to speed.", "아직 파악하는 중입니다."],
    ["Could you walk me through it?", "차근차근 설명해 주실래요?"],
    ["Let's park that for now.", "그건 잠시 미뤄 두죠."],
    ["I see your point.", "무슨 말씀인지 알겠어요."],
    ["Can we take this offline?", "이 얘기는 따로 이어서 할까요?"],
    ["Thanks for flagging that.", "짚어 줘서 고마워요."],
  ],
  advanced: [
    ["The tradeoff is speed versus accuracy.", "속도와 정확도 사이의 균형이 핵심입니다."],
    ["We should pressure-test that assumption.", "그 가정은 한번 흔들어 검증해야 합니다."],
    ["That's directionally right.", "방향은 맞습니다."],
    ["Let's separate signal from noise.", "핵심과 잡음을 나누죠."],
    ["What's the constraint we're actually solving for?", "우리가 실제로 푸는 제약은 무엇인가요?"],
    ["I don't want to overfit to one example.", "한 사례에만 맞추고 싶지는 않습니다."],
    ["We can revisit once the data settles.", "데이터가 안정되면 다시 보죠."],
    ["I'd frame it as a learning problem.", "재능의 문제보다 학습의 문제로 보겠습니다."],
  ],
};

export const SAMPLE_NOTE = [
  "소비자물가지수는 가구가 자주 사는 상품과 서비스의 가격을 모아, 평균적인 물가 수준을 나타낸 지표다.",
  "기준 연도의 물가를 100으로 두고, 지금이 105라면 같은 바구니가 대략 5퍼센트 비싸진 것으로 읽는다.",
  "다만 내가 내는 월세나 학원비가 지수와 다르게 움직일 수 있다.",
  "지수에는 여러 품목이 서로 다른 가중치로 들어가기 때문이다.",
  "시험에서는 정의, 기준 연도의 의미, 체감 물가와 지표가 다를 수 있다는 점을 나누어 적으면 된다.",
].join(" ");

export const FALLBACK = {
  tech: sourcePack("인공지능", "tech", "인공지능은 기계가 데이터에서 패턴을 찾아 판단이나 생성을 수행하도록 만드는 기술입니다. 사람이 규칙을 일일이 적는 방식과 달리, 많은 예시를 보고 기준을 학습하는 방식이 최근의 중심입니다. 글을 요약하고 음성을 만들거나 사진을 설명하는 기능도 이 연장선에 있습니다. 다만 자연스러운 문장이 곧 정확한 사실은 아닙니다. 학습에 쓸 때는 출처를 옆에 두고, 숫자와 고유명사는 원문에서 다시 확인하는 편이 안전합니다. 오디오로 들을 때는 정의 한 문장과 주의점 한 문장만 남겨도 충분합니다."),
  economy: sourcePack("인플레이션", "economy", "인플레이션은 물가가 일정 기간에 걸쳐 전반적으로 오르는 현상입니다. 같은 돈으로 살 수 있는 물건의 양이 줄어든다고 이해하면 쉽습니다. 중앙은행은 물가 오름세가 가팔라지면 기준금리를 올려 소비와 대출을 늦추고, 경기가 크게 식으면 금리를 낮춰 활동을 돕습니다. 장바구니에서 느끼는 가격과 통계의 소비자물가지수가 늘 같지는 않습니다. 지수에는 여러 품목이 가중치와 함께 들어가기 때문입니다. 시험에서는 정의, 금리의 방향, 체감과 지표의 차이 세 가지를 나누어 기억하면 됩니다."),
  sports: sourcePack("올림픽", "sports", "올림픽은 여러 나라가 같은 규칙으로 겨루는 국제 종합 경기 대회입니다. 여름 대회와 겨울 대회로 나뉘고, 개최 도시는 경기장과 이동, 중계를 수년 전부터 준비합니다. 기록을 재는 종목과 토너먼트로 승자를 가리는 종목은 잘했다는 기준이 다릅니다. 규칙을 알고 들으면 중계가 결과 나열에서 이야기로 바뀝니다. 선수 한 명의 기록 뒤에는 예선과 결승, 실격 규정이 붙어 있습니다. 공부할 때는 대회 이름, 승리 조건, 올해의 변수 순서로 들으면 정리가 됩니다."),
  science: sourcePack("기후 변화", "science", "기후 변화는 수십 년 이상의 긴 시간 동안 기온과 강수, 바다의 상태가 달라지는 현상입니다. 하루하루의 더위나 추위인 날씨와는 구분해서 말해야 합니다. 지구 평균 기온이 오르면 폭염과 호우, 해수면의 변화가 달라질 수 있습니다. 원인을 볼 때는 자연의 변동과 사람의 활동으로 늘어난 온실가스를 나누는 것이 정확합니다. 뉴스의 폭염 기사 한 편이 곧 기후 전체의 결론은 아닙니다. 긴 기록의 경향과 오늘의 날씨를 다른 층으로 들으면 이해가 빨라집니다."),
  society: sourcePack("윤초", "society", "윤초는 원자시계가 재는 매우 고른 시간과 지구 자전에 맞춘 시간 사이에 쌓이는 차이를 1초 단위로 조정하는 장치입니다. 지구의 자전 속도는 늘 일정하지 않아서, 하루의 길이가 정확히 86400초로만 떨어지지 않습니다. 협정 세계시는 그 차이를 가끔 1초를 더하거나 빼는 방식으로 맞춰 왔습니다. 사람에게는 짧은 1초지만, 컴퓨터의 시각 처리에는 예외가 되어 장애의 원인이 되기도 합니다. 국제 사회는 윤초를 계속 둘지 시간 표준을 바꿀지 논의해 왔습니다. 시사를 들을 때는 사건보다 표준을 바꾸려는 이유까지 잡으면 글이 쉬워집니다."),
};

function sourcePack(title, id, extract) {
  return {
    title,
    url: "",
    image: "",
    extract,
    provider: "이어런 기본 브리핑",
    kind: "fallback",
    offline: true,
    interest: id,
  };
}

let reactionCursor = 0;

export function seoulKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function seoulYmd(date = new Date()) {
  return seoulKey(date).replaceAll("-", "/");
}

export function seoulLabel(date = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

export function isDue(routine, now = new Date()) {
  if (!routine || !routine.includes(":")) return false;
  const [h, m] = routine.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return false;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  const current = hour * 60 + minute;
  const target = h * 60 + m;
  return current >= target && current < target + 40;
}

export function queryFor(id, date = new Date()) {
  const list = QUERIES[id] || QUERIES.tech;
  const day = Number(seoulKey(date).slice(-2));
  return list[day % list.length];
}

export function cleanExtract(text) {
  return String(text || "")
    .replace(/\[[^\]]{0,80}\]/g, "")
    .replace(/\(영어:[^)]*\)/g, "")
    .replace(/\(발음:[^)]*\)/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function sentencesOf(text) {
  const cleaned = cleanExtract(text);
  if (!cleaned) return [];
  return cleaned
    .split(/\n+|(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 12 && !SENSITIVE.test(sentence));
}

export function isSensitive(text) {
  return SENSITIVE.test(String(text || ""));
}

export function resolveProfile(profile, feedback) {
  const noteOnly = Boolean(profile?.noteOnly);
  const next = {
    ...DEFAULT_PROFILE,
    ...profile,
    examples: false,
    tight: false,
    noteOnly,
    interests: noteOnly ? [] : [...(profile?.interests?.length ? profile.interests : DEFAULT_PROFILE.interests)],
  };
  next.minutes = Number(next.minutes) || 5;
  if (noteOnly && next.purpose === "english") next.purpose = "exam";
  if (feedback === "easier") next.level = "beginner";
  if (feedback === "exam") {
    next.purpose = "exam";
    next.tight = true;
  }
  if (feedback === "dialogue") next.style = "dialogue";
  if (feedback === "memory") next.style = "memory";
  if (feedback === "longer") next.minutes = next.minutes >= 10 ? 20 : 10;
  if (feedback === "examples") next.examples = true;
  return next;
}

export function estimateMinutes(lines) {
  const chars = lines.reduce((sum, line) => sum + (line.text?.length || 0), 0);
  const pauses = lines.reduce((sum, line) => sum + (line.pauseMs || 0), 0) / 60000;
  return Math.max(1, Math.round(chars / 310 + pauses));
}

export function streakFrom(cards, today = new Date()) {
  const days = new Set(
    (cards || [])
      .filter((card) => (card.progress || 0) >= 0.8)
      .map((card) => seoulKey(new Date(card.createdAt))),
  );
  let count = 0;
  let cursor = seoulKey(today);
  while (days.has(cursor) && count < 60) {
    count += 1;
    cursor = seoulKey(new Date(new Date(`${cursor}T12:00:00+09:00`).getTime() - 86400000));
  }
  return count;
}

export function composeEpisode({ profile, sources = [], feedback }) {
  reactionCursor = 0;
  const resolved = resolveProfile(profile, feedback);
  const knowledge = (sources || []).filter((source) => source && source.kind !== "english" && sentencesOf(source.extract).length);
  const hasEnglish = !resolved.noteOnly && (resolved.interests.includes("english") || resolved.purpose === "english");
  const lines = [];
  const body = [];
  const lead = hostOf(resolved.style);

  push(lines, {
    speaker: lead,
    text: opening(resolved, knowledge, hasEnglish),
    kind: "open",
  });

  let englishSource = null;
  if (hasEnglish) {
    const built = buildEnglish(resolved, knowledge.length > 0);
    built.lines.forEach((line) => {
      lines.push(line);
      if (line.kind === "en" || line.kind === "body") body.push(line);
    });
    englishSource = built.source;
  }

  const budget = perSourceBudget(resolved, Math.max(1, knowledge.length + (hasEnglish ? 1 : 0)));
  const pickedBySource = [];
  knowledge.forEach((source, index) => {
    const picked = pickSentences(sentencesOf(source.extract), budget + (resolved.level === "advanced" ? 1 : 0));
    if (!picked.length) return;
    pickedBySource.push(picked);
    addSourceSection(lines, body, source, index, resolved, picked);
  });

  addRecap(lines, resolved, pickedBySource);
  padToTarget(lines, body, resolved);
  push(lines, { speaker: lead, text: signoff(resolved), kind: "end" });

  const panelSources = [...knowledge];
  if (englishSource) panelSources.push(englishSource);
  const facts = knowledge.length
    ? knowledge.slice(0, 3).map((source) => ({
        text: sentencesOf(source.extract)[0] || source.title,
        source: source.title,
      }))
    : (englishSource?.phrases || []).slice(0, 3).map((phrase) => ({
        text: `${phrase.en} — ${phrase.ko}`,
        source: "영어",
      }));

  const title = episodeTitle(knowledge, hasEnglish);
  const estimate = estimateMinutes(lines);
  const wiki = knowledge.some((source) => source.kind === "wiki" || source.kind === "news");
  const offline = knowledge.some((source) => source.offline || source.kind === "fallback");

  return {
    title,
    dek: `${PURPOSES[resolved.purpose]} · 약 ${estimate}분 · ${STYLES[resolved.style]} · ${LEVELS[resolved.level]}`,
    estimate,
    targetMinutes: resolved.minutes,
    style: resolved.style,
    level: resolved.level,
    purpose: resolved.purpose,
    cover: knowledge.find((source) => source.image)?.image || "",
    facts,
    terms: termsFrom(knowledge, hasEnglish),
    lines,
    sources: panelSources,
    offlineNote: offline ? "일부 장면은 문서를 가져오지 못해 이어런 기본 브리핑으로 채웠습니다." : "",
    attribution: wiki ? "원문 일부는 한국어 위키백과(CC BY-SA 4.0)를 학습용으로 재구성했습니다." : "",
    profileSnapshot: {
      name: resolved.name,
      interests: resolved.noteOnly ? [] : (profile?.interests?.length ? profile.interests : resolved.interests),
      keyword: profile?.keyword || "",
      purpose: profile?.purpose || resolved.purpose,
      style: profile?.style || resolved.style,
      level: profile?.level || resolved.level,
      minutes: Number(profile?.minutes) || resolved.minutes,
      routine: profile?.routine || resolved.routine,
      notify: profile?.notify || "default",
      noteOnly: Boolean(profile?.noteOnly),
    },
    feedback: feedback || "",
  };
}

export function scriptText(episode) {
  return episode.lines.map((line) => `${line.speaker}: ${line.text}`).join("\n");
}

function episodeTitle(sources, hasEnglish) {
  const topic = sources[0] ? clipText(sources[0].title, 28) : "";
  if (topic && hasEnglish) return `${topic} · 영어`;
  if (topic) return topic;
  if (hasEnglish) return "오늘 따라 할 영어";
  return "오늘의 이어런";
}

function opening(profile, sources, hasEnglish) {
  const topics = [];
  if (hasEnglish) topics.push("영어 표현");
  sources.slice(0, 2).forEach((source) => topics.push(source.title));
  const topicText = topics.length ? topics.join(", ") : "오늘";
  const purposeLine = {
    exam: "시험 전에 정의와 핵심 문장 위주로 듣습니다.",
    commute: "이동 중에도 끊기지 않게 장면을 짧게 나눴습니다. 화면은 보지 않아도 됩니다.",
    english: "듣고 바로 따라 할 수 있게 짧게 겹쳐 듣습니다.",
    news: "긴 글에 들어가기 전에, 배경이 되는 설명부터 듣습니다.",
  }[profile.purpose];
  return `${callName(profile.name)}, 이어런입니다. 오늘은 ${topicText} 이야기를 듣습니다. ${purposeLine}`;
}

function signoff(profile) {
  const who = profile.name && profile.name !== "게스트" ? `${profile.name} 님, ` : "";
  return `${who}스크립트와 출처는 오늘 카드에 남겨 두었습니다. 이어런이었습니다.`;
}

function callName(name) {
  if (!name || name === "게스트") return "안녕하세요";
  return `${name} 님`;
}

function hostOf(style) {
  if (style === "dialogue") return "하나";
  if (style === "lecture") return "교수";
  if (style === "memory") return "코치";
  return "진행";
}

function buddyOf(style) {
  return style === "dialogue" ? "준" : hostOf(style);
}

function perSourceBudget(profile, slots) {
  if (profile.tight) return 2;
  const total = { 5: 6, 10: 10, 20: 14 }[profile.minutes] || 6;
  return Math.max(2, Math.ceil(total / slots));
}

function addSourceSection(lines, body, source, index, profile, picked) {
  const lead = hostOf(profile.style);
  const buddy = buddyOf(profile.style);
  const order = ["첫", "두", "세", "네"][index] || `${index + 1}`;
  const bridge = {
    lecture: `${order} 번째 주제는 ${source.title}입니다.`,
    dialogue: `${source.title}, 같이 들어 볼까요?`,
    memory: `${source.title}에서 외울 문장만 골랐습니다.`,
    radio: `${order} 번째 장면은 ${source.title}입니다.`,
  }[profile.style];
  push(lines, { speaker: lead, text: bridge, kind: "bridge", origin: picked[0] || "" });

  picked.forEach((sentence, indexInSection) => {
    const speaker = profile.style === "dialogue" && indexInSection % 2 ? buddy : lead;
    const spoken = profile.level === "beginner" ? ease(sentence) : sentence;
    const line = push(lines, { speaker, text: spoken, kind: "body", origin: sentence });
    body.push(line);
    if (profile.level === "beginner") {
      const short = shortForm(sentence);
      if (short) push(lines, { speaker: buddy, text: short, kind: "note", origin: sentence });
    }
    if (profile.style === "memory") {
      push(lines, { speaker: lead, text: `한 번 더 듣습니다. ${spoken}`, kind: "body", origin: sentence });
    } else if (profile.minutes >= 20) {
      push(lines, { speaker: buddy, text: `다시 한 줄로 남기면, ${clipText(spoken, 90)}`, kind: "note", origin: sentence });
    } else if (profile.style === "dialogue" && indexInSection % 2 === 1) {
      push(lines, { speaker: buddy, text: reaction(profile), kind: "note" });
    }
  });

  if (profile.examples && picked[0]) {
    push(lines, { speaker: buddy, text: exampleLine(picked[0]), kind: "note", origin: picked[0] });
  }

  const uploaded = source.kind === "upload";
  const credit = uploaded
    ? "이 장면은 직접 올린 자료를 학습용으로 다시 배열한 것입니다."
    : source.offline || source.kind === "fallback"
      ? "이 구간은 문서를 불러오지 못해 이어런 기본 브리핑으로 읽습니다."
      : `출처는 ${source.provider}의 ${source.title} 문서입니다.`;
  push(lines, { speaker: lead, text: credit, kind: "note" });
}

function addRecap(lines, profile, pickedBySource) {
  const keys = pickedBySource.map((list) => list[0]).filter(Boolean).slice(0, 3);
  if (!keys.length) return;
  const lead = hostOf(profile.style);
  const ordinal = ["하나", "둘", "셋"];
  push(lines, { speaker: lead, text: "오늘 남길 문장입니다.", kind: "recap" });
  keys.forEach((sentence, index) => {
    push(lines, { speaker: lead, text: `${ordinal[index]}, ${sentence}`, kind: "recap", origin: sentence });
  });
  if (profile.purpose === "exam" || profile.tight) {
    push(lines, {
      speaker: lead,
      text: "확인입니다. 각 문장을 정의처럼 한 줄로 말해 보세요. 일시정지를 눌러도 됩니다.",
      kind: "recap",
    });
  }
}

function padToTarget(lines, body, profile) {
  if (profile.tight || !body.length) return;
  if (estimateMinutes(lines) >= profile.minutes * 0.72) return;
  const lead = hostOf(profile.style);
  push(lines, { speaker: lead, text: "방금 들은 핵심만 한 번 더 지나갑니다.", kind: "recap" });
  for (const line of body) {
    if (lines.length > 72 || estimateMinutes(lines) >= profile.minutes) break;
    lines.push({ ...line, pauseMs: 0 });
  }
}

function buildEnglish(profile, hasSources) {
  const bank = ENGLISH[profile.level] || ENGLISH.intermediate;
  const count = englishCount(profile.minutes, hasSources, profile.tight);
  const phrases = bank.slice(0, Math.min(count, bank.length)).map(([en, ko]) => ({ en, ko }));
  const host = hostOf(profile.style);
  const buddy = buddyOf(profile.style);
  const lines = [];
  push(lines, {
    speaker: host,
    text: "이어서 짧게 따라 하는 영어입니다. 영어 문장 뒤에 한국어 뜻을 붙입니다.",
    kind: "bridge",
  });
  phrases.forEach((phrase) => {
    const spoken = push(lines, { speaker: host, text: phrase.en, lang: "en-US", kind: "en", origin: phrase.ko, pauseMs: 800 });
    push(lines, { speaker: buddy, text: phrase.ko, kind: "body", origin: phrase.en });
    if (profile.style === "memory" || profile.minutes >= 10) {
      push(lines, { speaker: host, text: phrase.en, lang: "en-US", kind: "en", origin: phrase.ko, pauseMs: profile.style === "memory" ? 700 : 0 });
    }
    void spoken;
  });
  return {
    lines,
    source: {
      title: "오늘 따라 할 표현",
      url: "",
      image: "",
      extract: phrases.map((phrase) => `${phrase.en} ${phrase.ko}`).join(" "),
      provider: "이어런 영어 교재",
      kind: "english",
      phrases,
    },
  };
}

function englishCount(minutes, hasSources, tight) {
  if (tight) return 3;
  if (hasSources) return minutes >= 20 ? 5 : minutes >= 10 ? 4 : 3;
  return minutes >= 20 ? 8 : minutes >= 10 ? 6 : 5;
}

function push(lines, partial) {
  const bits = splitSpeakable(partial.text);
  let last = null;
  bits.forEach((text, index) => {
    last = {
      speaker: partial.speaker,
      text,
      lang: partial.lang || "ko-KR",
      origin: index === 0 ? partial.origin || "" : "",
      pauseMs: index === bits.length - 1 ? partial.pauseMs || 0 : 0,
      kind: partial.kind || "body",
    };
    lines.push(last);
  });
  return last;
}

function splitSpeakable(text, max = 180) {
  const source = String(text || "").trim();
  if (!source) return [];
  if (source.length <= max) return [source];
  const bits = source.split(/(?<=,|，)\s*/);
  const chunks = [];
  let current = "";
  bits.forEach((bit) => {
    const next = current ? `${current} ${bit}` : bit;
    if (next.length > max && current) {
      chunks.push(current.trim());
      current = bit;
    } else {
      current = next;
    }
  });
  if (current.trim()) chunks.push(current.trim());
  return chunks.flatMap((part) => {
    if (part.length <= max + 30) return [part];
    const slices = [];
    for (let index = 0; index < part.length; index += max) slices.push(part.slice(index, index + max));
    return slices;
  });
}

function pickSentences(list, count) {
  if (list.length <= count) return list;
  const ranked = list.map((sentence, index) => ({ sentence, index, score: scoreSentence(sentence, index) }));
  const rest = ranked.slice(1).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, count - 1);
  return [ranked[0], ...rest].sort((a, b) => a.index - b.index).map((item) => item.sentence);
}

function scoreSentence(sentence, index) {
  let score = 0;
  if (index === 0) score += 5;
  if (index < 3) score += 2;
  if (sentence.length >= 40 && sentence.length <= 170) score += 2;
  if (/\d/.test(sentence)) score += 1;
  if (/이다|입니다|란|뜻|의미/.test(sentence)) score += 1;
  if (sentence.length > 220) score -= 2;
  return score;
}

function ease(sentence) {
  return sentence
    .replace(/즉,/g, "다시 말해,")
    .replace(/그러나/g, "하지만")
    .replace(/따라서/g, "그래서")
    .replace(/\([^)]{0,40}\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function shortForm(sentence) {
  const cut = sentence.split(/,|，/)[0].replace(/[.]+$/, "").trim();
  if (cut.length < 18 || cut.length > 70 || cut.length > sentence.length - 12) return "";
  if (!/(다|요|까|죠|니다|습니다)$/.test(cut)) return "";
  return `짧게 말하면, ${cut}.`;
}

function exampleLine(sentence) {
  const cut = clipText(sentence.split(/,|，/)[0], 42);
  return `예를 들어 이렇게 기억하면 됩니다. ${cut}.`;
}

function reaction(profile) {
  const list = REACTIONS[profile.purpose] || REACTIONS.commute;
  const line = list[reactionCursor % list.length];
  reactionCursor += 1;
  return line;
}

function termsFrom(sources, hasEnglish) {
  const text = sources.map((source) => `${source.title} ${source.extract}`).join(" ");
  const known = KNOWN_TERMS.filter((term) => text.includes(term));
  const acronyms = (text.match(/\b[A-Z]{2,6}\b/g) || []).filter((word) => !["CC", "BY", "SA"].includes(word));
  const terms = [...new Set([...known, ...acronyms])];
  if (hasEnglish) terms.unshift("영어 표현");
  return terms.slice(0, 4);
}

function clipText(text, max) {
  const value = String(text || "");
  return value.length > max ? `${value.slice(0, max).trim()}…` : value;
}
