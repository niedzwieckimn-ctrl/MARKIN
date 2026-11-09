import { createHash } from 'node:crypto';
import { load } from 'cheerio/slim';
import { canonicalUrl, plainText, fetchBounded } from './news-core.mjs';
import { productUrl, imageUrl, discover, productDetail, collectionUrls } from './product-discovery.mjs';
import { SOURCES, SOURCE_POLICY_VERSION } from './product-sources.mjs';
import { partnerFetch } from './partner-fetch.mjs';

const bg = value => value?.match(/background-image\s*:\s*url\(['"]?([^)'"\s]+)['"]?\)/i)?.[1];
const forbidden = /promocj|wyprzeda|konkurs|wkrótce/i;
export const imageKey = url => createHash('sha256').update(url).digest('hex');
const productName=value=>plainText(value,96).replace(/\s*[-–—:]?\s*\bnowość\s*!*\s*$/iu,'').trim();
function descriptionOf(item,src){
  if(src.id==='tarrace'&&/^\d+(?:[.,]\d+)?\s*[×x]\s*\d+(?:[.,]\d+)?\s*cm\s*·\s*\d+\s*mm$/iu.test(item.spec||''))return 'Format i grubość według TARRACE: '+item.spec+'.';
  if(src.id==='pater'&&/stopie/i.test(item.title))return 'Stopień schodowy z betonowych elementów do zagospodarowania terenu Pater.';
  if(src.id==='pater'&&/płyta/i.test(item.title))return 'Betonowa płyta z oferty Pater do aranżacji tarasu.';
  if(src.id==='crusil')return 'Kolekcja płyt ceramiczno-betonowych Crusil do przestrzeni zewnętrznych.';
  return '';
}
export function product(raw, source, now = new Date()) {
  const url = productUrl(raw.url, source), imageSource = imageUrl(raw.imageSource, url || source.page, source);
  const title = productName(raw.title);
  if (!url || !imageSource || title.length < 4 || forbidden.test(title + url + imageSource)) return null;
  if (!/\.(jpe?g|png|webp)(?:\?|$)/i.test(imageSource)) return null;
  return { id: imageKey(source.id + ':' + url).slice(0, 20), title, url, imageSource,
    partner: source.name, sourceId: source.id, sourcePage: source.page,
    badge: plainText(raw.badge || 'W nowościach producenta', 50),
    description: plainText(raw.description || '', 220),
    category: raw.category || (source.id==='semmelrock'&&url.includes('/kostki-i-plyty-brukowe/')?'Nawierzchnie':source.id==='pater'&&/stopie|palisad|obrze[zż]/i.test(url+title)?'Architektura ogrodowa':source.category),
    discoveredAt: now.toISOString(), publishedAt: null };
}

export function parseProducts(body, source, now = new Date()) {
  const $ = load(body), raw = [];
  if (source.id === 'drogbruk') {
    const slides = $('.swiper-slide').filter((i, e) => $(e).find('h2').length);
    if (!slides.length) throw Error('SOURCE_STRUCTURE_CHANGED');
    slides.each((i, e) => {
      const row = $(e), title = row.find('h2').first().text().trim();
      if (!/nowo|nowym kolor/i.test(title)) return;
      const url = row.find('a[href*="/produkt/"]').first().attr('href');
      if (!url) return;
      raw.push({ title: title.replace(/\s+w nowym kolorze\s+/i, ' ').replace(/!+$/, ''), url,
        imageSource: row.find('img').first().attr('src'), badge: /kolor/i.test(title) ? 'Nowy kolor' : 'Nowość producenta',
        description: 'Nadaj nawierzchni nowy charakter. Zestaw odcień z elewacją, zielenią i detalami swojego domu.' });
    });
  } else if (source.id === 'ledbruk') {
    if (!$('.et_pb_section').length) throw Error('SOURCE_STRUCTURE_CHANGED');
    $('.et_pb_section').each((i,e) => {
      const row = $(e), title = row.find('h1,h2').first().text().replace(/KostkaBrukowa/g,'Kostka Brukowa');
      if (!title || forbidden.test(row.text()) || !/LedBruk/i.test(title)) return;
      const link = row.find('a[href*="/produkty/"]').first().attr('href');
      if (!link) return;
      const style = row.find('[style*="background-image"]').first().attr('style');
      raw.push({ title, url: link, imageSource: bg(style),
        description: 'Światło zmienia ogród po zmroku. Podkreśl przebieg ścieżki i nadaj wieczorom własny nastrój.' });
    });
  }
  return [...new Map(raw.map(r => product(r, source, now)).filter(Boolean).map(p => [p.url, p])).values()].slice(0, source.limit);
}

