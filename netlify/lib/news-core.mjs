import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

const MAX_BYTES = 1_500_000;
const MAX_ITEMS_PER_SOURCE = 16;
const MAX_TOTAL = 48;
const FETCH_TIMEOUT_MS = 8_000;
const TRACKING = /^(utm_|fbclid$|gclid$|msclkid$)/i;
// Promotions are time-sensitive and their validity cannot be inferred from a feed title.
const PROMOTION_TITLE = /promocj|wyprzeda|black\s+friday|\d+\s*(?:zł|PLN|%)/i;
const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_',
  parseTagValue: false, trimValues: true, processEntities: true });

export function plainText(value, max = 180) {
  const $ = load(`<body>${String(value ?? '')}</body>`);
  $('script, style, svg, iframe, noscript').remove();
  const text = $.text()
    .replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export function canonicalUrl(value, source) {
  try {
    if (typeof value !== 'string' || !value.trim()) return null;
    const url = new URL(String(value ?? ''), source.page);
    if (url.protocol !== 'https:' || url.username || url.password ||
        (url.port && url.port !== '443') || !source.hosts.includes(url.hostname)) return null;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) if (TRACKING.test(key)) url.searchParams.delete(key);
    url.searchParams.sort();
    return url.href;
  } catch { return null; }
}

// Only dates actually provided by the publisher are accepted. Discovery is separate.
export function publicationDate(value, now = new Date()) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  let iso;
  const pl = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  const wp = trimmed.toLowerCase().match(/^(sty|lut|mar|kwi|maj|cze|lip|sie|wrz|paź|lis|gru)\s+(\d{1,2}),\s+(\d{4})$/);
  if (pl) iso = `${pl[3]}-${pl[2]}-${pl[1]}`;
  else if (wp) iso = `${wp[3]}-${String(['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru'].indexOf(wp[1]) + 1).padStart(2, '0')}-${wp[2].padStart(2, '0')}`;
  else if (/^\d{4}-\d{2}-\d{2}/.test(trimmed) || /^[A-Za-z]{3},?\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/.test(trimmed)) iso = trimmed;
  else return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms) || ms > now.getTime() + 86_400_000 || ms < Date.UTC(2000, 0, 1)) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso) && new Date(ms).toISOString().slice(0, 10) !== iso) return null;
  return new Date(ms).toISOString();
}

export function normalizeEntry(raw, source, now = new Date()) {
  const url = canonicalUrl(raw.url, source);
  const title = plainText(raw.title);
  if (!url || title.length < 8) return null;
  if (source.pathPattern && !source.pathPattern.test(new URL(url).pathname)) return null;
  if (PROMOTION_TITLE.test(title) || source.excludeTitlePattern?.test(title)) return null;
  if (source.titlePattern && !source.titlePattern.test(title)) return null;
  return {
    id: createHash('sha256').update(`${source.id}:${url}`).digest('hex').slice(0, 20),
    title, url, partner: source.name, sourceId: source.id,
    publishedAt: publicationDate(raw.publishedAt, now), discoveredAt: now.toISOString(),
  };
}

const array = value => value == null ? [] : Array.isArray(value) ? value : [value];
const stringValue = value => typeof value === 'string' ? value : value?.['#text'] ?? '';

export function parseFeed(body, source, now = new Date()) {
  // DTDs/external entities are unnecessary for RSS/Atom and intentionally refused.
  if (/<!DOCTYPE|<!ENTITY/i.test(body) || XMLValidator.validate(body) !== true) throw new Error('INVALID_FEED');
  const document = xml.parse(body);
  let raw = [];
  if (document.rss?.channel) {
    raw = array(document.rss.channel.item).map(item => ({ title: stringValue(item.title),
      url: stringValue(item.link), publishedAt: stringValue(item.pubDate || item['dc:date']) }));
  } else if (document.feed) {
    raw = array(document.feed.entry).map(item => {
      const link = array(item.link).find(value => !value?.['@_rel'] || value['@_rel'] === 'alternate');
      return { title: stringValue(item.title), url: link?.['@_href'] || stringValue(link),
        publishedAt: stringValue(item.published || item.updated) };
    });
  } else throw new Error('INVALID_FEED');
  return uniqueEntries(raw.map(item => normalizeEntry(item, source, now)).filter(Boolean))
    .slice(0, source.limit || MAX_ITEMS_PER_SOURCE);
}

export function parseHtml(body, source, now = new Date()) {
  if (!source.html) return [];
  const $ = load(body);
  const raw = [];
  $(source.html.item).slice(0, 60).each((index, element) => {
    const row = $(element);
    const link = row.find(source.html.link).first();
    const date = source.html.date ? row.find(source.html.date).first() : null;
    raw.push({ title: source.html.title ? row.find(source.html.title).first().text() : link.text(),
      url: link.attr('href'), publishedAt: date?.attr('datetime') || date?.text() || '' });
  });
  // Distinguish a healthy page whose topics were filtered out from an HTML
  // redesign, bot challenge or login screen that removed the reviewed cards.
  if (!raw.some(item => plainText(item.title).length >= 8 && canonicalUrl(item.url, source))) {
    throw new Error('SOURCE_STRUCTURE_CHANGED');
  }
  return uniqueEntries(raw.map(item => normalizeEntry(item, source, now)).filter(Boolean))
    .slice(0, source.limit || MAX_ITEMS_PER_SOURCE);
}

export function uniqueEntries(entries) {
  return [...new Map(entries.map(item => [item.url, item])).values()];
}

