import { productCard, productSlide, safeProduct, startCarousel, esc } from './products.js';
const $ = (s,r=document)=>r.querySelector(s), $$ = (s,r=document)=>[...r.querySelectorAll(s)];
let entries = [];
try { entries=JSON.parse($('#product-data')?.textContent || '[]').filter(safeProduct); } catch {}
const seed=entries, storeKey='markin-inspirations-v2';
let selected='Wszystkie', saved=new Set(), signature='', stopCarousels=[];
try { const stored=JSON.parse(localStorage.getItem(storeKey)||'[]'); if(Array.isArray(stored)) saved=new Set(stored.filter(x=>typeof x==='string'&&/^[a-f0-9]{20}$/.test(x)).slice(0,24)); } catch {}
const drawer=$('.inspiration-dialog'), open=$('.inspiration-open');
let drawerOpener;
function updateSaved() {
  $$('[data-save]').forEach(button=>{const yes=saved.has(button.dataset.save);button.setAttribute('aria-pressed',String(yes));button.textContent=yes?'♥ Zapisano':'♡ Zapisz';button.setAttribute('aria-label',(yes?'Usuń z inspiracji: ':'Dodaj do inspiracji: ')+(entries.find(p=>p.id===button.dataset.save)?.title||'produkt'));});
  const list=entries.filter(p=>saved.has(p.id));
  if(open){open.hidden=saved.size===0;$('[data-saved-count]').textContent=list.length;}
  if(drawer){
    $('[data-saved-list]').innerHTML=list.length ? list.map(p=>`<article class="saved-item"><img src="${esc(p.image)}" alt="${esc(p.title)}" width="180" height="120"><div><span class="eyebrow">${esc(p.partner)}</span><h3>${esc(p.title)}</h3><button type="button" data-remove="${esc(p.id)}">Usuń z listy</button></div></article>`).join(''):'<p class="empty">Wybierz produkty, które chcesz zobaczyć przy swoim domu. Zapisane wcześniej produkty mogły opuścić aktualny wybór nowości.</p>';
    $('[data-saved-quote]').hidden=!list.length;
    $('[data-saved-quote]').href='kontakt.html?temat='+encodeURIComponent('Moje inspiracje: '+list.map(p=>p.partner+' '+p.title).join('; '));
  }
}
function persist(){try{localStorage.setItem(storeKey,JSON.stringify([...saved]));}catch{} updateSaved();}
document.addEventListener('click',e=>{
  const button=e.target.closest('[data-save],[data-remove]');if(!button)return;
  const id=button.dataset.save||button.dataset.remove;
  if(!entries.some(p=>p.id===id))return;
  if(button.dataset.remove||saved.has(id))saved.delete(id);else saved.add(id);
  persist();
  $('.save-status').textContent=saved.has(id)?'Produkt dodany do Twoich inspiracji.':'Produkt usunięty z inspiracji.';
  if(button.dataset.remove) $('[data-inspiration-close]')?.focus();
});
open?.addEventListener('click',()=>{drawerOpener=document.activeElement;updateSaved();drawer.showModal();document.body.classList.add('lock');});
$('[data-inspiration-close]')?.addEventListener('click',()=>drawer.close());
drawer?.addEventListener('close',()=>{document.body.classList.remove('lock');drawerOpener?.focus();});
$('[data-saved-clear]')?.addEventListener('click',()=>{saved.clear();persist();});
function filterProducts(){
  const grid=$('.news-page [data-news-grid]');if(!grid)return;
  $$('.news-card',grid).forEach(c=>c.hidden=selected!=='Wszystkie'&&c.dataset.partner!==selected);
  $('.empty',grid)?.remove();
  if(!$$('.news-card:not([hidden])',grid).length){const p=document.createElement('p');p.className='empty';p.textContent='Obecnie nie ma produktów tej marki w zestawieniu nowości. Zapytaj nas o jej ofertę.';grid.append(p);}
}
$$('[data-news-filters] .filter').forEach(button=>button.addEventListener('click',()=>{selected=button.dataset.filter;$$('[data-news-filters] .filter').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});filterProducts();}));
function activateCarousels(){ stopCarousels.forEach(stop=>stop());stopCarousels=$$('[data-showcase]').map(startCarousel); }
function showStatus(payload){
  const date=payload.generatedAt?new Date(payload.generatedAt):null;
  const checked=date&&!isNaN(date)?new Intl.DateTimeFormat('pl-PL',{dateStyle:'long',timeZone:'Europe/Warsaw'}).format(date):'';
  const partial=payload.stale||payload.sources?.some(s=>s.status!=='ok');
  $$('[data-news-status]').forEach(p=>p.textContent=(checked?'Sprawdzenie źródeł: '+checked+'. ':'')+'Oznaczenia nowości pochodzą od producentów. Zapytaj o cenę i dostępność.'+(partial?' Część zdjęć i opisów pochodzi z ostatniego poprawnego odczytu.':''));
}
async function renderProducts(payload){
  if(payload.schemaVersion!==2||payload.kind!=='products'||!Array.isArray(payload.entries))return;
  const next=payload.entries.filter(safeProduct).slice(0,12), nextSignature=JSON.stringify(next);
  if(!next.length)return;
  showStatus(payload);
  if(nextSignature===signature)return;
  // Do not replace a keyboard user's currently focused card or carousel.
  if(document.activeElement?.closest('[data-showcase],[data-news-grid],.inspiration-dialog'))return;
  const ready=await Promise.all(next.map(p=>new Promise(resolve=>{
    const img=new Image(),timer=setTimeout(()=>resolve(null),5000);
    img.onload=()=>{clearTimeout(timer);resolve(p);};
    img.onerror=()=>{clearTimeout(timer);const fallback=seed.find(s=>s.id===p.id);resolve(fallback||null);};
    img.src=p.image;
  })));
  const valid=ready.filter(Boolean);if(!valid.length)return;
  entries=valid;signature=nextSignature;
  stopCarousels.forEach(stop=>stop());stopCarousels=[];
  $$('[data-showcase]').forEach(root=>{
    $('.product-track',root).innerHTML=entries.map((p,i)=>productSlide(p,i,entries.length)).join('');
    $('.product-track',root).style.transform='';
    $('.product-dots',root).innerHTML=entries.map((p,i)=>`<button type="button" data-slide="${i}" aria-label="Pokaż ${esc(p.title)}" aria-current="${i===0}"><span></span></button>`).join('');
    $('.product-counter',root).textContent='01 / '+String(entries.length).padStart(2,'0');
  });
  $$('[data-news-grid]').forEach(grid=>grid.innerHTML=entries.slice(0,Number(grid.dataset.limit)||12).map(productCard).join(''));
  activateCarousels();filterProducts();updateSaved();
}
signature=JSON.stringify(entries);activateCarousels();updateSaved();
async function loadProducts(){
  if(location.protocol==='file:')return;
  try{const response=await fetch('/api/partner-news',{signal:AbortSignal.timeout(6000),headers:{Accept:'application/json'}});if(response.ok&&response.headers.get('content-type')?.includes('json'))await renderProducts(await response.json());}catch{}
}
loadProducts();let lastRefresh=Date.now();document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastRefresh>900000){lastRefresh=Date.now();loadProducts();}});
$$('[data-mood-photo]').forEach(button=>button.addEventListener('click',()=>{
  const root=$('.mood-section'),img=$('.hero-photo',root);img.removeAttribute('srcset');img.src=button.dataset.moodPhoto;img.alt=button.dataset.moodTitle;
  $('h2',root).textContent=button.dataset.moodTitle;$('.lead',root).textContent=button.dataset.moodCopy;
  $('.actions a',root).href='oferta.html#'+button.dataset.moodTarget;$('.actions a',root).textContent='Dobierz materiały ↗';
  $$('[data-mood-photo]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
}));
