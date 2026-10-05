import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { canonicalUrl, plainText, fetchBounded } from './news-core.mjs';

const bg = value => value?.match(/background-image\s*:\s*url\(['"]?([^)'"\s]+)['"]?\)/i)?.[1];
const forbidden = /gatigo|sem[me]+lrock|promocj|wyprzeda|konkurs|wkrótce/i;
export const imageKey = url => createHash('sha256').update(url).digest('hex');
export function product(raw, source, now = new Date()) {
  const url = canonicalUrl(raw.url, source), imageSource = canonicalUrl(raw.imageSource, source);
  const title = plainText(raw.title, 96);
  if (!url || !imageSource || title.length < 4 || forbidden.test(title + url + imageSource)) return null;
  if (!/\.(jpe?g|png|webp)(?:\?|$)/i.test(imageSource)) return null;
  return { id: imageKey(source.id + ':' + url).slice(0, 20), title, url, imageSource,
    partner: source.name, sourceId: source.id, sourcePage: source.page,
    badge: plainText(raw.badge || 'W nowościach producenta', 50),
    description: plainText(raw.description || 'Odkryj możliwości tego produktu i dobierz go do swojej przestrzeni z Markin.', 220),
    category: raw.category || (source.id === 'ledbruk' ? 'Światło' : 'Nawierzchnie'),
    discoveredAt: now.toISOString(), publishedAt: null };
}

export function parseProducts(body, source, now = new Date()) {
  const $ = load(body), raw = [];
  if (source.id === 'drogbruk') {
    const slides = $('.swiper-slide').filter((i, e) => $(e).find('h2').length);
    if (!slides.length) throw Error('SOURCE_STRUCTURE_CHANGED');
    slides.each((i, e) => {
      const row = $(e), title = row.find('h2').first().text().trim();
      if (!/nowo|nowym kolor/i.test(title)) return;
      const url = row.find('a[href*="/produkt/"]').first().attr('href');
      if (!url) return;
      raw.push({ title: title.replace(/\s+w nowym kolorze\s+/i, ' ').replace(/!+$/, ''), url,
        imageSource: row.find('img').first().attr('src'), badge: /kolor/i.test(title) ? 'Nowy kolor' : 'Nowość producenta',
        description: 'Nadaj nawierzchni nowy charakter. Zestaw odcień z elewacją, zielenią i detalami swojego domu.' });
    });
  } else if (source.id === 'pozbruk') {
    const heading = $('h2,h3').filter((i,e) => /^Nowości\b/i.test($(e).text().trim())).first();
    if (!heading.length) throw Error('SOURCE_STRUCTURE_CHANGED');
    let scope = heading;
    for (let i = 0; i < 5 && !scope.find('.e-loop-item').length; i++) scope = scope.parent();
    // Scope only to the explicitly labelled novelties section, never the complete catalogue.
    scope.find('.e-loop-item').each((i,e) => {
      const row = $(e);
      raw.push({ title: row.find('h3').first().text(), url: row.find('a[href*="/produkt/"]').first().attr('href'),
        imageSource: row.find('img').first().attr('src'), badge: heading.text().trim(), category: 'Taras',
        description: 'Zbuduj przestrzeń na długie poranki i spokojne wieczory. Zobacz, jak ten materiał odnajdzie się przy Twoim domu.' });
    });
    if (!scope.find('.e-loop-item').length) throw Error('SOURCE_STRUCTURE_CHANGED');
  } else if (source.id === 'ledbruk') {
    if (!$('.et_pb_section').length) throw Error('SOURCE_STRUCTURE_CHANGED');
    $('.et_pb_section').each((i,e) => {
      const row = $(e), title = row.find('h1,h2').first().text().replace(/KostkaBrukowa/g,'Kostka Brukowa');
      if (!title || forbidden.test(row.text()) || !/LedBruk/i.test(title)) return;
      const link = row.find('a[href*="/produkty/"]').first().attr('href');
      if (!link) return;
      const style = row.find('[style*="background-image"]').first().attr('style');
      raw.push({ title, url: link, imageSource: bg(style),
        description: 'Światło zmienia ogród po zmroku. Podkreśl przebieg ścieżki i nadaj wieczorom własny nastrój.' });
    });
  }
  return [...new Map(raw.map(r => product(r, source, now)).filter(Boolean).map(p => [p.url, p])).values()].slice(0, source.limit);
}

