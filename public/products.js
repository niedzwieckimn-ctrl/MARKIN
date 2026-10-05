export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hosts = new Set(['www.drogbruk.pl','drogbruk.pl','pozbruk.pl','www.pozbruk.pl','ledbruk.com','www.ledbruk.com','libet.pl','www.libet.pl','slabb.pl','slabb.eu','bozza.pl','ogrodzenia.drewbet.pl','crusil.pl','www.crusil.pl']);
export const safeImage = image => typeof image==='string' && /^(?:assets\/products\/[a-f0-9]+\.(?:webp|jpg|png)|\/api\/product-image\?id=[a-f0-9]{64})$/.test(image);
export const galleryOf = p => [...new Map([{image:p.image},...(Array.isArray(p.gallery)?p.gallery:[])].filter(i=>i&&safeImage(i.image)).map(i=>[i.image,i])).values()].slice(0,20);
export function safeProduct(p) {
  try {
    const url = new URL(p.url);
    return p && typeof p.id === 'string' && typeof p.title === 'string' && p.title.trim().length >= 2 && p.title.length <= 96
      && typeof p.partner === 'string' && !/gatigo|sem[me]+lrock/i.test(p.title + p.partner + p.url)
      && url.protocol === 'https:' && hosts.has(url.hostname) && !url.username && !url.password && !url.port
      && safeImage(p.image);
  } catch { return false; }
}
const quoteURL = p => 'kontakt.html?temat=' + encodeURIComponent(p.partner + ' — ' + p.title);
export function productCard(p, {home=false}={}) {
  const photo=`<img src="${esc(p.image)}" alt="${esc(p.title)} — materiał ze strony ${esc(p.partner)}" width="800" height="540" loading="lazy"><span class="product-badge">${esc(p.badge)}</span>`;
  return `<article class="news-card product-card" id="produkt-${esc(p.id)}" data-id="${esc(p.id)}" data-kind="${p.kind==='selection'?'selection':'new'}" data-partner="${esc(p.partner)}" data-category="${esc(p.category)}" data-panel="${p.panel===true}">
    ${home?`<a class="product-card-photo" href="nowosci.html#produkt-${esc(p.id)}" aria-label="Poznaj produkt: ${esc(p.title)}">${photo}</a>`:`<button class="product-card-photo" type="button" data-product-gallery="${esc(p.id)}" aria-label="Zobacz zdjęcia: ${esc(p.title)}">${photo}<span class="gallery-hint">Zobacz zdjęcia · ${galleryOf(p).length} ↗</span></button>`}
    <div class="product-card-body"><span class="eyebrow">${esc(p.partner)} / ${esc(p.category)}</span><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>
    <div class="product-card-actions"><a class="text-link" href="${esc(quoteURL(p))}">Zapytaj o cenę</a><button class="save-product" type="button" data-save="${esc(p.id)}" aria-label="Dodaj ${esc(p.title)} do inspiracji" aria-pressed="false">♡ Zapisz</button></div>
    <a class="product-source" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Szczegóły u partnera ↗</a></div></article>`;
}
export function productSlide(p, i, total) {
  return `<article class="product-slide" data-id="${esc(p.id)}" role="group" aria-roledescription="slajd" aria-label="${i+1} z ${total}: ${esc(p.title)}" ${i ? 'inert aria-hidden="true"' : ''}>
    <div class="product-slide-copy"><div class="product-kicker"><span class="product-badge">${esc(p.badge)}</span><span>${esc(p.partner)}</span></div><h2>${esc(p.title)}</h2><p>${esc(p.description)}</p>
    <div class="actions"><a class="btn btn-lime" href="${esc(quoteURL(p))}">Chcę taki efekt ↗</a><button class="btn btn-outline save-product" type="button" data-save="${esc(p.id)}" aria-label="Dodaj ${esc(p.title)} do inspiracji" aria-pressed="false">♡ Zapisz</button></div>
    <a class="product-source" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Poznaj produkt u ${esc(p.partner)} ↗</a></div>
    <div class="product-slide-photo"><img src="${esc(p.image)}" alt="${esc(p.title)} — inspiracja producenta ${esc(p.partner)}" width="1200" height="800" ${i === 0 ? 'fetchpriority="high"' : 'loading="eager"'}><span class="image-credit">${esc(p.partner)} / ${esc(p.category)}</span></div></article>`;
}
export function productShowcase(entries, home = false) {
  return `<section class="product-showcase" aria-roledescription="karuzela" aria-label="Nowości produktowe partnerów" data-showcase><div class="wrap">
    <div class="showcase-heading"><div><span class="eyebrow"><span class="live-dot"></span> Nowości produktowe / wybór Markin</span><${home?'h1':'h2'}>Twój dom. <em>Nowe możliwości.</em></${home?'h1':'h2'}></div><a class="text-link" href="nowosci.html">Odkryj wszystkie produkty ↗</a></div>
    <div class="product-viewport" tabindex="0" aria-label="Zdjęcia produktów. Użyj strzałek, aby zmienić produkt."><div class="product-track">${entries.map((p,i)=>productSlide(p,i,entries.length)).join('')}</div></div>
    <div class="product-controls"><div class="product-dots" aria-label="Wybierz produkt">${entries.map((p,i)=>`<button type="button" data-slide="${i}" aria-label="Pokaż ${esc(p.title)}" aria-current="${i===0}"><span></span></button>`).join('')}</div><span class="product-counter">01 / ${String(entries.length).padStart(2,'0')}</span><div class="product-arrows"><button type="button" data-product-prev aria-label="Poprzedni produkt">←</button><button type="button" data-product-pause aria-label="Wstrzymaj pokaz produktów" aria-pressed="false">Ⅱ</button><button type="button" data-product-next aria-label="Następny produkt">→</button></div></div>
  </div></section>`;
}

