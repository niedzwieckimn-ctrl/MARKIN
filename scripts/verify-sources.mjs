import { mkdir, writeFile } from 'node:fs/promises';
import { SOURCES } from '../netlify/lib/news-sources.mjs';
import { fetchBounded, parseFeed, parseHtml, refreshNews } from '../netlify/lib/news-core.mjs';
import { SEED } from '../netlify/lib/news-seed.mjs';

await mkdir('test/live', { recursive: true });
await Promise.all(SOURCES.map(async source => {
  for (const [kind, url] of [...source.feeds.map(url => ['rss', url]), ['html', source.page]]) {
    try {
      const body = await fetchBounded(url, source);
      await writeFile(`test/live/${source.id}.${kind === 'rss' ? 'xml' : 'html'}`, body);
      let entries = [];
      try { entries = kind === 'rss' ? parseFeed(body, source) : parseHtml(body, source); }
      catch (error) { console.log(JSON.stringify({ id: source.id, kind, parserError: error.message })); }
      console.log(JSON.stringify({ id: source.id, kind, url, bytes: Buffer.byteLength(body),
        entries: entries.length, first: entries[0] || null }));
    } catch (error) { console.log(JSON.stringify({ id: source.id, kind, url, error: error.message })); }
  }
}));

if (process.argv.includes('--write')) {
  const snapshot = await refreshNews(SEED, SOURCES);
  await mkdir('public/data', { recursive: true });
  await writeFile('public/data/partner-news.json', JSON.stringify(snapshot, null, 2) + '\n');
  await writeFile('netlify/lib/news-seed.mjs', `// Initial verified snapshot. Refreshed only by scripts/verify-sources.mjs --write.\nexport const SEED = ${JSON.stringify(snapshot, null, 2)};\n`);
  console.log(JSON.stringify({ snapshotEntries: snapshot.entries.length, sources: snapshot.sources }));
}