export async function fetchProducts(source, options = {}) {
  const body = await fetchBounded(source.page, source, options);
  const entries = parseProducts(body, source, options.now);
  if (source.id === 'pozbruk') {
    await Promise.all(entries.map(async entry => {
      const detail = load(await fetchBounded(entry.url, source, options));
      const full = canonicalUrl(detail('meta[property="og:image"]').attr('content'), source);
      if (full && /\.(webp|jpe?g|png)(?:\?|$)/i.test(full)) entry.imageSource = full;
    }));
  }
  if (source.id === 'ledbruk') {
    const $ = load(body);
    const links = [...new Set($('a').filter((i,e) => /\(nowość\)/i.test($(e).text()))
      .map((i,e) => canonicalUrl($(e).attr('href'), source)).get().filter(Boolean))].slice(0, 3);
    const details = await Promise.all(links.map(async url => {
      const html = await fetchBounded(url, source, options), d = load(html);
      // Reviewed product hero photograph, not icons, logos or a video thumbnail guessed from a filename.
      const hero = bg(d('style').text());
      const imageSource = hero || d('#main-content img[src*="/uploads/"]').filter((i,e) => !/ikona|ikony|logo|150x150|PDF/i.test(d(e).attr('src'))).first().attr('src');
      return product({ title: d('h1').first().text(), url, imageSource, badge: 'Nowość w ofercie producenta',
        description: 'Jedna linia światła, zupełnie inny wieczór. Podkreśl geometrię tarasu, ścieżek i wejścia do domu.' }, source, options.now);
    }));
    entries.push(...details.filter(Boolean));
  }
  if (!entries.length) throw Error('NO_VERIFIED_PRODUCTS');
  return entries.slice(0, source.limit);
}

export async function fetchProductImage(url, source, { fetchImpl = fetch } = {}) {
  if (!canonicalUrl(url, source)) throw Error('BLOCKED_HOST');
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 8000);
  let reader;
  try {
    let response, target = url;
    for (let i = 0; i <= 3; i++) {
      response = await fetchImpl(target, { redirect: 'manual', signal: controller.signal });
      if (response.status < 300 || response.status >= 400) break;
      const next = new URL(response.headers.get('location') || '', target).href;
      await response.body?.cancel();
      if (i === 3 || !canonicalUrl(next, source)) throw Error('BLOCKED_REDIRECT');
      target = next;
    }
    if (!response.ok) throw Error('IMAGE_UNAVAILABLE');
    if (Number(response.headers.get('content-length')) > 4_000_000) throw Error('IMAGE_TOO_LARGE');
    reader = response.body.getReader();
    const chunks = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > 4_000_000) { await reader.cancel(); throw Error('IMAGE_TOO_LARGE'); }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks);
    const type = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? 'image/jpeg'
      : bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png'
      : bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP' ? 'image/webp' : null;
    if (!type) throw Error('INVALID_IMAGE');
    return { bytes, type };
  } finally { clearTimeout(timeout); reader?.releaseLock(); }
}

export async function refreshProducts(previous, sources, options = {}) {
  const now = options.now || new Date(), timestamp = now.toISOString();
  const results = await Promise.all(sources.map(async source => {
    const old = (previous?.entries || []).filter(p => p.sourceId === source.id && product(p, source, now) && p.image);
    try {
      const fresh = await fetchProducts(source, { ...options, now });
      let imageFailures = 0;
      const entries = await Promise.all(fresh.map(async entry => {
        const prior = old.find(p => p.url === entry.url);
        try {
          const image = await options.saveImage(entry, source);
          return { ...entry, discoveredAt: prior?.discoveredAt || timestamp, image };
        } catch { imageFailures++; return prior || null; }
      }));
      const ready = entries.filter(Boolean);
      if (!ready.length) throw Error('NO_PRODUCT_IMAGES');
      return { entries: ready, health: { id: source.id, name: source.name, url: source.page, status: imageFailures ? 'partial' : 'ok', checkedAt: timestamp, lastSuccessAt: timestamp, count: ready.length } };
    } catch (error) {
      return { entries: old, health: { id: source.id, name: source.name, url: source.page, status: 'error', checkedAt: timestamp,
        lastSuccessAt: previous?.sources?.find(s => s.id === source.id)?.lastSuccessAt || null, count: old.length,
        error: /^[A-Z_]+$/.test(error.message) ? error.message : 'SOURCE_UNAVAILABLE' } };
    }
  }));
  return { schemaVersion: 2, kind: 'products', generatedAt: timestamp,
    lastSuccessAt: results.some(r => r.health.status === 'ok') ? timestamp : previous?.lastSuccessAt || null,
    entries: results.flatMap(r => r.entries), sources: results.map(r => r.health) };
}
