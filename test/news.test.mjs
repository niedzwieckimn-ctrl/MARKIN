import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalUrl, publicationDate, normalizeEntry, parseFeed, parseHtml,
  fetchBounded, fetchSource, mergeSnapshot, publicSnapshot } from '../netlify/lib/news-core.mjs';

const now = new Date('2026-10-05T18:45:00Z');
const source = { id: 'partner', name: 'Partner', hosts: ['partner.example'],
  page: 'https://partner.example/news/', feeds: ['https://partner.example/feed/'], limit: 8 };
const sample = { title: 'Nowa kolekcja kostki', url: 'https://partner.example/nowa-kolekcja/', publishedAt: '2026-09-20' };

test('RSS retains exact publisher date, strips markup and deduplicates tracking variants', () => {
  const body = `<rss version="2.0"><channel><item><title><![CDATA[<strong>Nowa</strong> kolekcja kostki]]></title><link>${sample.url}?utm_source=x</link><pubDate>Sun, 20 Sep 2026 10:00:00 +0200</pubDate></item><item><title>Nowa kolekcja kostki</title><link>${sample.url}</link><pubDate>Sun, 20 Sep 2026 10:00:00 +0200</pubDate></item></channel></rss>`;
  const entries = parseFeed(body, source, now);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].publishedAt, '2026-09-20T08:00:00.000Z');
  assert.equal(entries[0].title, sample.title);
  assert.equal(entries[0].discoveredAt, now.toISOString());
});

test('Atom selects alternate link and never invents missing publication date', () => {
  const entries = parseFeed(`<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Nowa kolekcja kostki</title><link rel="self" href="https://partner.example/api/a"/><link rel="alternate" href="${sample.url}"/></entry></feed>`, source, now);
  assert.equal(entries[0].url, sample.url);
  assert.equal(entries[0].publishedAt, null);
});

test('URL allowlist rejects missing links, javascript, auth, IP and attacker suffix', () => {
  for (const url of [undefined, '', 'javascript:alert(1)', 'http://partner.example/x', 'https://user:pass@partner.example/x',
    'https://127.0.0.1/x', 'https://partner.example.evil.invalid/x', 'https://partner.example:8443/x']) {
    assert.equal(canonicalUrl(url, source), null, String(url));
  }
  assert.equal(canonicalUrl('/news/item?utm_campaign=a&v=2#anchor', source), 'https://partner.example/news/item?v=2');
});

test('untrusted feed cannot import external partner links or scripts', () => {
  assert.equal(normalizeEntry({ ...sample, url: 'https://evil.invalid/a' }, source, now), null);
  const normalized = normalizeEntry({ ...sample, title: '<script>alert(1)</script>Nowa kolekcja kostki' }, source, now);
  assert.equal(normalized.title, sample.title);
  assert.equal(normalizeEntry({ title: sample.title }, source, now), null);
});

test('rejects malformed XML and DTDs instead of silently importing junk', () => {
  assert.throws(() => parseFeed('<rss><item></rss>', source, now), /INVALID_FEED/);
  assert.throws(() => parseFeed('<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss/>', source, now), /INVALID_FEED/);
});

test('dates reject unproven, impossible and future values', () => {
  assert.equal(publicationDate('31.02.2026', now), null);
  assert.equal(publicationDate('2026-02-31', now), null);
  assert.equal(publicationDate('wczoraj', now), null);
  assert.equal(publicationDate('2027-01-01', now), null);
  assert.equal(publicationDate('12.08.2025', now), '2025-08-12T00:00:00.000Z');
});

test('HTML extracts only reviewed card selectors and supports relative URLs', () => {
  const entries = parseHtml(`<nav><a href="/contact">Kontakt</a></nav><article class="card"><h2><a href="/nowa-kolekcja/">Nowa kolekcja kostki</a></h2><time datetime="2026-09-20">20 września</time></article>`,
    { ...source, html: { item: 'article.card', link: 'h2 a', date: 'time' } }, now);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].url, sample.url);
  assert.equal(entries[0].publishedAt, '2026-09-20T00:00:00.000Z');
});