export async function fetchBounded(url, source, { fetchImpl = fetch, timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  if (!canonicalUrl(url, source)) throw new Error('BLOCKED_HOST');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let reader;
  try {
    let target = url;
    let response;
    // Redirects are followed manually so a partner cannot redirect to an arbitrary host.
    for (let redirects = 0; redirects <= 3; redirects++) {
      response = await fetchImpl(target, { redirect: 'manual', signal: controller.signal,
        headers: { 'User-Agent': 'MarkinPartnerNews/1.0 (+https://markin.pl/)',
          Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8' } });
      if (response.status >= 300 && response.status < 400) {
        const next = new URL(response.headers.get('location') || '', target).href;
        await response.body?.cancel();
        if (redirects === 3 || !canonicalUrl(next, source)) throw new Error('BLOCKED_REDIRECT');
        target = next;
      } else break;
    }
    if (!response?.ok) throw new Error(`HTTP_${response?.status || 0}`);
    const type = response.headers.get('content-type') || '';
    if (!/xml|html|text\/plain/i.test(type)) throw new Error('CONTENT_TYPE');
    const declared = Number(response.headers.get('content-length'));
    if (declared > MAX_BYTES) throw new Error('RESPONSE_TOO_LARGE');
    reader = response.body?.getReader();
    if (!reader) throw new Error('EMPTY_BODY');
    const chunks = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw new Error('RESPONSE_TOO_LARGE'); }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString('utf8');
  } catch (error) {
    if (controller.signal.aborted) throw new Error('TIMEOUT');
    throw error;
  } finally { clearTimeout(timer); reader?.releaseLock(); }
}

export async function fetchSource(source, { now = new Date(), fetchImpl = fetch } = {}) {
  let errorCode = 'NO_ENTRIES';
  let validMethod = null;
  for (const feed of (source.feeds || []).slice(0, 1)) {
    try {
      const entries = parseFeed(await fetchBounded(feed, source, { fetchImpl }), source, now);
      validMethod = 'rss';
      if (entries.length) return { sourceId: source.id, ok: true, entries, method: 'rss', checkedAt: now.toISOString() };
    } catch (error) { errorCode = safeError(error); }
  }
  if (source.html) {
    try {
      const entries = parseHtml(await fetchBounded(source.page, source, { fetchImpl }), source, now);
      validMethod = 'html';
      if (entries.length) return { sourceId: source.id, ok: true, entries, method: 'html', checkedAt: now.toISOString() };
    } catch (error) { errorCode = safeError(error); }
  }
  if (validMethod) return { sourceId: source.id, ok: true, entries: [], method: validMethod, checkedAt: now.toISOString() };
  return { sourceId: source.id, ok: false, entries: [], error: errorCode, checkedAt: now.toISOString() };
}

function safeError(error) {
  return /^(?:HTTP_\d{3}|TIMEOUT|INVALID_FEED|BLOCKED_HOST|BLOCKED_REDIRECT|CONTENT_TYPE|RESPONSE_TOO_LARGE|EMPTY_BODY|SOURCE_STRUCTURE_CHANGED)$/.test(error?.message)
    ? error.message : 'SOURCE_UNAVAILABLE';
}

export function mergeSnapshot(previous, results, sources, now = new Date()) {
  const previousEntries = Array.isArray(previous?.entries) ? previous.entries : [];
  const previousByUrl = new Map(previousEntries.map(entry => [entry.url, entry]));
  const previousHealth = new Map((previous?.sources || []).map(source => [source.id, source]));
  const entries = [];
  const health = [];
  for (const source of sources) {
    const result = results.find(item => item.sourceId === source.id);
    const prior = previousHealth.get(source.id);
    const old = previousEntries.filter(entry => entry.sourceId === source.id && normalizeEntry(entry, source, now));
    const fresh = result?.ok ? result.entries.map(entry => ({ ...entry,
      publishedAt: entry.publishedAt || previousByUrl.get(entry.url)?.publishedAt || null,
      discoveredAt: previousByUrl.get(entry.url)?.discoveredAt || entry.discoveredAt })) : [];
    entries.push(...uniqueEntries([...old, ...fresh]).sort(compareEntries).slice(0, source.limit || MAX_ITEMS_PER_SOURCE));
    health.push({ id: source.id, name: source.name, url: source.page, status: result?.ok ? (result.entries.length ? 'ok' : 'empty') : 'error',
      checkedAt: result?.checkedAt || now.toISOString(),
      lastSuccessAt: result?.ok ? now.toISOString() : prior?.lastSuccessAt || null,
      count: result?.ok ? result.entries.length : old.length,
      method: result?.method || prior?.method || null,
      error: result?.ok ? null : result?.error || 'SOURCE_UNAVAILABLE' });
  }
  const anySuccess = results.some(result => result.ok && result.entries.length > 0);
  return { schemaVersion: 1, generatedAt: now.toISOString(),
    lastSuccessAt: anySuccess ? now.toISOString() : previous?.lastSuccessAt || null,
    entries: uniqueEntries(entries).sort(compareEntries).slice(0, MAX_TOTAL), sources: health };
}

function compareEntries(a, b) {
  return (Date.parse(b.publishedAt || b.discoveredAt) - Date.parse(a.publishedAt || a.discoveredAt)) || a.id.localeCompare(b.id);
}

export async function refreshNews(previous, sources, options = {}) {
  const now = options.now || new Date();
  if (sources.length > 6) throw new Error('MAX_SIX_SOURCES');
  const results = await Promise.all(sources.map(source => fetchSource(source, { ...options, now })));
  return mergeSnapshot(previous, results, sources, now);
}

export function publicSnapshot(snapshot, mode = 'cached', now = new Date()) {
  return { ...snapshot, mode,
    stale: !snapshot.lastSuccessAt || now.getTime() - Date.parse(snapshot.lastSuccessAt) > 72 * 60 * 60 * 1000 };
}
