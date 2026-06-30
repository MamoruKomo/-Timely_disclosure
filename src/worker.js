const TDNET_LIST_BASE_URL = "https://www.release.tdnet.info/inbs/";
const TDNET_PDF_BASE_URL = "https://www.release.tdnet.info/inbs/";
const JPX_CALENDAR_URL = "https://www.jpx.co.jp/corporate/about-jpx/calendar/index.html";
const DEFAULT_SLACK_CHANNEL_ID = "C0ASFHVU94L";
const STATE_KEY = "tdnet_state";
const JPX_HOLIDAY_CACHE_KEY_PREFIX = "jpx_holidays";
const MAX_TDNET_PAGES = 20;
const MAX_SEEN_IDS = 5000;
const MAX_STORED_ITEMS = 500;
const MAX_NOTIFY = 30;
const NON_DOMESTIC_SECURITY_TERMS = [
  "ＥＴＦ",
  "ETF",
  "ＥＴＮ",
  "ETN",
  "ＲＥＩＴ",
  "REIT",
  "リート",
  "投資信託",
  "上場投信",
  "上場信託",
  "外国株",
  "外国ETF",
  "外国REIT",
  "インフラファンド",
];

const IMPORTANT_TERMS = [
  "ｍｂｏ",
  "公開買付",
  "買い付け",
  "世界初",
  "大口受注",
  "大型案件受注",
  "特許",
  "増配",
  "実証実験",
  "mou",
  "半導体",
  "業務提携",
  "調印",
  "一部報道",
  "基本合意",
  "経営統合",
  "覚書締結",
  "上方修正",
  "防衛省",
  "大型案件の受注",
  "株主優待",
  "戦略的提携",
  "契約締結",
  "監理銘柄",
  "行使完了",
  "上場廃止",
  "量子",
  "anthropic",
  "共同研究",
  "全個体電池",
  "意見不表明",
];

const BLOCK_TERMS = [
  "マンション",
  "ESG",
  "期間限定",
  "書き起こし",
  "ＥＴＦ",
  "ETF",
  "法定事後開示書類",
  "ストック",
  "譲渡制限付株式報酬",
  "募集新株予約権",
  "独立役員届出書",
  "役員人事",
  "一部改正",
  "ToSTNeT-3",
  "取得価額",
  "コーポレート",
  "説明会",
  "IRセミナー",
  "選任",
  "【BS11リリース】",
  "収益不動産",
  "販売用不動産",
  "日々の開示事項",
  "逝去",
  "借入",
  "動画公開",
  "剰余金の配当",
  "投資信託",
  "名簿管理人",
  "従業員持株会",
  "基準日設定",
  "デジタルギフトを採用",
  "自己株式",
  "湘南投資勉強会",
  "アナリスト",
  "個人投資家",
  "質疑応答",
  "よくある質問",
  "立会外分売",
  "法定事前開示書類",
  "資産運用EXPO",
  "開催",
  "出展",
  "リニューアル",
  "独立役員届出書",
  "役員報酬",
  "移転",
  "払込完了",
  "報酬制度",
  "定時株主総会",
  "ラジオ NIKKEI",
  "ログミー",
  "統合報告書",
  "インセンティブ",
  "希望退職",
  "支配株主等",
  "構成銘柄",
  "約款",
  "定款",
  "規約",
  "Notice",
  "用地",
  "TOKYO PRO Market",
  "コミットメントライン契約",
  "資本コストや株価を意識",
  "連結子会社の商号変更",
  "組織変更",
  "中間発行者情報",
  "国内不動産",
  "解散および清算",
  "固定資産の取得",
  "重複上場承認",
  "加入状況",
  "サスティナビリティ",
  "サステナビリティ",
  "Report",
  "突破",
  "貢献",
  "出店",
  "絶賛",
  "選出",
  "オープン",
  "加入状況",
  "株式譲渡",
  "投資有価証券売却",
  "発行者情報",
  "辞任",
  "株式交換契約",
  "事業譲渡完了",
  "無担保社債発行",
  "上場信託",
  "執行役員",
  "法定事後開示",
  "第三者割当",
  "月間行使状況に関するお知らせ",
  "スコア",
  "限定販売",
  "固定資産",
  "ホテル運営状況",
  "臨時株主総会招集ご通知",
  "投資主総会招集",
  "スタートアップ急成長",
  "株式の売出し",
  "退職給付信託",
  "ラジオNIKKEI",
  "営業外収益",
  "支配株主",
  "収益用",
  "健康経営優良法人",
  "対談",
  "招集通知",
  "人事",
  "金銭消費貸借契約",
  "イーサリアム（ETH）の追加取得",
  "TVCM",
  "新CM",
  "就活",
  "取締役会",
  "取締役候補",
  "リユースに関する協定を締結",
  "業務提携期間満了",
  "非上場の親会社",
  "持分法適用会社",
  "債権放棄",
  "保有状況報告書",
  "出演",
  "寄付",
  "給与",
  "会社分割",
  "資本準備金",
  "自己資本比率",
  "サイト",
  "訂正・数値データ訂正",
  "研修",
  "私募",
  "開店",
  "（訂正）",
  "ホテル",
  "ホームページ",
  "売上速報",
  "月次",
  "速報値",
  "受賞",
  "入会",
  "加盟",
  "加入件数",
  "登壇",
  "親会社等の",
  "高速報",
  "セミナー",
  "優良法人",
  "選定",
  "差異",
  "役員の異動",
  "取締役の異動",
];

