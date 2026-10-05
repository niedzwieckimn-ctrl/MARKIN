MARKIN — WERSJA 5 / NAWIGACJA I BRAK POWTÓRZONYCH ZDJĘĆ
5 października 2026

POPRAWKA WZGLĘDEM WERSJI 4
- Główny zielony przycisk „Zobacz ofertę” otwiera oferta.html.
- Drugi przycisk „Nowości produktowe” otwiera nowosci.html.
- Żaden z tych przycisków nie przewija do niższej sekcji głównej.
- Dolny rząd zawiera 17 innych kolekcji: wyklucza wszystkie 7 pozycji
  głównego pokazu oraz zdjęcia o tych samych adresach.
- To samo wykluczenie działa po automatycznej aktualizacji produktów.
- Przywrócono prosty wygląd zdjęć w kartach oraz 6 filtrów na głównej.
  Nie ma nałożonych napisów „Zobacz zdjęcia” na zdjęciach głównej.
- Zdjęcie dolnej karty otwiera właściwy produkt w osobnym katalogu.
- Oferta także otrzymała inne zdjęcia główne tarasu i ogrodzenia.

Główny pokaz nadal przesuwa się co 4 s. Układ, kolory i długość strony
pozostają: główny motyw, poziomy rząd produktów, krótki kontakt.
W całym katalogu zachowano 24 kolekcje i 43 zdjęcia. Galerie i filtr
paneli są dostępne w katalogu produktów, pod menu Nowości.

JAK PODMIENIĆ WERSJĘ 4
1. Rozpakuj MARKIN-poprawka-v5-do-v4.zip.
2. W GitHub Desktop, w repozytorium MARKIN, kliknij Show in Explorer.
3. Wklej zawartość rozpakowanego ZIP-a do głównego folderu repozytorium,
   zastępując pliki o tych samych nazwach. Niczego nie usuwaj.
4. Commit to main (opis: Poprawka przycisków i powtarzanych zdjęć), Push origin.

Ta mała poprawka wymaga kompletu plików wersji 4. Jeśli masz starszy
projekt, użyj pełnej paczki MARKIN-strona-v5-Netlify.zip.
Nie nadpisuj bez sprawdzenia własnych zmian dokonanych po wersji 4.

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
