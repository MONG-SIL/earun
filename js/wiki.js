import { FALLBACK, cleanExtract, isSensitive, queryFor, seoulYmd, sentencesOf } from "./content.js";

export async function gatherSources(profile) {
  const interests = profile.interests?.length ? profile.interests : ["tech"];
  const queries = [];
  if (profile.keyword?.trim()) queries.push(profile.keyword.trim());
  interests.forEach((id) => {
    if (id === "english") return;
    queries.push(queryFor(id));
  });

  const sources = [];
  const seen = new Set();
  const push = (source) => {
    if (!source?.title || seen.has(source.title) || sources.length >= 3) return;
    if (!sentencesOf(source.extract).length) return;
    if (isSensitive(source.extract) || isSensitive(source.title)) return;
    seen.add(source.title);
    sources.push(source);
  };

  const wantNews = profile.purpose === "news" || interests.includes("society");
  if (wantNews) {
    try {
      const news = await fetchSafeNews();
      const onlySociety = interests.every((id) => id === "society" || id === "english");
      news.slice(0, onlySociety ? 2 : 1).forEach(push);
    } catch {
      /* 관심사 검색으로 이어집니다. */
    }
  }

  for (const query of queries) {
    if (sources.length >= 3) break;
    try {
      push(await fetchArticle(query));
    } catch {
      const interestId = Object.keys(FALLBACK).find((id) => queryFor(id) === query);
      const fallback = interestId ? FALLBACK[interestId] : null;
      if (fallback) push({ ...fallback });
    }
  }

  if (!sources.length && !interests.includes("english")) push({ ...FALLBACK.tech });
  return sources;
}

async function fetchArticle(query) {
  const url = new URL("https://ko.wikipedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    redirects: "1",
    generator: "search",
    gsrsearch: query,
    gsrlimit: "4",
    gsrnamespace: "0",
    prop: "extracts|pageimages|info",
    explaintext: "1",
    exchars: "3600",
    piprop: "thumbnail",
    pithumbsize: "960",
    inprop: "url",
  });
  const data = await getJson(url);
  const pages = Object.values(data.query?.pages || {}).filter(usablePage);
  pages.sort((a, b) => {
    const imageScore = (b.thumbnail ? 1 : 0) - (a.thumbnail ? 1 : 0);
    if (imageScore) return imageScore;
    return (b.extract?.length || 0) - (a.extract?.length || 0);
  });
  if (!pages[0]) throw new Error("empty");
  const source = toSource(pages[0], "한국어 위키백과", "wiki");
  if (!source.image) source.image = await fetchPageImage(source.title);
  return source;
}

async function fetchSafeNews() {
  const data = await getJson(`https://ko.wikipedia.org/api/rest_v1/feed/featured/${seoulYmd()}`);
  const items = [];
  for (const news of data.news || []) {
    const link = (news.links || []).find((item) => item?.extract || item?.title);
    if (!link) continue;
    const title = link.titles?.normalized || String(link.title || "").replace(/_/g, " ");
    const extract = cleanExtract(link.extract || stripTags(news.story || ""));
    if (!title || extract.length < 80 || isSensitive(`${title} ${extract}`)) continue;
    const image = link.thumbnail?.source || await fetchPageImage(title);
    items.push({
      title,
      url: link.content_urls?.desktop?.page || wikiUrl(title),
      image,
      extract: extract.slice(0, 3000),
      provider: "한국어 위키백과 · 최근 소식",
      kind: "news",
      offline: false,
    });
    if (items.length >= 2) break;
  }
  return items;
}

function usablePage(page) {
  const title = page?.title || "";
  const extract = page?.extract || "";
  if (!title || extract.length < 80) return false;
  if (/^(분류|틀|위키백과|파일|포털):/.test(title)) return false;
  if (/목록$|동음이의|다음 뜻/.test(`${title} ${extract.slice(0, 80)}`)) return false;
  if (isSensitive(`${title} ${extract}`)) return false;
  return true;
}

function toSource(page, provider, kind) {
  return {
    title: page.title,
    url: page.fullurl || wikiUrl(page.title),
    image: page.thumbnail?.source || "",
    extract: cleanExtract(page.extract || "").slice(0, 3600),
    provider,
    kind,
    offline: false,
  };
}

async function fetchPageImage(title) {
  try {
    const data = await getJson(`https://ko.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title.replace(/ /g, "_"))}`);
    return pickMedia(data.items);
  } catch {
    return "";
  }
}

function pickMedia(items) {
  const candidates = [];
  for (const item of items || []) {
    if (item.type !== "image") continue;
    const title = item.title || "";
    if (/icon|logo|symbol|ambox|edit-clear|disambig|question_book|speaker|wiki|folder|flag_of|nuvola|padlock|searchtool|commons-logo/i.test(title)) continue;
    const best = [...(item.srcset || [])].sort((a, b) => Number(b.width || 0) - Number(a.width || 0))[0];
    if (!best?.src) continue;
    const src = best.src.startsWith("//") ? `https:${best.src}` : best.src;
    const score = Number(best.width || 0) - (/\.svg/i.test(title) ? 120 : 0);
    candidates.push({ score, src });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.src || "";
}

function wikiUrl(title) {
  return `https://ko.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

function stripTags(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function getJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(9000) });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}