function normalizeSpaces(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function decodeHtml(value) {
  return normalizeSpaces(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value) {
  return decodeHtml(String(value ?? "").replace(/<[^>]*>/g, " "));
}

function normalizeSecurityCode(code) {
  const normalized = normalizeSpaces(code);
  if (normalized.length === 5 && normalized.endsWith("0")) {
    return normalized.slice(0, 4);
  }
  return normalized;
}

function cleanCompanyName(company) {
  return normalizeSpaces(company)
    .replace(/^(?:Ｇ|Ｐ|Ｅ|Ｓ|Ｎ|Ｑ|Ｒ|Ｃ|Ｆ)[－-]/, "")
    .replace(/[－-]議$/, "");
}

function extractTdnetDocId(value) {
  const text = normalizeSpaces(value);
  const pdfMatch = text.match(/\/(?<id>\d{18})\.pdf/);
  if (pdfMatch?.groups?.id) return pdfMatch.groups.id;
  const docMatch = text.match(/(?<id>\d{18})/);
  return docMatch?.groups?.id ?? "";
}

function absolutizeTdnetUrl(value) {
  const href = normalizeSpaces(value);
  if (!href) return "";
  if (/^https?:\/\//.test(href)) return href;
  return TDNET_LIST_BASE_URL + href.replace(/^\.\//, "");
}

function yyyymmddInJst(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}${byType.month}${byType.day}`;
}

function nowIsoJst(date = new Date()) {
  const local = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
  return `${local.replace(" ", "T")}+09:00`;
}

function isJstWeekday(date = new Date()) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
  }).format(date);
  return weekday !== "Sat" && weekday !== "Sun";
}

function jstDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: byType.year,
    month: byType.month,
    day: byType.day,
    weekday: byType.weekday,
    yyyymmdd: `${byType.year}${byType.month}${byType.day}`,
    iso: `${byType.year}-${byType.month}-${byType.day}`,
  };
}

function normalizeForMatching(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function disclosureSearchText(disclosure) {
  return normalizeForMatching([disclosure.code, disclosure.company, disclosure.title].join(" "));
}

function matchedTerms(disclosure, terms) {
  const text = disclosureSearchText(disclosure);
  return terms.filter((term) => text.includes(normalizeForMatching(term)));
}

function isBlockedDisclosure(disclosure) {
  return matchedTerms(disclosure, BLOCK_TERMS).length > 0;
}

function isImportantDisclosure(disclosure) {
  return matchedTerms(disclosure, IMPORTANT_TERMS).length > 0;
}

function isDomesticSecurityDisclosure(disclosure) {
  const rawCode = normalizeSpaces(disclosure.raw_issue_code || disclosure.code);
  const code = normalizeSecurityCode(rawCode);
  const company = normalizeSpaces(disclosure.company);
  if (!/^\d{4}$|^\d{3}[A-Z]$/i.test(code)) return false;
  if (/^(?:Ｅ|Ｒ|Ｆ)[－-]/.test(company)) return false;
  return matchedTerms(disclosure, NON_DOMESTIC_SECURITY_TERMS).length === 0;
}

function parseJpxHolidayDates(html) {
  const holidays = new Set();
  for (const match of String(html).matchAll(/\b(20\d{2})\/(\d{2})\/(\d{2})/g)) {
    holidays.add(`${match[1]}-${match[2]}-${match[3]}`);
  }
  return holidays;
}

async function loadJpxHolidaySet(kv, year, fetcher = fetch) {
  const key = `${JPX_HOLIDAY_CACHE_KEY_PREFIX}:${year}`;
  const cached = await kv.get(key, "json");
  if (cached?.year === year && Array.isArray(cached.holidays)) {
    return new Set(cached.holidays);
  }

  const html = await fetchText(JPX_CALENDAR_URL, fetcher);
  const holidays = [...parseJpxHolidayDates(html)].filter((date) => date.startsWith(`${year}-`)).sort();
  await kv.put(key, JSON.stringify({ year, holidays, cached_at_jst: nowIsoJst() }), {
    expirationTtl: 60 * 60 * 24 * 7,
  });
  return new Set(holidays);
}

async function isJpxBusinessDay(date = new Date(), env = null, fetcher = fetch) {
  const parts = jstDateParts(date);
  if (parts.weekday === "Sat" || parts.weekday === "Sun") return false;
  if (!env?.TDNET_STATE) return true;

  try {
    const holidays = await loadJpxHolidaySet(env.TDNET_STATE, parts.year, fetcher);
    return !holidays.has(parts.iso);
  } catch (error) {
    console.warn(JSON.stringify({ level: "warn", message: error.message, fallback: "jst_weekday" }));
    return true;
  }
}

function parseTdnetDisclosures(html, dateYyyymmdd) {
  const dateDisplay = `${dateYyyymmdd.slice(0, 4)}-${dateYyyymmdd.slice(4, 6)}-${dateYyyymmdd.slice(6, 8)}`;
  const rows = [...String(html).matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const disclosures = [];

  for (const rowMatch of rows) {
    const row = rowMatch[1];
    const cells = [...row.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi)];
    const current = {};

    for (const [, attrs, inner] of cells) {
      const classMatch = attrs.match(/\bclass=["']([^"']+)["']/i);
      const className = classMatch ? classMatch[1] : "";
      const classSet = new Set(className.split(/\s+/).filter(Boolean));
      const kind = ["kjTime", "kjCode", "kjName", "kjTitle", "kjXbrl"].find((name) =>
        classSet.has(name),
      );
      if (!kind) continue;

      if (kind === "kjTitle") {
        const link = inner.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
        current.title = stripTags(link ? link[2] : inner);
        current.pdfUrl = link ? absolutizeTdnetUrl(decodeHtml(link[1])) : "";
      } else {
        current[kind] = stripTags(inner);
      }
    }

    const rawIssueCode = normalizeSpaces(current.kjCode);
    const code = normalizeSecurityCode(rawIssueCode);
    const company = normalizeSpaces(current.kjName);
    const timeJst = normalizeSpaces(current.kjTime);
    const title = normalizeSpaces(current.title);
    const pdfUrl = normalizeSpaces(current.pdfUrl);
    const docId = extractTdnetDocId(pdfUrl);
    if (!(code && company && timeJst && title && pdfUrl && docId)) continue;

    disclosures.push({
      id: `tdnet:${code}:${docId}`,
      raw_issue_code: rawIssueCode,
      code,
      company,
      date_jst: `${dateDisplay} ${timeJst} JST`,
      title,
      pdf_url: pdfUrl,
      source_url: pdfUrl,
    });
  }

  return disclosures.sort((a, b) => `${b.date_jst} ${b.id}`.localeCompare(`${a.date_jst} ${a.id}`));
}

async function fetchText(url, fetcher = fetch) {
  const response = await fetcher(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; tdnet-slack-alert/1.0; +https://github.com/MamoruKomo/-Timely_disclosure)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ja-JP,ja;q=0.9,en-US;q=0.7,en;q=0.6",
      "Cache-Control": "no-cache",
      Referer: "https://www.release.tdnet.info/inbs/I_main_00.html",
    },
  });
  if (!response.ok) {
    const error = new Error(`failed to fetch ${url}: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.text();
}

async function fetchTdnetDisclosures(dateYyyymmdd, fetcher = fetch) {
  const disclosures = [];
  for (let page = 1; page <= MAX_TDNET_PAGES; page += 1) {
    const url = `${TDNET_LIST_BASE_URL}I_list_${String(page).padStart(3, "0")}_${dateYyyymmdd}.html`;
    let html;
    try {
      html = await fetchText(url, fetcher);
    } catch (error) {
      if (error.status === 404) break;
      throw error;
    }

    const pageItems = parseTdnetDisclosures(html, dateYyyymmdd);
    if (pageItems.length === 0) {
      if (page === 1) return [];
      break;
    }
    disclosures.push(...pageItems);
  }

  return disclosures.sort((a, b) => `${b.date_jst} ${b.id}`.localeCompare(`${a.date_jst} ${a.id}`));
}

async function loadState(kv) {
  const data = await kv.get(STATE_KEY, "json");
  if (!data || typeof data !== "object") {
    return { version: 1, seen_ids: [], items: [], last_checked_jst: null };
  }
  return {
    version: Number(data.version || 1),
    seen_ids: Array.isArray(data.seen_ids) ? data.seen_ids.map(normalizeSpaces).filter(Boolean) : [],
    items: Array.isArray(data.items) ? data.items.filter((item) => item && typeof item === "object") : [],
    last_checked_jst: data.last_checked_jst ?? null,
  };
}

function buildNextState(current, latest, date = new Date()) {
  const seenIds = [];
  const seenSet = new Set();
  for (const id of [...latest.map((item) => item.id), ...current.seen_ids]) {
    if (id && !seenSet.has(id)) {
      seenIds.push(id);
      seenSet.add(id);
    }
  }

  return {
    version: 1,
    last_checked_jst: nowIsoJst(date),
    seen_ids: seenIds.slice(0, MAX_SEEN_IDS),
    items: latest.slice(0, MAX_STORED_ITEMS),
  };
}

async function saveState(kv, state) {
  await kv.put(STATE_KEY, JSON.stringify(state, null, 2));
}

function buildSlackMessage(disclosures) {
  return disclosures
    .map((disclosure) => {
      const lines = [
        disclosure.code,
        "",
        cleanCompanyName(disclosure.company),
        "",
        disclosure.date_jst.replace(" JST", ""),
        "",
        disclosure.title,
        "",
        disclosure.pdf_url,
      ];
      if (disclosure.is_important) {
        lines.unshift("重要", "");
      }
      return lines.join("\n");
    })
    .join("\n---\n");
}

function chunkItems(items, size) {
  const chunkSize = Math.max(1, Number(size) || MAX_NOTIFY);
  const chunks = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

async function postToSlack(message, env) {
  if (env.SLACK_BOT_TOKEN) {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        channel: normalizeSpaces(env.SLACK_CHANNEL_ID || DEFAULT_SLACK_CHANNEL_ID),
        text: message,
        unfurl_links: true,
        unfurl_media: true,
      }),
    });
    const result = await response.json();
    if (!result.ok) throw new Error(`Slack chat.postMessage failed: ${JSON.stringify(result)}`);
    return;
  }

  if (env.SLACK_WEBHOOK_URL) {
    const response = await fetch(env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ text: message, unfurl_links: true, unfurl_media: true }),
    });
    if (!response.ok) throw new Error(`Slack webhook failed: ${response.status}`);
    return;
  }

  throw new Error("Set SLACK_BOT_TOKEN or SLACK_WEBHOOK_URL before sending notifications.");
}

