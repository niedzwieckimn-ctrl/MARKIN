import { load } from 'cheerio/slim';
import { canonicalUrl, plainText } from './news-core.mjs';

export function productUrl(input, source) {
  const u=canonicalUrl(input,source);
  return u && (!source.path || source.path.test(new URL(u).pathname)) ? u : null;
}
export function imageUrl(input, base, source) {
  if(typeof input!=='string'||!input.trim())return null;
  try{return canonicalUrl(new URL(input,base).href,{...source,hosts:[...source.hosts,...(source.imageHosts||[])]});}catch{return null;}
}
const photo=(img)=>img?.attr('data-full-size-image-url')||img?.attr('data-src')||img?.attr('src');
export function collectionUrls(body,source){
  const $=load(body),urls=new Set();$('a[href]').each((_,e)=>{const url=canonicalUrl($(e).attr('href'),source);if(url&&source.collectionPath.test(new URL(url).pathname))urls.add(url);});
  if(!urls.size)throw Error('SOURCE_STRUCTURE_CHANGED');return [...urls].slice(0,10);
}

// Listing markup and sitemap lastmod can change without a product launch. Never infer publication dates here.
export function discover(body, source, page=source.page) {
  const found=new Map();
  if(source.mode==='sitemap'){
    const $=load(body,{xmlMode:true});if(!$('urlset > url').length)throw Error('SOURCE_STRUCTURE_CHANGED');
    $('urlset > url > loc').each((i,e)=>{const url=productUrl($(e).text(),source);if(url)found.set(url,{url});});
  }else{
    const $=load(body);const rows=$(source.row);
    if(!rows.length)throw Error('SOURCE_STRUCTURE_CHANGED');
    rows.each((i,e)=>{const row=$(e),a=row.is('a')?row:row.find(source.link||'a[href]').first();
      const url=productUrl(a.attr('href'),source);if(!url)return;
      const title=plainText((source.title?row.find(source.title).first().text():a.text()) || a.attr('title') || a.find('img').first().attr('alt'),96);
      const context=plainText(row.text(),450)+' '+title+' '+new URL(url).pathname;
      if(source.match&&!source.match.test(context))return;
      let imageSource=source.image?imageUrl(photo(row.find(source.image).first()),page,source):null;
      if(imageSource&&!/\.(?:webp|jpe?g|png)(?:\?|$)/i.test(imageSource))imageSource=null;
      const explicit=/\bNOWO[SŚ][CĆ](?:!|\s|$)/i.test((source.explicitSelector?row.find(source.explicitSelector).first().text():row.text()).trim());
      const spec=source.id==='tarrace'?plainText(row.find('.trc-card-text p').first().text(),100):'';
      if(!found.has(url)||imageSource)found.set(url,{url,title,imageSource,explicit,spec});
    });
  }
  if(found.size>2000)throw Error('SOURCE_TOO_BROAD');
  return [...found.values()];
}

export function productDetail(body, item, source) {
  const $=load(body);const h1=plainText($('h1').first().text(),96);
  const canonical=$('link[rel=canonical]').attr('href');
  if(canonical && !productUrl(new URL(canonical,item.url).href,source))throw Error('INVALID_PRODUCT_DETAIL');
  const imageSource=[$('meta[property="og:image"]').attr('content'),photo($(source.detailImage||'main article img').first())]
    .map(x=>imageUrl(x,item.url,source)).find(x=>x&&!/logo|favicon|placeholder/i.test(new URL(x).pathname));
  if(!h1||!imageSource)throw Error('NO_PRODUCT_PHOTO');
  return {...item,title:h1,imageSource};
}