export function startCarousel(root) {
  const track = root.querySelector('.product-track'), viewport = root.querySelector('.product-viewport');
  const slides = [...track.children], n = slides.length;
  if (!n) return () => {};
  const clone = slides[0].cloneNode(true); clone.setAttribute('inert',''); clone.setAttribute('aria-hidden','true'); clone.dataset.clone='true'; track.append(clone);
  const dots = [...root.querySelectorAll('[data-slide]')], pause = root.querySelector('[data-product-pause]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, visualIndex = 0, timer, endTimer, stopped = motion.matches, hover = false, focused = false, visible = true, moving = false;
  const abort = new AbortController(), on = (el,event,fn) => el.addEventListener(event,fn,{signal:abort.signal});
  const canPlay = () => !stopped && !hover && !focused && visible && !document.hidden && n > 1;
  function schedule() {
    clearTimeout(timer);
    root.classList.toggle('is-playing',canPlay());
    if (canPlay()) timer=setTimeout(()=>go(index+1),4000);
  }
  function settle() {
    clearTimeout(endTimer); moving=false;
    if (visualIndex === n) {
      track.style.transition='none'; visualIndex=0; track.style.transform='translateX(0%)';
      void track.offsetWidth; track.style.transition='';
    }
  }
  function go(target) {
    if (moving) settle();
    const looping=target===n;
    index=(target+n)%n; visualIndex=looping&&!motion.matches?n:index;
    track.style.transform=`translateX(-${visualIndex*100}%)`;
    root.dataset.active=String(index);
    slides.forEach((slide,i)=>{slide.inert=i!==index;slide.setAttribute('aria-hidden',String(i!==index));});
    // The clone is only visual; the real first slide becomes interactive after reset.
    if(looping&&visualIndex===n) slides[0].inert=true;
    dots.forEach((dot,i)=>{dot.setAttribute('aria-current',String(i===index));const bar=dot.firstElementChild;bar.style.animation='none';void bar.offsetWidth;bar.style.animation='';});
    root.querySelector('.product-counter').textContent=`${String(index+1).padStart(2,'0')} / ${String(n).padStart(2,'0')}`;
    moving=!motion.matches; endTimer=setTimeout(()=>{settle();slides[index].inert=false;},650);
    schedule();
  }
  function setPause(value) { stopped=value;pause.setAttribute('aria-pressed',String(value));pause.setAttribute('aria-label',value?'Wznów pokaz produktów':'Wstrzymaj pokaz produktów');pause.textContent=value?'▶':'Ⅱ';schedule(); }
  on(pause,'click',()=>setPause(!stopped));
  on(root.querySelector('[data-product-next]'),'click',()=>go(index+1));
  on(root.querySelector('[data-product-prev]'),'click',()=>go(index-1));
  dots.forEach(dot=>on(dot,'click',()=>go(Number(dot.dataset.slide))));
  on(viewport,'keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(index+(e.key==='ArrowRight'?1:-1));}});
  on(root,'pointerenter',e=>{if(e.pointerType==='mouse'){hover=true;schedule();}});
  on(root,'pointerleave',()=>{hover=false;schedule();});
  on(root,'focusin',()=>{focused=true;schedule();});
  on(root,'focusout',()=>{queueMicrotask(()=>{focused=root.contains(document.activeElement);schedule();});});
  let touchX=null;
  on(viewport,'touchstart',e=>{touchX=e.touches[0].clientX;});
  on(viewport,'touchend',e=>{if(touchX!==null){const delta=e.changedTouches[0].clientX-touchX;if(Math.abs(delta)>50)go(index+(delta<0?1:-1));touchX=null;}});
  on(document,'visibilitychange',schedule);
  on(motion,'change',()=>setPause(motion.matches));
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.15});observer.observe(root);
  root.dataset.active='0'; setPause(stopped);
  return ()=>{abort.abort();observer.disconnect();clearTimeout(timer);clearTimeout(endTimer);clone.remove();};
}
