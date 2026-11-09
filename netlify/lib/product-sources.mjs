// Explicit product endpoints. Product images may use a separately approved official CDN.
const entry=(id,name,page,hosts,rest={})=>({id,name,page,hosts,limit:4,category:'Tarasy',...rest});
export const SOURCES=[
  entry('drogbruk','Drogbruk','https://www.drogbruk.pl/',['www.drogbruk.pl','drogbruk.pl'],{category:'Nawierzchnie',mode:'explicit',path:/^\/produkt\/[^/]/}),
  entry('ledbruk','LedBruk','https://ledbruk.com/nowosci/',['ledbruk.com','www.ledbruk.com'],{category:'Światło',mode:'explicit',path:/^\/(?:produkty\/[^/]|ledbruk-line-alu\/)/}),
  entry('kostkapater','Pater','https://kostkapater.pl/produkty/architektura-ogrodowa/',['kostkapater.pl','www.kostkapater.pl'],{category:'Nawierzchnie',row:'.products a.product[href]',title:'h3',image:'.image img',path:/^\/produkty\/architektura-ogrodowa\/[a-z0-9-]+\/$/}),
  entry('tarrace','TARRACE','https://tarrace.pl/produkty/',['tarrace.pl'],{row:'article.trc-card',link:'a[href]',title:'h2,h3',explicitSelector:'.trc-badge',path:/^\/produkty\/[^/]+\/$/,image:'img'}),
  entry('renoplast','Renoplast','https://renoplast.pl/wsporniki-tarasowe',['renoplast.pl','www.renoplast.pl'],{category:'Systemy tarasowe',row:'a[href*="/produkt/wspornik"]',path:/^\/produkt\/wspornik[-a-z0-9]+\/?$/}),
  entry('nanobauer','Nanobauer','https://b2b.nanobauer.com/11-nanobauer',['b2b.nanobauer.com'],{category:'Pielęgnacja',row:'article.product-miniature',link:'.product-title a',title:'.product-title',image:'a.product-thumbnail img',path:/^\/nanobauer\/\d+[^/]+\.html$/,match:/paving|concrete|gress|sandstone|pebble|rock|joint|white stain|multicolor|rust cleaner/i}),
  entry('semmelrock','Semmelrock','https://www.wienerberger.pl/sitemap.xml/sitemap1.xml',['www.wienerberger.pl'],{mode:'sitemap',path:/^\/produkty\/[^/]*semmelrock\/(?:plyty-tarasowe|kostki-i-plyty-brukowe)\/[^/]+\.html$/}),
  entry('tubadzin','Tubądzin','https://www.tubadzin.pl/sitemap-products_pl.xml',['www.tubadzin.pl'],{mode:'sitemap',timeoutMs:9000,extraPages:['https://www.tubadzin.pl/sitemap-products_pl.xml?p=2'],imageHosts:['apiprod7ga8u.tubadzin.pl'],path:/^\/produkt\/[^/]*(?:korater|tarasow)[^/]*$/i}),
  entry('libet','Libet','https://libet.pl/produkt-kategoria/gres-porcelanowy/',['libet.pl','www.libet.pl'],{row:'h3.product__title a[href]',path:/^\/produkty\/[^/]+\/$/}),
  entry('crusil','Crusil','https://crusil.pl/',['crusil.pl','www.crusil.pl'],{row:'a[href*="/kolekcje/"]',path:/^\/kolekcje\/[^/]+\/$/,detailImage:'.swiper-slide img.swiper-slide-image, a.uael-grid-gallery-img img',category:'Panele i płyty'}),
  entry('newform','New Form','https://goliatgres.pl/pl/goliat/',['goliatgres.pl'],{extraPages:['https://goliatgres.pl/pl/patio/'],row:'a.product-list-image-wrapper',image:'img',path:/^\/pl\/(?:\d+\/(?:[^/?#]+\/?)?|[a-z0-9-]+\/[^/?#]+\/?)$/i}),
  entry('progres','PRO-GRES','https://twojaplytka.pl/index.php/sklep/?orderby=date',['twojaplytka.pl'],{row:'.image-fade_in_back a[href*="/produkt/"]',image:'img',match:/taras|outdoor|terrace|\b20\s?mm\b|\b2\s?cm\b|slipstop[-\s]+amalfi/i,path:/^\/index\.php\/produkt\/[^/]+\/$/,allowEmpty:true}),
  entry('verde','Verde Ceramika','https://verdeceramika.pl/nowosci.html',['verdeceramika.pl'],{row:'[id="productBoxWrapper"]',link:'h2 a',title:'h2',image:'.photo img',match:/taras|outdoor|\b2[.,-]0\b|\b20\s?mm\b|\b2\s?cm\b/i,path:/^\/\d+,[^/]+\.html$/,allowEmpty:true}),
  entry('cersanit','Cersanit','https://www.cersanit.com.pl/plytki-ceramiczne/pomieszczenia-tarasbalkon',['www.cersanit.com.pl','cersanit.com.pl'],{mode:'collections',collectionPath:/^\/plytki-ceramiczne\/[^/]*(?:2[_-]0|taras)[^/]*(?:,|%2c)\d+\.html$/i,row:'a[href*="/plytki/"]',match:/2[., _-]0|20\s?mm|2\s?cm/i,path:/^\/plytki\/[^/]+(?:,|%2c)\d+\.html$/i}),
  entry('drewbet','Drewbet','https://ogrodzenia.drewbet.pl/',['ogrodzenia.drewbet.pl'],{row:'a[href*="oferta"]',path:/^\/oferta\d+\.html$/,category:'Ogrodzenia',detailImage:'img[src*="img/oferta/"]'}),
  entry('slabb','SLABB','https://slabb.eu/',['slabb.eu'],{row:'.w-item__img a[href]',path:/^\/(?:bloczki-|plyty-|donice)[a-z0-9-]*\/$/,category:'Architektura ogrodowa'}),
  entry('forbet','Forbet','https://forbet.pl/produkty/',['forbet.pl','www.forbet.pl'],{row:'a[href*="/products/"]',path:/^\/products\/[^/]+\/$/,category:'Nawierzchnie'}),
];
export const SOURCE_POLICY_VERSION=7;