export async function fetchProducts(source, options = {}) {
  const body = await fetchBounded(source.page, source, options);
  const entries = parseProducts(body, source, options.now);
  if (source.id === 'ledbruk') {
    const $ = load(body);
    const links = [...new Set($('a').filter((i,e) => /\(nowość\)/i.test($(e).text()))
      .map((i,e) => canonicalUrl($(e).attr('href'), source)).get().filter(Boolean))].slice(0, 3);
    const details = await Promise.all(links.map(async url => {
      const html = await fetchBounded(url, source, options), d = load(html);
      // Reviewed product hero photograph, not icons, logos or a video thumbnail guessed from a filename.
      const hero = bg(d('style').text());
      const imageSource = hero || d('#main-content img[src*="/uploads/"]').filter((i,e) => !/ikona|ikony|logo|150x150|PDF/i.test(d(e).attr('src'))).first().attr('src');
      return product({ title: d('h1').first().text(), url, imageSource, badge: 'Nowość w ofercie producenta',
        description: 'Jedna linia światła, zupełnie inny wieczór. Podkreśl geometrię tarasu, ścieżek i wejścia do domu.' }, source, options.now);
    }));
    entries.push(...details.filter(Boolean));
  }
  if (!entries.length) throw Error('NO_VERIFIED_PRODUCTS');
  return entries.slice(0, source.limit);
}

export async function fetchProductImage(url, source, { fetchImpl = partnerFetch } = {}) {
  const imagePolicy={...source,hosts:[...source.hosts,...(source.imageHosts||[])]};
  if (!canonicalUrl(url, imagePolicy)) throw Error('BLOCKED_HOST');
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 5000);
  let reader;
  try {
    let response, target = url;
    for (let i = 0; i <= 3; i++) {
      response = await fetchImpl(target, { redirect: 'manual', signal: controller.signal });
      if (response.status < 300 || response.status >= 400) break;
      const next = new URL(response.headers.get('location') || '', target).href;
      await response.body?.cancel();
      if (i === 3 || !canonicalUrl(next, imagePolicy)) throw Error('BLOCKED_REDIRECT');
      target = next;
    }
    if (!response.ok) throw Error('IMAGE_UNAVAILABLE');
    if (Number(response.headers.get('content-length')) > 4_000_000) throw Error('IMAGE_TOO_LARGE');
    reader = response.body.getReader();
    const chunks = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > 4_000_000) { await reader.cancel(); throw Error('IMAGE_TOO_LARGE'); }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks);
    const type = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? 'image/jpeg'
      : bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png'
      : bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP' ? 'image/webp' : null;
    if (!type) throw Error('INVALID_IMAGE');
    return { bytes, type };
  } finally { clearTimeout(timeout); reader?.releaseLock(); }
}

const localImage=p=>typeof p==='string'&&/^(?:assets\/products\/[a-f\d]+\.(?:jpg|png|webp)|\/api\/product-image\?id=[a-f\d]{64})$/i.test(p);
export function filterSnapshot(snapshot,sources=SOURCES){
  const allowed=new Map(sources.map(s=>[s.id,s]));
  return {...snapshot,
    entries:(snapshot?.entries||[]).filter(e=>{const s=allowed.get(e.sourceId);return s&&e.partner===s.name&&localImage(e.image)&&product(e,s);}),
    sources:(snapshot?.sources||[]).filter(s=>allowed.has(s.id))};
}
export function outputSnapshot(data,mode,now=new Date()){
  const {observed,...snapshot}=filterSnapshot(data);
  return {...snapshot,mode,stale:!snapshot.lastSuccessAt||now-Date.parse(snapshot.lastSuccessAt)>72*3600_000};
}

