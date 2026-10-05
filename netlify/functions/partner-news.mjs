import { openNewsStore, readNews, SEED } from '../lib/news-store.mjs';
import { publicSnapshot } from '../lib/news-core.mjs';

export default async function handler(request) {
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  let snapshot = SEED;
  let mode = 'snapshot';
  try {
    const cached = await readNews(openNewsStore());
    if (cached) { snapshot = cached; mode = 'cached'; }
  } catch {
    // Public visitors still receive the bundled verified snapshot if storage is unavailable.
    console.warn('partner-news: blob cache unavailable; serving bundled snapshot');
  }
  const body = request.method === 'HEAD' ? null : JSON.stringify(publicSnapshot(snapshot, mode));
  return new Response(body, { headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=60',
    'Netlify-CDN-Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
    'X-Content-Type-Options': 'nosniff',
  } });
}

export const config = { path: '/api/partner-news' };
