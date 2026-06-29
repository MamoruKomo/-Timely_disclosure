const TDNET_LIST_BASE_URL = "https://www.release.tdnet.info/inbs/";
const TDNET_PDF_BASE_URL = "https://www.release.tdnet.info/inbs/";
const DEFAULT_SLACK_CHANNEL_ID = "C0ASFHVU94L";
const STATE_KEY = "tdnet_state";
const MAX_TDNET_PAGES = 20;
const MAX_SEEN_IDS = 5000;
const MAX_STORED_ITEMS = 500;
const MAX_NOTIFY = 30;

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

    const code = normalizeSecurityCode(current.kjCode);
    const company = normalizeSpaces(current.kjName);
    const timeJst = normalizeSpaces(current.kjTime);
    const title = normalizeSpaces(current.title);
    const pdfUrl = normalizeSpaces(current.pdfUrl);
    const docId = extractTdnetDocId(pdfUrl);
    if (!(code && company && timeJst && title && pdfUrl && docId)) continue;

    disclosures.push({
      id: `tdnet:${code}:${docId}`,
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
    .map((disclosure) =>
      [
        `証券コード: ${disclosure.code}`,
        `銘柄名: ${disclosure.company}`,
        `日付: ${disclosure.date_jst}`,
        `たいとる: ${disclosure.title}`,
        `PDFのりんく: ${disclosure.pdf_url}`,
      ].join("\n"),
    )
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
        unfurl_links: false,
        unfurl_media: false,
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
      body: JSON.stringify({ text: message, unfurl_links: false, unfurl_media: false }),
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
  const existingIds = new Set(state.seen_ids);
  const isBootstrap = existingIds.size === 0;
  const newItems = latest.filter((item) => !existingIds.has(item.id));

  const result = {
    latest_count: latest.length,
    new_count: newItems.length,
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
    const chunks = chunkItems(newItems, env.MAX_NOTIFY || MAX_NOTIFY);
    for (const chunk of chunks) {
      await postToSlack(buildSlackMessage(chunk), env);
    }
    await saveState(env.TDNET_STATE, buildNextState(state, latest));
    result.state_changed = true;
    result.posted = true;
    result.posted_count = newItems.length;
    result.message_count = chunks.length;
  }

  return result;
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
    const message = normalizeSpaces(body.message || "TDnet Slack alert test from Cloudflare Workers");
    await postToSlack(message, env);
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

  async scheduled(_event, env, ctx) {
    if (!isJstWeekday()) {
      console.log(JSON.stringify({ level: "info", skipped: true, reason: "jst_weekend" }));
      return;
    }

    ctx.waitUntil(
      pollTdnet(env)
        .then((result) => console.log(JSON.stringify({ level: "info", ...result })))
        .catch((error) => console.error(JSON.stringify({ level: "error", message: error.message, stack: error.stack }))),
    );
  },
};

export {
  buildNextState,
  buildSlackMessage,
  chunkItems,
  extractTdnetDocId,
  isJstWeekday,
  parseTdnetDisclosures,
  pollTdnet,
  yyyymmddInJst,
};
