import test from 'node:test';
import assert from 'node:assert/strict';
import { discover, productDetail } from '../netlify/lib/product-discovery.mjs';
import { refreshProducts, outputSnapshot, product, fetchProductImage } from '../netlify/lib/product-core.mjs';
import { readNews, CACHE_KEY } from '../netlify/lib/news-store.mjs';
import { SOURCES } from '../netlify/lib/product-sources.mjs';
import { verifiedChain, mayCompleteChain } from '../netlify/lib/partner-fetch.mjs';
const s=SOURCES.find(x=>x.id==='tarrace'), now=new Date('2026-11-09T11:00:00Z');
const card=(name,novel=false)=>`<article class="trc-card"><a href="/produkty/${name}/"><img src="/images/${name}.webp">${novel?'<span class="trc-badge">NOWOŚĆ</span>':''}<h2>Model ${name}</h2></a></article>`;
const options=(html,imageError=false)=>({now,fetchImpl:async()=>new Response(html,{headers:{'Content-Type':'text/html'}}),saveImage:async()=>{if(imageError)throw Error('IMAGE_UNAVAILABLE');return 'assets/products/abcd.webp';}});

test('current catalogue is a baseline; subsequent additions are not assigned a launch date',async()=>{
  const first=await refreshProducts({},[s],options(card('one')));
  assert.equal(first.entries.length,0);assert.equal(first.sources[0].status,'monitoring');
  const next=await refreshProducts(first,[s],options(card('one')+card('new')));
  assert.deepEqual(next.entries.map(e=>e.title),['Model new']);assert.equal(next.entries[0].publishedAt,null);
  const again=await refreshProducts(next,[s],options(card('one')+card('new')));
  assert.equal(again.entries.length,1);assert.equal(again.sources[0].newThisRun,0);
  const withdrawn=await refreshProducts(again,[s],options(card('one')));
  assert.equal(withdrawn.entries.length,0);
});
test('explicit novelty badge can publish on first scan; other catalogue items are not relabelled',async()=>{
  const data=await refreshProducts({},[s],options(card('established')+card('novel',true)));
  assert.deepEqual(data.entries.map(e=>e.title),['Model novel']);assert.match(data.entries[0].badge,/Nowość/);
});
test('transient photo failure retries the same new card next day rather than losing it',async()=>{
  const first=await refreshProducts({},[s],options(card('one')));
  const bad=await refreshProducts(first,[s],options(card('new')+card('one'),true));
  assert.equal(bad.sources[0].status,'partial');assert.deepEqual(bad.observed[s.id],first.observed[s.id]);
  const fixed=await refreshProducts(bad,[s],options(card('new')+card('one')));
  assert.equal(fixed.entries.length,1);
});
test('only approved product URLs from a sitemap are candidates; lastmod is not a launch date',()=>{
  const src=SOURCES.find(x=>x.id==='tubadzin');
  const body='<urlset><url><loc>https://www.tubadzin.pl/produkt/wood-deck-korater-str</loc><lastmod>2026-11-09</lastmod></url><url><loc>https://www.tubadzin.pl/blog/korater</loc></url><url><loc>https://example.net/produkt/fake-korater</loc></url></urlset>';
  assert.deepEqual(discover(body,src),[{url:'https://www.tubadzin.pl/produkt/wood-deck-korater-str'}]);
});
test('CDN allowed for a product photo does not become an allowed article or product host',()=>{
  const src=SOURCES.find(x=>x.id==='tubadzin'), url='https://www.tubadzin.pl/produkt/wood-deck-korater-str';
  const parsed=productDetail('<h1>Wood Deck koraTER</h1><meta property="og:image" content="https://apiprod7ga8u.tubadzin.pl/media/image.jpg">',{url},src);
  assert.ok(product(parsed,src,now));assert.equal(product({...parsed,url:'https://apiprod7ga8u.tubadzin.pl/produkt/test-korater'},src,now),null);
});
test('cache versions are isolated, old suppliers cannot escape through cached output, internal URL history is private',async()=>{
  assert.equal(CACHE_KEY,'products-v7');
  assert.equal(await readNews({get:async()=>({schemaVersion:2,kind:'products',entries:[],sources:[]})}),null);
  const snap=await refreshProducts({},[s],options(card('novel',true)));
  const out=outputSnapshot({...snap,entries:[...snap.entries,{...snap.entries[0],partner:'Obsolete name',sourceId:'obsolete-id'}],sources:[...snap.sources,{id:'obsolete-id'}]},'cached',now);
  assert.equal(out.entries.length,1);assert.equal(out.sources.length,1);assert.equal('observed' in out,false);
});
test('chain completion requires a genuinely trusted root and a currently valid intermediate',()=>{
  assert.equal(verifiedChain(undefined,now.getTime()).length,2);
  assert.throws(()=>verifiedChain([],now.getTime()),/UNVERIFIED_ISSUING_CA/);
  assert.throws(()=>verifiedChain(undefined,Date.UTC(2040,0,1)),/UNVERIFIED_ISSUING_CA/);
  assert.equal(mayCompleteChain(new URL('https://forbet.pl/produkty/'),'UNABLE_TO_VERIFY_LEAF_SIGNATURE'),true);
  for(const [u,code] of [['https://evil.example','UNABLE_TO_VERIFY_LEAF_SIGNATURE'],['https://forbet.pl:8443/','UNABLE_TO_VERIFY_LEAF_SIGNATURE'],['https://forbet.pl/','CERT_HAS_EXPIRED'],['https://forbet.pl/','ERR_TLS_CERT_ALTNAME_INVALID']])assert.equal(mayCompleteChain(new URL(u),code),false);
});
