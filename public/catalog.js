import { esc, safeProduct } from './products.js';
export const categoryOf=p=>({Taras:'Tarasy',Nawierzchnie:'Kostka'}[p.category]||p.category);
export function homeCatalog(entries, scenes) {
  const ids=new Set(scenes.map(p=>p.id)),images=new Set(scenes.map(p=>p.image));
  const remaining=entries.filter(p=>!ids.has(p.id)&&!images.has(p.image));
  const opening=['Tarasy','Ogrodzenia','Światło','Kostka'].map(c=>remaining.find(p=>categoryOf(p)===c)).filter(Boolean);
  const chosen=new Set(opening.map(p=>p.id));
  return [...opening,...remaining.filter(p=>!chosen.has(p.id))];
}
export function prepareCatalog(news, curated) {
  const all=[...news.filter(safeProduct).map(p=>({...p,category:categoryOf(p),kind:'new'})),
    ...curated.filter(safeProduct).map(p=>({...p,category:categoryOf(p),kind:'selection',badge:'Wybór Markin'}))];
  const rank=p=>Number.isFinite(p.priority)?p.priority:/Norgestone/.test(p.title)?-4:/Line ALU/.test(p.title)?-2:/Imola/.test(p.title)?-1:0;
  const unique=[...new Map(all.map(p=>[p.id,p])).values()].sort((a,b)=>rank(a)-rank(b));
  const featured=unique.filter(p=>Number.isFinite(p.priority)&&p.priority<=-8).slice(0,4);
  const featuredIds=new Set(featured.map(p=>p.id));
  const buckets=['Tarasy','Ogrodzenia','Światło','Kostka'].map(c=>unique.filter(p=>p.category===c&&!featuredIds.has(p.id)));
  const result=[...featured];while(buckets.some(b=>b.length))for(const b of buckets)if(b.length)result.push(b.shift());
  return result;
}
export function tickerItems(entries) {
  const one=entries.slice(0,12).map(p=>`<a href="nowosci.html#produkt-${esc(p.id)}"><b>${esc(p.partner)}</b><span>${esc(p.title)}</span><i>✦</i></a>`).join('');
  return `<div class="ticker-set">${one}</div><div class="ticker-set" aria-hidden="true" inert>${one}</div>`;
}
export function campaign(scenes) {
  return `<section class="campaign" data-showcase data-scene aria-label="Aranżacje partnerów Markin" aria-roledescription="karuzela">
    <div class="product-viewport" tabindex="0" aria-label="Zmieniaj aranżacje strzałkami"><div class="product-track">${scenes.map((p,i)=>`<article class="product-slide scene" data-id="${esc(p.id)}" role="group" aria-roledescription="slajd" aria-label="${i+1} z ${scenes.length}: ${esc(p.title)}" ${i?'inert aria-hidden="true"':''}><img class="scene-photo" src="${esc(p.image)}" alt="${esc(p.title)} — aranżacja ze strony ${esc(p.partner)}" width="1800" height="1000" ${i?'loading="eager"':'fetchpriority="high"'}><a class="scene-credit" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer"><span>Aranżacja partnera / ${esc(p.partner)}</span><strong>${esc(p.title)} ↗</strong></a></article>`).join('')}</div></div>
    <div class="campaign-overlay wrap"><span class="eyebrow">MARKIN / DOM I OGRÓD</span><h1>Dom zaczyna się<br><em>na zewnątrz.</em></h1><p>Przestrzeń, do której chce się wracać.<br>Znajdź materiały do swojego pomysłu.</p><div class="actions"><a class="btn btn-lime" href="oferta.html">Zobacz ofertę ↗</a><a class="btn btn-light" href="nowosci.html">Nowości produktowe ↗</a></div></div>
    <div class="campaign-controls wrap product-controls"><div class="product-dots" aria-label="Wybierz aranżację">${scenes.map((p,i)=>`<button type="button" data-slide="${i}" aria-label="Pokaż ${esc(p.title)}" aria-current="${i===0}"><span></span></button>`).join('')}</div><span class="product-counter">01 / ${String(scenes.length).padStart(2,'0')}</span><div class="product-arrows"><button type="button" data-product-prev aria-label="Poprzednia aranżacja">←</button><button type="button" data-product-pause aria-label="Wstrzymaj pokaz" aria-pressed="false">Ⅱ</button><button type="button" data-product-next aria-label="Następna aranżacja">→</button></div></div>
  </section>`;
}