async function pollTdnet(env, options = {}) {
  const fetcher = options.fetcher || fetch;
  const dateYyyymmdd = options.dateYyyymmdd || yyyymmddInJst();
  const state = await loadState(env.TDNET_STATE);
  const latest = await fetchTdnetDisclosures(dateYyyymmdd, fetcher);
  const notifyableLatest = latest.filter((item) => isDomesticSecurityDisclosure(item));
  const existingIds = new Set(state.seen_ids);
  const isBootstrap = existingIds.size === 0;
  const newItems = latest.filter((item) => !existingIds.has(item.id));
  const newDomesticItems = notifyableLatest.filter((item) => !existingIds.has(item.id));
  const newNotifyableItems = newDomesticItems
    .filter((item) => !isBlockedDisclosure(item))
    .map((item) => ({ ...item, is_important: isImportantDisclosure(item) }));

  const result = {
    latest_count: latest.length,
    new_count: newItems.length,
    notifyable_new_count: newNotifyableItems.length,
    filtered_non_domestic_count: latest.length - notifyableLatest.length,
    blocked_count: newDomesticItems.length - newNotifyableItems.length,
    important_count: newNotifyableItems.filter((item) => item.is_important).length,
    bootstrapped: isBootstrap && latest.length > 0,
    source: "tdnet",
    state_changed: false,
    posted: false,
    posted_count: 0,
    message_count: 0,
  };

  if (isBootstrap) {
    if (latest.length > 0) {
      await saveState(env.TDNET_STATE, buildNextState(state, latest));
      result.state_changed = true;
    }
    return result;
  }

  if (newItems.length > 0) {
    if (newNotifyableItems.length > 0) {
      const chunks = chunkItems(newNotifyableItems, env.MAX_NOTIFY || MAX_NOTIFY);
      for (const chunk of chunks) {
        await postToSlack(buildSlackMessage(chunk), env);
      }
      result.posted = true;
      result.posted_count = newNotifyableItems.length;
      result.message_count = chunks.length;
    }
    await saveState(env.TDNET_STATE, buildNextState(state, latest));
    result.state_changed = true;
  }

  return result;
}

