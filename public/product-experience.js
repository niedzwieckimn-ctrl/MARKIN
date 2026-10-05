import { productCard, safeProduct, startCarousel, esc, galleryOf } from './products.js';
import { prepareCatalog, tickerItems } from './catalog.js';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
function readData(id){try{return JSON.parse($(id)?.textContent||'[]').filter(safeProduct);}catch{return [];}}
const seed=readData('#product-data'),curated=readData('#curated-data');
let entries=prepareCatalog(seed,curated),signature=JSON.stringify(seed),selected='Wszystkie',page=0,saved=new Set();
const storageKey='markin-inspirations-v2';
document.addEventListener('click',e=>{const b=e.target.closest('[data-product-gallery]');if(!b)return;const p=entries.find(p=>p.id===b.dataset.productGallery);if(!p)return;document.dispatchEvent(new CustomEvent('markin:gallery',{detail:{photos:galleryOf(p).map(i=>({src:i.image,caption:p.partner+' · '+p.title,url:p.url})),opener:b}}));});
try{const data=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(data))saved=new Set(data.filter(x=>typeof x==='string'&&/^[a-f0-9]{20}$/.test(x)).slice(0,30));}catch{}
const drawer=$('.inspiration-dialog'),open=$('.inspiration-open');let drawerOpener;
function updateSaved(){
 $$('[data-save]').forEach(button=>{const yes=saved.has(button.dataset.save);button.setAttribute('aria-pressed',String(yes));button.textContent=yes?'♥ Zapisano':'♡ Zapisz';button.setAttribute('aria-label',(yes?'Usuń z inspiracji: ':'Dodaj do inspiracji: ')+(entries.find(p=>p.id===button.dataset.save)?.title||'produkt'));});
 const list=entries.filter(p=>saved.has(p.id));
 if(open){open.hidden=saved.size===0;$('[data-saved-count]').textContent=list.length;}
 if(drawer){$('[data-saved-list]').innerHTML=list.length?list.map(p=>`<article class="saved-item"><img src="${esc(p.image)}" alt="${esc(p.title)}" width="180" height="120"><div><span class="eyebrow">${esc(p.partner)}</span><h3>${esc(p.title)}</h3><button type="button" data-remove="${esc(p.id)}">Usuń z listy</button></div></article>`).join(''):'<p class="empty">Zapisz produkty, które pasują do Twojego pomysłu. Dawna pozycja mogła opuścić aktualny wybór.</p>';
 $('[data-saved-quote]').hidden=!list.length;$('[data-saved-quote]').href='kontakt.html?temat='+encodeURIComponent('Moje inspiracje: '+list.map(p=>p.partner+' '+p.title).join('; '));}
}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify([...saved]));}catch{}updateSaved();}
document.addEventListener('click',e=>{const b=e.target.closest('[data-save],[data-remove]');if(!b)return;const id=b.dataset.save||b.dataset.remove;if(!entries.some(p=>p.id===id))return;if(b.dataset.remove||saved.has(id))saved.delete(id);else saved.add(id);persist();$('.save-status').textContent=saved.has(id)?'Dodano produkt do inspiracji.':'Usunięto produkt z inspiracji.';if(b.dataset.remove)$('[data-inspiration-close]')?.focus();});
open?.addEventListener('click',()=>{drawerOpener=document.activeElement;updateSaved();drawer.showModal();document.body.classList.add('lock');});
$('[data-inspiration-close]')?.addEventListener('click',()=>drawer.close());
drawer?.addEventListener('close',()=>{document.body.classList.remove('lock');drawerOpener?.focus();});
$('[data-saved-clear]')?.addEventListener('click',()=>{saved.clear();persist();});
$$('[data-showcase]').forEach(startCarousel);
const bar=$('.news-bar'),pause=$('.ticker-pause');
pause?.addEventListener('click',()=>{const stopped=bar.classList.toggle('paused');pause.setAttribute('aria-pressed',String(stopped));pause.setAttribute('aria-label',stopped?'Wznów pasek produktów':'Wstrzymaj pasek produktów');pause.textContent=stopped?'▶':'Ⅱ';});
let railReset=()=>{};
function railButtons(){const rail=$('[data-rail]');if(!rail)return;const prev=$('[data-rail-prev]'),next=$('[data-rail-next]');prev.disabled=rail.scrollLeft<2;next.disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-3;}
function moveRail(direction){const rail=$('[data-rail]');if(!rail)return;rail.scrollBy({left:direction*Math.max(rail.clientWidth*.85,260),behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}
$('[data-rail-prev]')?.addEventListener('click',()=>moveRail(-1));$('[data-rail-next]')?.addEventListener('click',()=>moveRail(1));
$('[data-rail]')?.addEventListener('scroll',railButtons,{passive:true});
function filterCatalog(){
 $$('[data-news-grid]').forEach(grid=>{
   const cards=$$('.product-card',grid),matches=cards.filter(c=>selected==='Wszystkie'||(selected==='Nowości'?c.dataset.kind==='new':selected==='Panele i przęsła'?c.dataset.panel==='true':c.dataset.category===selected));
   const size=grid.dataset.pageSize?(innerWidth<=760?2:Number(grid.dataset.pageSize)):Infinity;
   const total=Math.max(1,Math.ceil(matches.length/size));page=Math.min(page,total-1);
   cards.forEach(c=>c.hidden=true);matches.slice(page*size||0,Number.isFinite(size)?(page+1)*size:undefined).forEach(c=>c.hidden=false);
   $('.empty',grid)?.remove();
   if(!matches.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='Brak produktów w tym wyborze. Zobacz pozostałe kategorie.';grid.append(empty);}
   if(grid.hasAttribute('data-rail')){grid.scrollLeft=0;const count=$('[data-product-count]');count.textContent=`${matches.length} produktów w wyborze · przesuń, aby zobaczyć kolejne`;railButtons();railReset();}
   if(grid.dataset.pageSize){$('[data-catalog-page]').textContent=`${page+1} / ${total} · ${matches.length} produktów`;$('[data-catalog-prev]').disabled=page===0;$('[data-catalog-next]').disabled=page>=total-1;}
 });
 $$('[data-category-filter]').forEach(b=>{b.classList.toggle('active',b.dataset.categoryFilter===selected);b.setAttribute('aria-pressed',String(b.dataset.categoryFilter===selected));});
}
$$('[data-category-filter]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.categoryFilter;page=0;filterCatalog();}));
$('[data-catalog-prev]')?.addEventListener('click',()=>{page=Math.max(0,page-1);filterCatalog();$('.catalog-page')?.scrollIntoView({block:'start'});});
$('[data-catalog-next]')?.addEventListener('click',()=>{page++;filterCatalog();$('.catalog-page')?.scrollIntoView({block:'start'});});
function locateProduct(){
 const id=location.hash.match(/^#produkt-([a-f0-9]{20})$/)?.[1],grid=$('.catalog-grid');if(!id||!grid)return;
 const cards=$$('.product-card',grid),index=cards.findIndex(c=>c.dataset.id===id);if(index<0)return;
 selected='Wszystkie';page=Math.floor(index/(innerWidth<=760?2:Number(grid.dataset.pageSize)));filterCatalog();
 const card=cards[index];requestAnimationFrame(()=>{card.scrollIntoView({block:'center'});card.classList.add('product-highlight');setTimeout(()=>card.classList.remove('product-highlight'),2200);});
}
window.addEventListener('hashchange',locateProduct);
let mobile=innerWidth<=760;window.addEventListener('resize',()=>{if(mobile!==(innerWidth<=760)){mobile=!mobile;page=0;filterCatalog();}railButtons();},{passive:true});
function status(payload){const date=new Date(payload.generatedAt);const checked=!isNaN(date)?new Intl.DateTimeFormat('pl-PL',{dateStyle:'long'}).format(date):'';const partial=payload.stale||payload.sources?.some(s=>s.status!=='ok');$$('[data-news-status]').forEach(p=>p.textContent=(checked?'Sprawdzenie źródeł nowości: '+checked+'. ':'')+'Obok nowości pokazujemy osobno oznaczony Wybór Markin.'+(partial?' Część materiałów pochodzi z ostatniego poprawnego odczytu.':''));}
async function renderProducts(payload){
 if(payload.schemaVersion!==2||payload.kind!=='products'||!Array.isArray(payload.entries))return;
 const next=payload.entries.filter(safeProduct).slice(0,12),sig=JSON.stringify(next);if(!next.length)return;status(payload);if(sig===signature)return;
 if(document.activeElement?.closest('[data-news-grid],.inspiration-dialog,.news-bar'))return;
 const ready=await Promise.all(next.map(p=>new Promise(resolve=>{const image=new Image(),timer=setTimeout(()=>resolve(seed.find(s=>s.id===p.id)||null),5000);image.onload=()=>{clearTimeout(timer);resolve(p);};image.onerror=()=>{clearTimeout(timer);resolve(seed.find(s=>s.id===p.id)||null);};image.src=p.image;})));
 const valid=ready.filter(Boolean);if(!valid.length)return;entries=prepareCatalog(valid,curated);signature=sig;
 $$('[data-news-grid]').forEach(grid=>grid.innerHTML=entries.map(productCard).join(''));
 const track=$('#ticker-track');if(track)track.innerHTML=tickerItems(entries);
 filterCatalog();updateSaved();
}
function startRail(){
 const rail=$('[data-rail]'),root=$('.discovery-section'),button=$('[data-rail-pause]');if(!rail||!button)return;
 const motion=matchMedia('(prefers-reduced-motion:reduce)');let stopped=motion.matches,hover=false,focus=false,visible=false,timer;
 function schedule(){clearTimeout(timer);if(stopped||hover||focus||!visible||document.hidden||rail.scrollWidth<=rail.clientWidth+3)return;timer=setTimeout(()=>{
  const item=$('.product-card:not([hidden])',rail);if(!item)return;
  if(rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-3)rail.scrollTo({left:0,behavior:'instant'});
  else rail.scrollBy({left:item.getBoundingClientRect().width+parseFloat(getComputedStyle(rail).columnGap),behavior:'smooth'});
  schedule();
 },4000);}
 function setStopped(value){stopped=value;button.setAttribute('aria-pressed',String(value));button.setAttribute('aria-label',value?'Wznów przewijanie produktów':'Wstrzymaj przewijanie produktów');button.textContent=value?'▶':'Ⅱ';schedule();}
 button.addEventListener('click',()=>setStopped(!stopped));
 root.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hover=true;schedule();}});root.addEventListener('pointerleave',()=>{hover=false;schedule();});
 root.addEventListener('focusin',()=>{focus=true;schedule();});root.addEventListener('focusout',()=>queueMicrotask(()=>{focus=root.contains(document.activeElement);schedule();}));
 rail.addEventListener('touchstart',()=>setStopped(true),{passive:true});
 new IntersectionObserver(items=>{visible=items[0].isIntersecting;schedule();},{threshold:.25}).observe(rail);
 document.addEventListener('visibilitychange',schedule);motion.addEventListener('change',()=>setStopped(motion.matches));railReset=schedule;setStopped(stopped);
}
startRail();filterCatalog();updateSaved();locateProduct();
async function loadProducts(){if(location.protocol==='file:')return;try{const r=await fetch('/api/partner-news',{signal:AbortSignal.timeout(6000),headers:{Accept:'application/json'}});if(r.ok&&r.headers.get('content-type')?.includes('json'))await renderProducts(await r.json());}catch{}}
loadProducts();let lastRefresh=Date.now();document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastRefresh>900000){lastRefresh=Date.now();loadProducts();}});
