import test from 'node:test';
import assert from 'node:assert/strict';
import { canRefreshProduction } from '../netlify/lib/news-context.mjs';
import { readVersionedNews, writeNewsIfUnchanged } from '../netlify/lib/news-store.mjs';
import refreshHandler from '../netlify/functions/refresh-partner-news.mjs';

test('refresh uses runtime deploy context and only currently published production', () => {
  assert.equal(canRefreshProduction({ deploy: { context: 'production', published: true } }), true);
  for (const context of [undefined, {}, { deploy: {} },
    { deploy: { context: 'production', published: false } },
    { deploy: { context: 'production' } },
    { deploy: { context: 'deploy-preview', published: true } },
    { deploy: { context: 'branch-deploy', published: true } },
    { deploy: { context: 'dev', published: true } }]) {
    assert.equal(canRefreshProduction(context), false);
  }
});

test('preview invocation stops before any unavailable production store access', async () => {
  // No Blobs credentials are present in this unit test: touching the store would throw.
  await assert.doesNotReject(refreshHandler(null, { deploy: { context: 'deploy-preview', published: false } }));
  await assert.doesNotReject(refreshHandler(null, undefined));
});

test('cache refresh uses conditional ETag write to prevent a stale overlapping run', async () => {
  let value = { schemaVersion: 1, entries: [{ id: 'old' }], sources: [] };
  let etag = 'v1';
  const store = {
    async getWithMetadata() { return { data: structuredClone(value), etag }; },
    async setJSON(key, snapshot, options) {
      if (options.onlyIfMatch !== etag) return { modified: false };
      value = structuredClone(snapshot); etag = 'v2';
      return { modified: true, etag };
    },
  };
  const runA = await readVersionedNews(store);
  const runB = await readVersionedNews(store);
  const fresh = { ...value, entries: [{ id: 'new' }, { id: 'old' }] };
  assert.equal((await writeNewsIfUnchanged(store, fresh, runA)).modified, true);
  assert.equal((await writeNewsIfUnchanged(store, runB.snapshot, runB)).modified, false);
  assert.deepEqual(value.entries.map(entry => entry.id), ['new', 'old']);
});

test('missing blob creates only once and does not overwrite a concurrently created cache', async () => {
  const calls = [];
  const store = { async getWithMetadata() { return null; },
    async setJSON(key, value, options) { calls.push(options); return { modified: false }; } };
  const previous = await readVersionedNews(store);
  await writeNewsIfUnchanged(store, { schemaVersion: 1, entries: [], sources: [] }, previous);
  assert.deepEqual(calls, [{ onlyIfNew: true }]);
});

test('invalid or unversioned existing cache aborts instead of replacing persisted data', async () => {
  await assert.rejects(readVersionedNews({ async getWithMetadata() { return { data: {}, etag: 'v1' }; } }), /INVALID_NEWS_CACHE/);
});
