import { openNewsStore } from '../lib/news-store.mjs';
export default async function handler(request) {
  if (!['GET','HEAD'].includes(request.method)) return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  const id = new URL(request.url).searchParams.get('id');
  if (!/^[a-f0-9]{64}$/.test(id || '')) return new Response(null, { status: 400 });
  try {
    const blob = await openNewsStore().getWithMetadata('images/' + id, { type: 'arrayBuffer' });
    if (!blob || !['image/jpeg','image/png','image/webp'].includes(blob.metadata?.type)) return new Response(null, { status: 404 });
    return new Response(request.method === 'HEAD' ? null : blob.data, { headers: {
      'Content-Type': blob.metadata.type, 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff'
    } });
  } catch { return new Response(null, { status: 503 }); }
}
export const config = { path: '/api/product-image' };