test('HTML layout changes or bot challenge cannot masquerade as a healthy empty source', async () => {
  const htmlSource = { ...source, feeds: [], html: { item: 'article.card', link: 'h2 a' } };
  assert.throws(() => parseHtml('<h1>Verify you are human</h1>', htmlSource, now), /SOURCE_STRUCTURE_CHANGED/);
  const result = await fetchSource(htmlSource, { now,
    fetchImpl: async () => new Response('<h1>Verify you are human</h1>', { headers: { 'content-type': 'text/html' } }),
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'SOURCE_STRUCTURE_CHANGED');
});

test('topic filter excludes unrelated Bozza bathroom content', () => {
  const filtered = { ...source, titlePattern: /taras|płytk|ogród/i };
  assert.equal(normalizeEntry({ ...sample, title: 'Nowa wanna z hydromasażem' }, filtered, now), null);
  assert.ok(normalizeEntry({ ...sample, title: 'Nowe płytki tarasowe' }, filtered, now));
});

test('promotions and source-excluded topics are not re-published as current offers', () => {
  assert.equal(normalizeEntry({ ...sample, title: 'SKORZYSTAJ Z PROMOCJI NA PROJEKTY LIBET' }, source, now), null);
  assert.equal(normalizeEntry({ ...sample, title: 'Projekt ogrodu za 1 zł' }, source, now), null);
  assert.equal(normalizeEntry({ ...sample, title: 'Wanna spa do ogrodu' }, { ...source, excludeTitlePattern: /wanna/i }, now), null);
  assert.equal(normalizeEntry(sample, { ...source, pathPattern: /^\/porady\// }, now), null);
});

test('valid source with no matching articles reports empty, not a transport failure', async () => {
  const result = await fetchSource({ ...source, titlePattern: /never-matches/ }, { now,
    fetchImpl: async () => new Response(`<rss><channel><item><title>${sample.title}</title><link>${sample.url}</link></item></channel></rss>`, { headers: { 'content-type': 'text/xml' } }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.entries.length, 0);
  const merged = mergeSnapshot({ entries: [], sources: [] }, [result], [source], now);
  assert.equal(merged.sources[0].status, 'empty');
});

test('Polish WordPress date is mapped to its actual publication day', () => {
  assert.equal(publicationDate('sie 12, 2024', now), '2024-08-12T00:00:00.000Z');
  assert.equal(publicationDate('lut 31, 2024', now), null);
});

test('redirect cannot leave reviewed hosts and no second request is sent', async () => {
  let calls = 0;
  await assert.rejects(fetchBounded(source.feeds[0], source, { fetchImpl: async () => {
    calls++; return new Response(null, { status: 302, headers: { location: 'https://127.0.0.1/private' } });
  } }), /BLOCKED_REDIRECT/);
  assert.equal(calls, 1);
});

test('fetch caps response size before consuming oversized body', async () => {
  await assert.rejects(fetchBounded(source.feeds[0], source, { fetchImpl: async () => new Response('large', {
    headers: { 'content-type': 'application/rss+xml', 'content-length': '1500001' },
  }) }), /RESPONSE_TOO_LARGE/);
});

test('fetch caps streamed responses even if size header is missing', async () => {
  await assert.rejects(fetchBounded(source.feeds[0], source, { fetchImpl: async () => new Response('a'.repeat(1_500_001), {
    headers: { 'content-type': 'text/xml' },
  }) }), /RESPONSE_TOO_LARGE/);
});

test('timeout becomes a stable health error', async () => {
  await assert.rejects(fetchBounded(source.feeds[0], source, { timeoutMs: 10,
    fetchImpl: async (_, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('abort')))),
  }), /TIMEOUT/);
});

test('source fetch reports safe error codes without exposing raw errors', async () => {
  const result = await fetchSource(source, { now, fetchImpl: async () => { throw new Error('secret-token-123'); } });
  assert.equal(result.error, 'SOURCE_UNAVAILABLE');
  assert.equal(result.ok, false);
});

test('failed refresh retains last valid entries and last success timestamp', () => {
  const entry = normalizeEntry(sample, source, new Date('2026-10-01T00:00:00Z'));
  const previous = { entries: [entry], sources: [{ id: source.id, lastSuccessAt: '2026-10-01T00:00:00.000Z' }], lastSuccessAt: '2026-10-01T00:00:00.000Z' };
  const merged = mergeSnapshot(previous, [{ sourceId: source.id, ok: false, error: 'HTTP_503' }], [source], now);
  assert.deepEqual(merged.entries, [entry]);
  assert.equal(merged.lastSuccessAt, previous.lastSuccessAt);
  assert.equal(merged.sources[0].lastSuccessAt, previous.lastSuccessAt);
  assert.equal(merged.sources[0].status, 'error');
  assert.equal(publicSnapshot(merged, 'cached', now).stale, true);
});

test('refresh deduplicates URLs and preserves discovery and original known date', () => {
  const entry = normalizeEntry(sample, source, new Date('2026-10-01T00:00:00Z'));
  const newEntry = normalizeEntry({ ...sample, publishedAt: null }, source, now);
  const merged = mergeSnapshot({ entries: [entry], sources: [] }, [{ sourceId: source.id, ok: true, entries: [newEntry], checkedAt: now.toISOString() }], [source], now);
  assert.equal(merged.entries.length, 1);
  assert.equal(merged.entries[0].discoveredAt, entry.discoveredAt);
  assert.equal(merged.entries[0].publishedAt, entry.publishedAt);
  assert.equal(merged.lastSuccessAt, now.toISOString());
});

test('one failed partner retains content while another receives fresh items', () => {
  const other = { ...source, id: 'other', name: 'Other', hosts: ['other.example'], page: 'https://other.example/news/' };
  const old = normalizeEntry(sample, source, now);
  const fresh = normalizeEntry({ ...sample, url: 'https://other.example/new' }, other, now);
  const merged = mergeSnapshot({ entries: [old], sources: [] }, [
    { sourceId: source.id, ok: false, error: 'HTTP_503' },
    { sourceId: other.id, ok: true, entries: [fresh] },
  ], [source, other], now);
  assert.equal(merged.entries.length, 2);
  assert.deepEqual(merged.sources.map(row => row.status), ['error', 'ok']);
});
