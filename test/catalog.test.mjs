import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { prepareCatalog, tickerItems, campaign } from '../public/catalog.js';
import { galleryOf, productCard } from '../public/products.js';
import { SEED } from '../netlify/lib/news-seed.mjs';
const curated=JSON.parse(await fs.readFile(new URL('../data/curated-products.json',import.meta.url),'utf8'));
test('curated collections stay distinct from source-confirmed novelties',()=>{
 const list=prepareCatalog(SEED.entries,curated);
 assert.equal(list.length,24);assert.equal(list.filter(p=>p.kind==='new').length,4);assert.equal(list.filter(p=>p.kind==='selection').length,20);
 assert.ok(list.filter(p=>p.kind==='selection').every(p=>p.badge==='Wybór Markin'));
 assert.equal(new Set(list.map(p=>p.id)).size,list.length);
 assert.deepEqual([...new Set(list.map(p=>p.category))].sort(),['Tarasy','Ogrodzenia','Światło','Kostka'].sort());
});
test('automatic refresh preserves all curated choices and deduplicates identifiers',()=>{
 const fresh={...SEED.entries[0],id:'12345678901234567890',title:'Nowy model producenta'};
 const list=prepareCatalog([fresh,fresh],curated);
 assert.equal(list.length,21);assert.equal(list.filter(p=>p.kind==='new').length,1);assert.equal(list.filter(p=>p.kind==='selection').length,20);
 assert.equal(prepareCatalog([],curated).length,20);
});
test('ticker links into the local catalogue and has a hidden duplicate for its loop',()=>{
 const text=tickerItems(prepareCatalog(SEED.entries,curated));assert.ok(text.includes('nowosci.html#produkt-'));assert.ok(text.includes('aria-hidden="true" inert'));assert.ok(!text.includes('href="https:'));
});
test('campaign has one main headline and credits the actual arrangement source',()=>{
 const text=campaign(curated.slice(0,4));assert.equal((text.match(/<h1>/g)||[]).length,1);assert.equal((text.match(/class="scene-photo"/g)||[]).length,4);assert.ok(text.includes('Aranżacja partnera / Libet'));assert.ok(!text.includes('Nowości produktowe / wybór Markin'));
});

test('collection galleries keep only local safe images and remove repeats',()=>{const image='assets/products/abcdef.webp';assert.deepEqual(galleryOf({image,gallery:[{image},{image:'https://untrusted.example/test.jpg'},{image:'javascript:alert(1)'},{image:'assets/products/ab1234.webp'}]}).map(x=>x.image),[image,'assets/products/ab1234.webp']);});
test('panels and spans are identified separately from masonry blocks',()=>{assert.equal(curated.filter(p=>p.panel).length,3);assert.ok(curated.filter(p=>p.panel).every(p=>/Panele|przęsła/.test(p.title)));const block=curated.find(p=>p.title.includes('Bloczki'));assert.ok(productCard(block).includes('data-panel="false"'));assert.ok(productCard(curated.find(p=>p.panel)).includes('data-panel="true"'));});