async function runScheduledPoll(env, options = {}) {
  const date = options.date || new Date();
  const fetcher = options.fetcher || fetch;
  const businessDay = await isJpxBusinessDay(date, env, fetcher);
  if (!businessDay) {
    return { skipped: true, reason: "jpx_holiday_or_weekend", date_jst: jstDateParts(date).iso };
  }

  return pollTdnet(env, { ...options, fetcher, dateYyyymmdd: options.dateYyyymmdd || yyyymmddInJst(date) });
}

async function sendTestDisclosure(env, body = {}) {
  const sample = {
    code: normalizeSpaces(body.code || "4444"),
    company: normalizeSpaces(body.company || "インフォネット"),
    date_jst: normalizeSpaces(body.date_jst || "2026-06-29 15:00 JST"),
    title: normalizeSpaces(body.title || "株主優待の一部内容変更（優待品目の変更）に関するお知らせ"),
    pdf_url: normalizeSpaces(
      body.pdf_url || "https://storage.googleapis.com/disclosed-file-bucket-d4575ee/20260629583350/1/general.pdf",
    ),
    is_important: Boolean(body.is_important),
  };
  await postToSlack(buildSlackMessage([sample]), env);
}

function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: { "Content-Type": "application/json; charset=utf-8", ...(init.headers || {}) },
  });
}

