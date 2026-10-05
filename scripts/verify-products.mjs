import { mkdir, writeFile } from 'node:fs/promises';
import { SOURCES } from '../netlify/lib/product-sources.mjs';
import { refreshProducts, fetchProductImage, imageKey } from '../netlify/lib/product-core.mjs';
import { SEED } from '../netlify/lib/news-seed.mjs';
const write = process.argv.includes('--write');
const snapshot = await refreshProducts(SEED, SOURCES, {
  async saveImage(entry, source) {
    const { bytes, type } = await fetchProductImage(entry.imageSource, source);
    const file = `assets/products/${imageKey(entry.imageSource)}.${type === 'image/jpeg' ? 'jpg' : type.split('/')[1]}`;
    if (write) {
      await mkdir('public/assets/products', { recursive: true });
      await writeFile('public/' + file, bytes);
    }
    return file;
  }
});
console.log(JSON.stringify({ entries: snapshot.entries.map(({title,partner,image})=>({title,partner,image})), sources: snapshot.sources }, null, 2));
if (write) {
  if (!snapshot.entries.length) throw Error('No verified products; no snapshot written');
  await writeFile('public/data/partner-news.json', JSON.stringify(snapshot, null, 2) + '\n');
  await writeFile('netlify/lib/news-seed.mjs', 'export const SEED = ' + JSON.stringify(snapshot, null, 2) + ';\n');
}
if (snapshot.sources.some(s => s.status !== 'ok')) process.exitCode = 1;
