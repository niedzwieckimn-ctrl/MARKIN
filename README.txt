MARKIN — WERSJA 2 / NOWOŚCI PRODUKTOWE ZE ZDJĘCIAMI
5 października 2026

CO ZMIENIONO
- Duża karuzela na początku strony: rzeczywiste zdjęcia produktów, nazwa,
  producent, opis i przejście do zapytania. Kolejny slajd co 4000 ms,
  przesunięcie od prawej do lewej, także przy powrocie do pierwszego slajdu.
- Strzałki, pauza, wybór slajdu, klawiatura i gest na telefonie. Pokaz
  zatrzymuje się przy najechaniu, fokusie, po ukryciu karty i poza ekranem.
  Preferencja ograniczenia ruchu w systemie wyłącza automatyczny start.
- Zdjęcia produktów i przyciski „Zapytaj o cenę” na stronie Nowości.
- „Moje inspiracje”: zapis produktów w tej przeglądarce, usuwanie z listy
  oraz zapytanie o wycenę całego wybranego zestawu.
- Przełączanie inspiracji: po zmroku, na tarasie, przed domem.
- Usunięto Semmelrock i Gatigo z prezentowanych partnerów, opisów oferty,
  przykładów produktów, aktywnych linków i automatycznych źródeł.
- Zachowano oryginalne materiały Markin, kontakt, 32 zdjęcia realizacji,
  poradnik i pozostałe podstrony.

AKTUALIZACJA ISTNIEJĄCEGO REPOZYTORIUM MARKIN
1. Pobierz MARKIN-zmiany-v2.zip i wybierz w Windows „Wyodrębnij wszystkie”.
2. W GitHub Desktop, w repozytorium MARKIN, kliknij „Show in Explorer”.
3. Skopiuj ZAWARTOŚĆ rozpakowanej paczki do otwartego folderu repozytorium.
   Zastąp pliki o tych samych nazwach. Plik build.mjs ma leżeć bezpośrednio
   obok package.json i netlify.toml. Nie wkładaj całej paczki w podfolder.
4. W GitHub Desktop wpisz Summary: „Nowości produktowe i inspiracje v2”.
   Kliknij „Commit to main”, następnie „Push origin”.
5. Jeśli repozytorium jest już podłączone do Netlify, rozpocznie się nowe
   wdrożenie. Sprawdź ukończony deploy i odśwież stronę.

Paczka zmian została przygotowana względem ZIP-a
MARKIN-nowoczesna-strona-Netlify.zip z tego czatu (wersja 1).
Nie usuwa żadnych plików. Jeśli po wersji 1 zmieniałeś samodzielnie pliki
strony, przed zastąpieniem zachowaj ich kopię i sprawdź różnice w GitHub Desktop.
Pełny projekt jest także w MARKIN-strona-v2-Netlify.zip.

PIERWSZE WDROŻENIE PEŁNEGO PROJEKTU
Rozpakuj MARKIN-strona-v2-Netlify.zip. Dodaj jego zawartość do repozytorium
i podłącz repozytorium do Netlify. Ustawienia są w netlify.toml:
  Build command: npm run build
  Publish directory: public
  Functions directory: netlify/functions
  Node.js: 22

AUTOMATYCZNE NOWOŚCI PRODUKTOWE
Aktualne źródła: Drogbruk (produktowe premiery na stronie głównej),
POZBRUK (sekcja Nowości), LedBruk (nowości produktowe).
Pierwsza paczka ma 4 sprawdzone produkty ze zdjęciami producentów.
Importer nie zbiera ogólnych newsów, poradników ani wpisów promocyjnych.
Inne marki pozostają w zwykłej ofercie, bez podłączonego importera nowości.

Automat sprawdza źródła codziennie o 05:00 UTC, czyli 07:00 latem
i 06:00 zimą w Polsce, na opublikowanej wersji produkcyjnej Netlify.
Zdjęcia pobiera na serwer strony. Odwiedzający nie łączy się bezpośrednio
z serwerami partnerów przy oglądaniu zdjęć. W razie awarii pozostaje
ostatni poprawny zestaw. Zmiana budowy strony producenta może wymagać
aktualizacji importera. Etykieta „nowość” jest oznaczeniem producenta,
nie twierdzeniem, że produkt miał premierę w dniu pobrania.

Po wdrożeniu sprawdź obecność 3 funkcji:
  partner-news, product-image, refresh-partner-news
Uruchom w Netlify funkcję refresh-partner-news przez „Run now”.
W /api/partner-news sprawdź schemaVersion: 2, kind: "products",
mode: "cached" i sources[].status. Otwórz zdjęcia po tym odświeżeniu.
Netlify Blobs tworzy magazyn markin-partner-products-v2 automatycznie.
Nie trzeba dostarczać haseł, kluczy AI ani własnego tokenu Blobs.

Wgranie samego folderu public daje stronę z dołączonym zestawem zdjęć,
ale bez codziennego importowania. Automat wymaga wdrożenia całego projektu
z funkcjami, np. przez integrację repozytorium Git z Netlify.
Nie publikowano tej paczki ani nie zmieniano domeny. Harmonogram i zapis
Blobs na Twoim koncie wymagają sprawdzenia po własnym wdrożeniu.

LOKALNY PODGLĄD I EDYCJA
Do interaktywnego podglądu użyj serwera HTTP; moduły JavaScript mogą być
blokowane przy otwieraniu pliku index.html bezpośrednio z dysku.
Przykład w folderze projektu: npx http-server public
Bez Netlify karuzela użyje dołączonego zestawienia produktów.

  npm ci
  npm run build
  npm test
  npm run news:verify

news:verify sprawdza prawdziwe źródła bez zmiany zestawienia w plikach.
news:snapshot pobiera i zapisuje nowy zestaw; potem wykonaj npm run build.
Treści i układ: build.mjs oraz data/content.json.
Karuzela i karty: public/products.js, public/product-experience.js.
Wygląd: public/styles.css i public/products.css.
Źródła: netlify/lib/product-sources.mjs i product-core.mjs.
Zdjęcia nowości: public/assets/products.
Źródła konkretnych zdjęć: docs/produkty-zrodla-v2.json.
Materiały badania wersji 1 w docs są archiwum, nie konfiguracją importera.

ZAPYTANIA I ZAKUP
Strona prowadzi do kontaktu i indywidualnej wyceny. „Przygotuj wiadomość”
tworzy zapytanie do wysłania we własnym programie pocztowym. Lista inspiracji
nie jest zamówieniem ani rezerwacją. Cena, dostępność i transport wymagają
ustalenia dla konkretnego produktu. Nie dodano fikcyjnych stanów, rabatów
ani sztucznego odliczania czasu do zakupu.

Kontakt: Radlin 193C, 26-008 Górno; 577 730 739; biuro@markin.pl.
Oryginalny dokument OWS i materiały archiwalne zachowano bez zmieniania
treści historycznych. Domena docelowa w metadanych: markin.pl.
