import { openNewsStore, readVersionedNews, writeNewsIfUnchanged, SEED } from '../lib/news-store.mjs';
import { refreshProducts, fetchProductImage, imageKey } from '../lib/product-core.mjs';
import { SOURCES } from '../lib/product-sources.mjs';
import { canRefreshProduction } from '../lib/news-context.mjs';

export default async function handler(_request, context) {
  // A manually invoked Deploy Preview must not overwrite the production cache.
  if (!canRefreshProduction(context)) {
    console.log('refresh-partner-news: skipped outside the currently published production deploy');
    return;
  }
  const store = openNewsStore();
  // If storage read fails, abort. Never overwrite valid persisted news with an empty state.
  const previous = await readVersionedNews(store);
  const snapshot = await refreshProducts(previous?.snapshot || SEED, SOURCES, {
    async saveImage(entry, source) {
      const id = imageKey(entry.imageSource);
      const { bytes, type } = await fetchProductImage(entry.imageSource, source);
      await store.set('images/' + id, bytes, { metadata: { type } });
      return '/api/product-image?id=' + id;
    }
  });
  const write = await writeNewsIfUnchanged(store, snapshot, previous);
  if (!write.modified) {
    console.log('refresh-partner-news: newer cache already saved by another run; skipped stale write');
    return;
  }
  console.log(JSON.stringify({ event: 'partner-news-refreshed', entries: snapshot.entries.length,
    sources: snapshot.sources.map(({ id, status, count, error }) => ({ id, status, count, error })) }));
}

// 05:00 UTC = 06:00 Europe/Warsaw in winter and 07:00 in summer.
// Scheduled Functions run only for published deploys; there is no public refresh URL.
export const config = { schedule: '0 5 * * *' };
