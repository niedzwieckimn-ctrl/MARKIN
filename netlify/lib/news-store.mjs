import { getStore } from '@netlify/blobs';
import { SEED } from './news-seed.mjs';

export const CACHE_KEY = 'snapshot-v1';
export function openNewsStore() {
  // Previews may read production news but cannot refresh through a public endpoint.
  // Scheduled runs are production-only; local development uses Netlify's local sandbox.
  return getStore({ name: 'markin-partner-news-v1', consistency: 'strong' });
}

export async function readNews(store) {
  const snapshot = await store.get(CACHE_KEY, { type: 'json', consistency: 'strong' });
  if (snapshot?.schemaVersion === 1 && Array.isArray(snapshot.entries) && Array.isArray(snapshot.sources)) return snapshot;
  return null;
}

export async function readVersionedNews(store) {
  const blob = await store.getWithMetadata(CACHE_KEY, { type: 'json', consistency: 'strong' });
  if (!blob) return null;
  if (blob.data?.schemaVersion !== 1 || !Array.isArray(blob.data.entries) || !Array.isArray(blob.data.sources) || !blob.etag) {
    throw new Error('INVALID_NEWS_CACHE');
  }
  return { snapshot: blob.data, etag: blob.etag };
}

export async function writeNewsIfUnchanged(store, snapshot, previous) {
  // Scheduled and Run now invocations can overlap. Never let a slow run erase
  // entries written since its initial read; the next scheduled run will retry.
  return store.setJSON(CACHE_KEY, snapshot, previous?.etag
    ? { onlyIfMatch: previous.etag }
    : { onlyIfNew: true });
}

export { SEED };
