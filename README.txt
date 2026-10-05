MARKIN — WERSJA 6 / CRUSIL I WIDOCZNA LISTA PARTNERÓW
5 października 2026

PARTNERZY
„Partnerzy” to osobna pozycja menu na każdej stronie, także w menu telefonu.
partnerzy.html zawiera wszystkie 12 marek: Crusil, Drogbruk, Libet, Bozza,
Forbet, Drewbet, LedBruk, Poz-Bruk, SLABB, Nicoli, Future Design i COM-BET.
Lista została przeniesiona z dołu O nas; pozostał tam wyraźny odnośnik.
Partnerzy są również podlinkowani w stopkach. Semmelrock i Gatigo wykluczeni.

CRUSIL
- Panele dekoracyjne: ażurowe Aspre i Leste oraz pełne Maestro.
- Płyty ceramiczno-betonowe DuoProCeram: Sabbia Doro, Pietra Antica Black,
  Quartz Pumice.
- 18 zdjęć producenta oraz oficjalne logo Crusil, zapisane lokalnie.
- Opisy i przykłady w istniejących kategoriach oferty: tarasy, ogrodzenia
  i architektura ogrodowa. Linki prowadzą do konkretnych kart katalogu.
- Crusil pojawia się w dolnym rzędzie produktów i górnym pasku.

To wybór redakcyjny oznaczony Wybór Markin. Dodanie partnera nie włącza
automatycznego importu jego całej witryny. Dotychczasowy automat
Drogbruk / POZBRUK / LedBruk pozostaje aktywny i zachowuje kolekcje Crusil.
Źródła zdjęć i opisów: docs/crusil-zrodla-v6.json.

ZACHOWANY UKŁAD
Główny pokaz bez zmian: 7 aranżacji co 4 sekundy. Pod nim 23 inne kolekcje,
bez powtarzania głównych fotografii. Pełny katalog: 30 kolekcji i 61 zdjęć.
Przyciski Zobacz ofertę / Nowości produktowe nadal otwierają osobne strony.
Na głównej nadal 2 sekcje, 6 filtrów i zwykłe karty bez dodatkowych nakładek.

AKTUALIZACJA
1. Rozpakuj MARKIN-zmiany-v6.zip. Paczka pasuje do wersji 4 albo 5.
2. GitHub Desktop → repozytorium MARKIN → Show in Explorer.
3. Wklej zawartość paczki do głównego folderu repozytorium i zastąp pliki.
4. Commit to main, następnie Push origin.
Nie trzeba osobno nakładać poprawki v5. Własne późniejsze zmiany porównaj
przed nadpisaniem. Dla starszej wersji użyj pełnego projektu:
MARKIN-strona-v6-Netlify.zip.

NETLIFY
Wdróż cały projekt przez integrację Git:
  Build command: npm run build
  Publish directory: public
  Functions directory: netlify/functions
  Node.js: 22

Samo wgranie folderu public pokaże stronę i dołączone produkty.
Codzienny import wymaga funkcji partner-news, product-image,
refresh-partner-news. Harmonogram: 05:00 UTC — 07:00 latem, 06:00 zimą
w Polsce. Po wdrożeniu sprawdź Functions → refresh-partner-news → Run now
oraz /api/partner-news: kind=products, schemaVersion=2, mode=cached.
Sprawdź także zdjęcia i kolejny przebieg harmonogramu. Netlify tworzy
magazyn markin-partner-products-v2 automatycznie. Nie są potrzebne klucze AI.

Nie publikowano tej paczki, nie zmieniano domeny ani kont GitHub/Netlify.
Testy lokalne nie są potwierdzeniem uruchomienia automatu na Twoim koncie.

EDYCJA I PODGLĄD
Treści i układ: build.mjs.
Wybór kolekcji: data/curated-products.json.
Kolejność scen: data/campaign.json.
Główny motyw, łączenie kolekcji i pasek: public/catalog.js.
Interakcje i zapisywanie: public/product-experience.js.
Wygląd krótkiej głównej: public/compact.css (uzupełnia pozostałe style).
Automatyczne źródła: netlify/lib/product-sources.mjs oraz product-core.mjs.
Źródła nowych aranżacji: docs/produkty-zrodla-v4.json.

Po edycji uruchom npm run build. Do lokalnego podglądu użyj serwera HTTP,
np. npx http-server public. Otwieranie pliku bezpośrednio z dysku może
blokować moduły JavaScript. Sprawdzenie: npm ci, npm test,
node scripts/verify-local.mjs. Kontrola żywych źródeł: npm run news:verify.

KONTAKT I WYCENA
Przygotowanie wiadomości nie wysyła jej automatycznie — klient otwiera
ją we własnej poczcie. „Moje inspiracje” jest listą wyboru, nie zamówieniem.
Cena, dostępność i transport są potwierdzane indywidualnie.
Kontakt: Radlin 193C, 26-008 Górno; 577 730 739; biuro@markin.pl.
