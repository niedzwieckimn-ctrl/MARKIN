MARKIN — WERSJA 4 / WIĘCEJ TARASÓW, PANELI I ARANŻACJI
5 października 2026

Układ wersji 3 pozostaje: pasek nad menu, główny pokaz aranżacji,
poziomy rząd produktów i krótka stopka. Nie dodano sekcji wydłużających główną.

24 produkty i kolekcje (wcześniej 12), w tym 13 propozycji tarasowych,
6 ogrodzeń (3 propozycje paneli/przęseł), 3 oświetlenia i 2 nawierzchni.
43 różne zdjęcia produktowe i aranżacyjne zamiast 12. Dodatkowo zachowana
galeria 32 zdjęć historycznych Markin oraz pozostałe oryginalne materiały.
7 scen w głównym pokazie, zmiana co 4 sekundy od prawej do lewej.

Nowe materiały: Libet Elysian Travertini, Nau, Oudh, Dijon, Kao, Glocal,
Motley, Elysian; płyty tarasowe SLABB, aluminiowe przęsła NIVE prezentowane
przez SLABB; betonowe panele Drewbet Deska i Graf. Piękne aranżacje tarasu
i ogrodzenia zastępują też dotychczasowe zdjęcia główne w zakładce Oferta.

Kliknij zdjęcie produktu, aby otworzyć jego galerię. Zdjęcia, strzałki,
klawisze lewo/prawo i Escape działają w oknie powiększenia. Źródło kolekcji
jest podane przy zdjęciu. Filtr „Panele i przęsła” pokazuje odpowiednie
systemy, bez zaliczania pustaków ogrodzeniowych do paneli.

4 pozycje pochodzą z sekcji nowości producentów, 20 to „Wybór Markin”.
Obecność w aktualnej ofercie producenta nie oznacza premiery w 2026 roku.
Nie dodano wymyślonych premier, bestsellerów ani dat zdjęć. Wzory Drewbet
Deska/Graf opisane na źródle jako Nowość 2022 nie są oznaczone u nas Nowość.
Automatyczny import Drogbruk/POZBRUK/LedBruk działa jak w wersji 3.
Zdjęcia galerii i pozostałe kolekcje są wyborem redakcyjnym; automat
zachowuje je podczas odświeżania. Semmelrock i Gatigo nadal są wykluczeni.

Przegląd zdań na wszystkich 10 podstronach nie znalazł identycznych
powtórzeń zdań opisowych. Zredagowano podobne znaczeniowo fragmenty
na stronach O nas i Projektowanie. Etykiety przycisków i nawigacja mogą
się powtarzać celowo; drugi zestaw paska służy jego płynnej pętli.

AKTUALIZACJA REPOZYTORIUM — GITHUB DESKTOP
1. Rozpakuj MARKIN-zmiany-v4.zip poleceniem „Wyodrębnij wszystkie”.
2. W GitHub Desktop wybierz repozytorium MARKIN i „Show in Explorer”.
3. Skopiuj zawartość rozpakowanej paczki do otwartego folderu repozytorium.
   Zastąp pliki o tych samych nazwach. build.mjs, package.json i
   netlify.toml mają pozostać bezpośrednio w katalogu głównym.
4. W GitHub Desktop: Summary „Nowe aranżacje, tarasy i panele v4”,
   następnie Commit to main i Push origin.
5. Jeśli repozytorium jest połączone z Netlify, poczekaj na nowe wdrożenie.

Paczka zmian obejmuje łącznie poprawki v2, v3 i v4 względem pierwszego ZIP-a
MARKIN-nowoczesna-strona-Netlify.zip. Można nałożyć ją na przekazaną
wersję 1, wersję 2 albo wersję 3. Nie wymaga usuwania plików. Jeżeli samodzielnie
edytowałeś pliki po otrzymaniu paczki, zachowaj własne zmiany i sprawdź
różnice przed zastąpieniem. Pełny projekt: MARKIN-strona-v4-Netlify.zip.

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
