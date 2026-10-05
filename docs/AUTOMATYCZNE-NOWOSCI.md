# Nowości produktowe — wersja 2

Frontend używa wyłącznie `schemaVersion: 2`, `kind: "products"`. Stare newsy nie są importowane do karuzeli. Nowy magazyn `markin-partner-products-v2`, klucz `products-v2`, oddziela produktowe dane od poprzednich artykułów.

Źródła są jawnie zapisane w `netlify/lib/product-sources.mjs`:

- [Drogbruk](https://www.drogbruk.pl/) — slajdy produktowe wyraźnie oznaczone jako nowość / nowy kolor, z odnośnikiem do produktu i zdjęciem.
- [POZBRUK](https://pozbruk.pl/otoczenie-domu/) — produkty wyłącznie z sekcji „Nowości”; zdjęcie w pełnym rozmiarze z metadanych karty produktu.
- [LedBruk](https://ledbruk.com/nowosci/) — produktowe sekcje nowości i odnośniki oznaczone „nowość”; bez zapowiedzi „wkrótce”.

Maksymalnie 4 produkty od każdego źródła. Wersja początkowa: 4 produkty, 3 poprawnie odczytane źródła. `publishedAt` pozostaje null, gdy producent nie podaje daty. Data odczytu nie udaje daty premiery. Opisy są autorskie; źródłowe adresy i zdjęcia opisuje `produkty-zrodla-v2.json`.

## Przepływ danych

1. `refresh-partner-news` uruchamia się o 05:00 UTC na aktualnie opublikowanym wdrożeniu produkcyjnym.
2. Strony HTML są ograniczone do 1,5 MB, 8 s na żądanie i 3 przekierowań w ramach listy domen. Nie przyjmujemy adresów URL od odwiedzających.
3. Zdjęcia pobieramy z tych samych dozwolonych domen: maks. 4 MB i 8 s, JPEG/PNG/WebP sprawdzane po nagłówku pliku. Przekierowanie na inny host jest odrzucane.
4. Zdjęcia trafiają do Netlify Blobs pod `images/{sha256-adresu}`. Publiczna funkcja `product-image` przyjmuje wyłącznie hash, nie dowolny URL; obsługuje GET/HEAD. Cache zdjęć: 24 h.
5. JSON zapisuje się dopiero po przygotowaniu zdjęć. Przy błędzie źródła zachowujemy jego poprzednie produkty. Przy błędzie zdjęcia istniejącego produktu zachowujemy poprzedni obraz i raportujemy `partial`. Nowy produkt bez zdjęcia nie trafia do karuzeli.
6. Poprawne odświeżenie zastępuje listę danego producenta; nie gromadzi wszystkich dawnych nowości bez końca. Nieprawidłowa struktura / brak możliwych do zweryfikowania produktów zachowuje wcześniejszy odczyt i daje status błędu.
7. Warunkowy zapis ETag chroni JSON przed nadpisaniem przez wolniejszy równoległy przebieg. Błąd odczytu magazynu przerywa zapis. Podglądy i starsze wdrożenia nie odświeżają produkcji.
8. `partner-news` udostępnia JSON. Jeśli magazyn jest niedostępny, zwraca dołączony zestaw ze zdjęciami lokalnymi. Frontend dodatkowo sprawdza adresy i przygotowuje zdjęcia przed zamianą widoku.

## Interakcje

Karuzela zmienia slajd co 4000 ms; przesunięcie trwa 600 ms. Pętla przechodzi nadal w lewo. Przewijanie pauzuje po najechaniu myszą, fokusie, poza ekranem, po ukryciu karty i po użyciu przycisku pauzy. Preferencja ograniczenia ruchu wyłącza automatyczny start. Są strzałki, wybór slajdu, obsługa klawiatury i gesty dotykowe. Automatyczne zmiany nie są ogłaszane przez live region czytnika ekranu.

„Moje inspiracje” przechowuje wyłącznie identyfikatory produktów w localStorage. Lista służy do przygotowania zapytania o wycenę i ma przycisk czyszczenia. Gdy pamięć jest niedostępna, lista działa w bieżącej karcie.

## Wdrożenie i kontrola

Wdróż cały projekt przez integrację Git z Netlify. Polecenie budowania: `npm run build`; publikacja: `public`; Node 22. Sam statyczny folder nie uruchamia automatu.

Po wdrożeniu sprawdź funkcje `partner-news`, `product-image`, `refresh-partner-news`. Wykonaj „Run now” dla harmonogramu i sprawdź `/api/partner-news`: `mode: "cached"`, `kind: "products"`, `sources[].status`. Otwórz nowe zdjęcie z `/api/product-image?id=...`. Potwierdź kolejny automatyczny przebieg w logach. Testy lokalne nie potwierdzają działania harmonogramu na docelowym koncie.

Zmiana HTML partnera może wymagać poprawienia adaptera. Brak nowego produktu u producenta nie jest zobowiązaniem do publikacji nowej pozycji. Pozostali partnerzy Markin nie mają jeszcze własnych adapterów w tym module.

Lokalnie: `npm test`, `npm run news:verify`. `npm run news:snapshot` zapisuje nowy zestaw i zdjęcia; po nim uruchom `npm run build`.

Dokumentacja: [Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/), [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/), [Functions](https://docs.netlify.com/build/functions/get-started/).
