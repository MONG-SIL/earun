const KEY = "earun.v1";

export function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function persist(state) {
  const data = {
    profile: state.profile,
    cards: (state.cards || []).slice(0, 24),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    data.cards = data.cards.slice(0, 6);
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* 저장 공간이 가득 차도 듣기는 계속됩니다. */
    }
  }
}

export function clearStore() {
  localStorage.removeItem(KEY);
  localStorage.removeItem("earun.notified");
}
