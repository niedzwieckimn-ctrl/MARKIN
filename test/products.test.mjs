import test from 'node:test';
import assert from 'node:assert/strict';
import { SOURCES } from '../netlify/lib/product-sources.mjs';
import { product, parseProducts, fetchProducts, refreshProducts, fetchProductImage } from '../netlify/lib/product-core.mjs';
import { safeProduct, productCard } from '../public/products.js';
import imageHandler from '../netlify/functions/product-image.mjs';
import { SEED } from '../netlify/lib/news-seed.mjs';
const now=new Date('2026-10-05T19:00:00Z'), drog=SOURCES[0], poz=SOURCES[1];
const slide=(title='Model w nowym kolorze Lumino!',url='/produkt/model/',image='https://www.drogbruk.pl/photo.jpg')=>`<div class="swiper-slide"><h2>${title}</h2><img src="${image}"><a href="${url}">Sprawdź</a></div>`;
const htmlResponse=text=>new Response(text,{headers:{'Content-Type':'text/html'}});
const image='assets/products/abcdef.jpg';

test('product adapters never treat general headlines or promotions as new products',()=>{
  const items=parseProducts(slide()+slide('Nowości z targów','/aktualnosci/targi/')+slide('Nowość! Promocja 20%','/produkt/promocja/'),drog,now);
  assert.equal(items.length,1);assert.equal(items[0].title,'Model Lumino');assert.equal(items[0].publishedAt,null);
});
test('POZBRUK parser stays inside explicitly marked novelties, excluding general catalogue',()=>{
  const card=title=>`<div class="e-loop-item"><a href="/produkt/${title}/"><img src="https://pozbruk.pl/${title}.webp"><h3>${title}</h3></a></div>`;
  const items=parseProducts(`<section><h2>Nowości 2026</h2>${card('FRESCO')}</section><section><h2>Wszystkie produkty</h2>${card('OLD')}</section>`,poz,now);
  assert.deepEqual(items.map(p=>p.title),['FRESCO']);assert.equal(items[0].badge,'Nowości 2026');
});
test('removed partners, external image hosts, credential URLs and non-image files are refused',()=>{
  const raw={title:'Nowy produkt',url:'/produkt/a/',imageSource:'https://www.drogbruk.pl/a.jpg'};
  for(const entry of [{...raw,title:'Gatigo produkt'},{...raw,title:'Semmelrock model'},{...raw,imageSource:'https://evil.test/a.jpg'}, {...raw,imageSource:'https://www.drogbruk.pl/a.svg'}, {...raw,url:'https://x:y@www.drogbruk.pl/produkt/a/'}]) assert.equal(product(entry,drog,now),null);
});
test('complete source failure retains only current allowed suppliers and verified product images',async()=>{
  const previous={...SEED,entries:[...SEED.entries,{...SEED.entries[0],sourceId:'gatigo',partner:'Gatigo'}]};
  const result=await refreshProducts(previous,SOURCES,{now,fetchImpl:async()=>{throw Error('network detail');}});
  assert.equal(result.entries.length,SEED.entries.length);assert.ok(result.sources.every(s=>s.status==='error'));assert.equal(result.lastSuccessAt,SEED.lastSuccessAt);assert.ok(result.entries.every(p=>p.image));
});
test('successful source replaces old products; it does not accumulate discontinued novelties forever',async()=>{
  const previous={...SEED,entries:[{...SEED.entries[0],image}]};
  const result=await refreshProducts(previous,[drog],{now,fetchImpl:async()=>htmlResponse(slide()),saveImage:async()=>image});
  assert.equal(result.entries.length,1);assert.equal(result.entries[0].title,'Model Lumino');assert.equal(result.schemaVersion,2);assert.equal(result.kind,'products');
});
test('new products with failed images cannot displace the last usable snapshot',async()=>{
  const previous={...SEED,entries:[{...SEED.entries[0],image}]};
  const result=await refreshProducts(previous,[drog],{now,fetchImpl:async()=>htmlResponse(slide()),saveImage:async()=>{throw Error('no image');}});
  assert.deepEqual(result.entries,previous.entries);assert.equal(result.sources[0].status,'error');
});
test('image failure for an existing product retains its image and reports partial status',async()=>{
  const old={...product({title:'Model Lumino',url:'/produkt/model/',imageSource:'https://www.drogbruk.pl/photo.jpg'},drog,now),image};
  const result=await refreshProducts({entries:[old],sources:[]},[drog],{now,fetchImpl:async()=>htmlResponse(slide()),saveImage:async()=>{throw Error('broken');}});
  assert.equal(result.entries[0].image,image);assert.equal(result.sources[0].status,'partial');
});
test('HTML redesign fails explicitly rather than accepting unrelated catalogue images',()=>{
  assert.throws(()=>parseProducts('<h1>Page updated</h1><img src="a.jpg">',poz),/SOURCE_STRUCTURE_CHANGED/);
});
test('image request blocks redirects, oversize streams and HTML disguised as photos',async()=>{
  let calls=0;
  await assert.rejects(fetchProductImage('https://www.drogbruk.pl/a.jpg',drog,{fetchImpl:async()=>{calls++;return new Response(null,{status:302,headers:{location:'http://127.0.0.1/private'}});}}),/BLOCKED_REDIRECT/);assert.equal(calls,1);
  await assert.rejects(fetchProductImage('https://www.drogbruk.pl/a.jpg',drog,{fetchImpl:async()=>new Response('huge',{headers:{'content-length':'4000001'}})}),/IMAGE_TOO_LARGE/);
  await assert.rejects(fetchProductImage('https://www.drogbruk.pl/a.jpg',drog,{fetchImpl:async()=>new Response(new Uint8Array(4000001))}),/IMAGE_TOO_LARGE/);
  await assert.rejects(fetchProductImage('https://www.drogbruk.pl/a.jpg',drog,{fetchImpl:async()=>new Response('<html>Oops</html>',{headers:{'content-type':'image/jpeg'}})}),/INVALID_IMAGE/);
});
test('image MIME is derived from file bytes rather than an untrusted Content-Type',async()=>{
  const result=await fetchProductImage('https://www.drogbruk.pl/a.jpg',drog,{fetchImpl:async()=>new Response(new Uint8Array([255,216,255,0]),{headers:{'content-type':'text/html'}})});
  assert.equal(result.type,'image/jpeg');
});
test('public image endpoint refuses arbitrary URLs and write methods before storage access',async()=>{
  assert.equal((await imageHandler(new Request('https://markin.pl/api/product-image?id=https://evil.test'))).status,400);
  assert.equal((await imageHandler(new Request('https://markin.pl/api/product-image',{method:'POST'}))).status,405);
});
test('UI requires product photos on local paths and escapes supplier text',()=>{
  const p={...SEED.entries[0],title:'Test <img src=x onerror=evil()>',image};
  assert.equal(safeProduct(p),true);assert.ok(productCard(p).includes('&lt;img'));assert.ok(!productCard(p).includes('<img src=x'));
  assert.equal(safeProduct({...p,image:'https://evil.test/photo.jpg'}),false);assert.equal(safeProduct({...p,partner:'Gatigo'}),false);
  assert.equal(safeProduct({title:'A headline',url:'https://www.drogbruk.pl/'}),false);
});