export async function refreshProducts(previous, sources, options = {}) {
  const now=options.now || new Date(),timestamp=now.toISOString();
  const policy=filterSnapshot(previous,sources), priorSeen=previous?.observed||{};
  const get=async(url,s)=>fetchBounded(url,s,{...options,timeoutMs:options.timeoutMs||s.timeoutMs||4800});
  const results=await Promise.all(sources.map(async source=>{
    const old=policy.entries.filter(p=>p.sourceId===source.id),prior=policy.sources.find(s=>s.id===source.id);
    const seen=Array.isArray(priorSeen[source.id])?priorSeen[source.id].filter(x=>productUrl(x,source)):null;
    const health=(status,count,extra={})=>({id:source.id,name:source.name,url:source.humanPage||source.page,status,count,checkedAt:timestamp,lastSuccessAt:status==='error'?prior?.lastSuccessAt||null:timestamp,...extra});
    try{
      let fresh=[],observed=seen,keepOld=false,failures=0,visible=null;
      if(source.mode==='explicit')fresh=await fetchProducts(source,{...options,now,timeoutMs:4800});
      else{
        const pages=source.mode==='collections'?collectionUrls(await get(source.page,source),source):[source.page,...(source.extraPages||[])];
        const batches=await Promise.all(pages.map(async page=>discover(await get(page,source),source,page)));
        const all=[...new Map(batches.flat().map(item=>[item.url,item])).values()];
        visible=new Map(all.map(item=>[item.url,item]));
        if(!all.length&&!source.allowEmpty)throw Error('NO_VERIFIED_PRODUCTS');
        const known=new Set(seen||[]);keepOld=true;
        // First read is a baseline, never a bulk announcement. Explicit novelty labels are independently eligible.
        const pending=all.filter(x=>seen?!known.has(x.url):x.explicit).slice(0,2);
        if(!seen)for(const x of all)if(!x.explicit)known.add(x.url);
        fresh=(await Promise.all(pending.map(async item=>{
          try{let card=item;
            if(!card.title||!card.imageSource)card=productDetail(await get(item.url,source),item,source);
            const entry=product({...card,badge:item.explicit?'Nowość w katalogu producenta':'Nowo dodane do zestawienia',description:descriptionOf(card,source)},source,now);
            if(!entry)throw Error('INVALID_PRODUCT_DETAIL');return entry;
          }catch{failures++;return null;}
        }))).filter(Boolean);
        observed=[...known];
      }
      const ready=(await Promise.all(fresh.map(async e=>{
        const prior=old.find(o=>o.url===e.url);
        try{const image=prior?.imageSource===e.imageSource&&localImage(prior?.image)?prior.image:await options.saveImage(e,source);
          if(!localImage(image))throw Error('INVALID_IMAGE');return {...e,image,discoveredAt:prior?.discoveredAt||timestamp};
        }catch{failures++;return prior||null;}
      }))).filter(Boolean);
      if(source.mode==='explicit'&&!ready.length)throw Error('NO_PRODUCT_IMAGES');
      if(observed)observed=[...new Set([...observed,...ready.map(e=>e.url)])].slice(-4000);
      const entries=keepOld?[...new Map([...ready,...old.filter(o=>visible.has(o.url)&&!ready.some(e=>e.url===o.url)).map(o=>({...o,title:productName(o.title),description:descriptionOf(visible.get(o.url),source)}))].map(e=>[e.url,e])).values()].slice(0,source.limit):ready;
      return {entries,observed,health:health(failures?'partial':entries.length?'ok':'monitoring',entries.length,{newThisRun:ready.filter(e=>!old.some(o=>o.url===e.url)).length,...(failures?{error:'SOME_PRODUCT_DETAILS_UNAVAILABLE'}:{})})};
    }catch(error){return {entries:old,observed:seen,health:health('error',old.length,{error:/^[A-Z_0-9]+$/.test(error.message)?error.message:'SOURCE_UNAVAILABLE'})};}
  }));
  return {schemaVersion:2,policyVersion:SOURCE_POLICY_VERSION,kind:'products',generatedAt:timestamp,
    lastSuccessAt:results.some(r=>r.health.status!=='error')?timestamp:previous?.lastSuccessAt||null,
    entries:results.flatMap(r=>r.entries).sort((a,b)=>(b.discoveredAt||'').localeCompare(a.discoveredAt||'')||a.id.localeCompare(b.id)),
    sources:results.map(r=>r.health),observed:Object.fromEntries(results.filter(r=>r.observed).map(r=>[r.health.id,r.observed]))};
}