async function handleRequest(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/health") {
    const state = await loadState(env.TDNET_STATE);
    return jsonResponse({
      ok: true,
      last_checked_jst: state.last_checked_jst,
      seen_count: state.seen_ids.length,
      item_count: state.items.length,
    });
  }

  if (url.pathname === "/test" && request.method === "POST") {
    if (!env.ADMIN_TOKEN) return jsonResponse({ ok: false, error: "ADMIN_TOKEN is not set" }, { status: 403 });
    const auth = request.headers.get("Authorization") || "";
    if (auth !== `Bearer ${env.ADMIN_TOKEN}`) {
      return jsonResponse({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    if (body.message) {
      await postToSlack(normalizeSpaces(body.message), env);
    } else {
      await sendTestDisclosure(env, body);
    }
    return jsonResponse({ ok: true, posted: true });
  }

  return jsonResponse({
    ok: true,
    service: "tdnet-slack-alert",
    endpoints: ["/health", "POST /test"],
  });
}

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error(JSON.stringify({ level: "error", message: error.message, stack: error.stack }));
      return jsonResponse({ ok: false, error: error.message }, { status: 500 });
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      runScheduledPoll(env, { date: event?.scheduledTime ? new Date(event.scheduledTime) : new Date() })
        .then((result) => console.log(JSON.stringify({ level: "info", ...result })))
        .catch((error) => console.error(JSON.stringify({ level: "error", message: error.message, stack: error.stack }))),
    );
  },
};

export {
  buildNextState,
  buildSlackMessage,
  chunkItems,
  cleanCompanyName,
  extractTdnetDocId,
  isBlockedDisclosure,
  isDomesticSecurityDisclosure,
  isImportantDisclosure,
  isJpxBusinessDay,
  isJstWeekday,
  jstDateParts,
  matchedTerms,
  parseJpxHolidayDates,
  parseTdnetDisclosures,
  pollTdnet,
  runScheduledPoll,
  yyyymmddInJst,
};
