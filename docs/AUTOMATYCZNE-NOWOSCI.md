# Automatyczny przegląd produktów partnerów — v7

Strona zaczyna od lokalnych produktów i zdjęć zawartych w paczce. Zwykły odwiedzający nie pobiera katalogów producentów. Po wdrożeniu projektu Netlify odpytuje publiczne strony partnerów raz dziennie i udostępnia gotowe zestawienie przez `GET /api/partner-news`.

## Co jest nowością

- **Nowość w katalogu producenta / nowy kolor:** produkt znaleziony w wyraźnie oznaczonej sekcji lub na karcie z oznaczeniem producenta, np. na planszy Drogbruk albo w katalogu TARRACE. To oznaczenie źródłowe, a nie potwierdzenie bieżącej dostępności w Markin.
- **Nowo dodane do zestawienia:** adres konkretnego produktu pojawił się po zarejestrowaniu pierwszej listy kontrolnej partnera. Pierwszy poprawny odczyt zwykłej kategorii nie zamienia całego asortymentu w premiery.
- **Wybór Markin:** osobna, ręcznie przygotowana część katalogu. Nie zależy od działania źródeł. Pochodzi z `data/curated-products.json`.
- `discoveredAt` oznacza moment wykrycia karty. Automat pozostawia `publishedAt` puste, gdy brak osobno potwierdzonej daty premiery. Nie wykorzystuje daty modyfikacji mapy strony lub zdjęcia do określenia premiery produktu. Nie importuje cen, stanów magazynowych ani całych tekstów partnerów.

## Monitorowane zakresy

| Partner | Co sprawdza funkcja |
| --- | --- |
| Drogbruk | Oficjalne slajdy ze znakiem nowości lub informacją o nowym kolorze i odnośnikiem do produktu. |
| LedBruk | Sekcja „Nowości” i wskazane w niej karty oświetlenia. |
| Pater | Karty produktów w kategorii tarasu; uwzględnia oznaczenie „NOWOŚĆ”. |
| TARRACE | Karty katalogowe na tarrace.pl/produkty/; uwzględnia etykiety producenta. |
| Semmelrock | Produktowa część oficjalnej polskiej mapy Wienerberger: płyty tarasowe i kostki/płyty brukowe. |
| Tubądzin | Dwie części polskiej mapy produktów; tylko pozycje tarasowe i koraTER. Fotografie mogą pochodzić także z oficjalnego CDN Tubądzin. |
| Renoplast | Karty wsporników dostępne z polskiej sekcji tarasowej. |
| Nanobauer | Publiczna lista w sklepie B2B producenta. Tylko preparaty z wybranych serii do nawierzchni, kamienia, betonu i spoin; bez logowania i cen. |
| New Form | Karty gresu GoliatGres z kolekcji Goliat i Patio. |
| PRO-GRES | Najnowsze karty publicznego sklepu dystrybutora twojaplytka.pl. Wymagane oznaczenie tarasowe, grubość 2 cm/20 mm lub potwierdzona rodzina Slipstop Amalfi. |
| Verde Ceramika | Karty w sekcji nowości pasujące do oznaczeń tarasu / outdoor / 2.0 / 2 cm. Zwykłe nowości łazienkowe nie trafiają do wyników. Pliki ZIP z teksturami nie zastępują kart produktów. |
| Cersanit | Kategoria taras/balkon → maks. 10 dopasowanych podstron kolekcji → karty płytek. Zabezpieczenie po stronie producenta może zwracać HTTP 403. Bez obchodzenia blokady; kolejna próba następnego dnia. |
| Libet | Karty produktów z kategorii zewnętrznych płyt z gresu porcelanowego. |
| Crusil | Publiczne karty kolekcji producenta. |
| Drewbet | Karty z numerowanymi adresami oferty ogrodzeń. |
| SLABB | Karty bloczków, płyt i donic w produktowej części strony. |
| Forbet | Oficjalna strona `/produkty/` i docelowe `/products/…/`. Jeżeli serwer pominie certyfikat pośredni Sectigo DV R36, klient może uzupełnić łańcuch **wyłącznie dla forbet.pl / www.forbet.pl**, po sprawdzeniu podpisu wystawcy względem zaufanego publicznego roota Node. Certyfikat serwera, jego ważność i nazwa hosta nadal są sprawdzane. Nie wyłączamy TLS i nie zmieniamy systemowego magazynu certyfikatów. [Łańcuch Sectigo](https://www.sectigo.com/knowledge-base/detail/Access-New-Sectigo-Certificate-Chain). |

Katalogi zmieniają się niezależnie od Markin. Zakres określa `netlify/lib/product-sources.mjs`. Lista nie obejmuje każdego archiwalnego produktu czy wszystkich kategorii producenta. Brak zmian w monitorowanym zakresie jest normalnym wynikiem sprawdzania.

**Kontrola paczki — 9 listopada 2026, 11:53 czasu polskiego:** ostatni odczyt rzeczywistych stron zakończył się poprawnie dla 16 z 17 źródeł (5 ze zdjęciami produktów, 11 w trybie obserwacji). W paczce jest 10 pozycji automatu z lokalnymi zdjęciami; redakcyjny katalog jest osobny. Punkt odniesienia obejmuje 287 adresów, w tym 32 produkty Forbet odczytane przy poprawnej weryfikacji TLS. Cersanit zwracał HTTP 403. Ta marka pozostaje w katalogu redakcyjnym i na liście ponawianych sprawdzeń, ale bieżący wynik nie potwierdza automatycznego pobierania jej nowych kart. Wynik opisuje kontrolę lokalną z połączeniem do źródeł, a nie wdrożenie na koncie Netlify.

## Dane, awarie i aktualizacje

1. Harmonogram `0 5 * * *` uruchamia `refresh-partner-news` o 05:00 UTC — 06:00 zimą i 07:00 latem w Polsce. Tylko `context.deploy.context === 'production'` oraz `published === true` dopuszczają zapis. [Dokumentacja harmonogramów Netlify](https://docs.netlify.com/build/functions/scheduled-functions/).
2. Stan v7 trafia do osobnego magazynu `markin-partner-products-v7`, pod klucz `products-v7`. Publikacja v7 nie potrzebuje dostępu do starszych magazynów. Żądania do API nigdy nie odczytują z nich danych. Publiczna odpowiedź zachowuje `schemaVersion: 2`, `kind: products`, dodaje `policyVersion: 7`; nie ujawnia pełnej historii śledzonych URL-i. [Dokumentacja Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).
3. JSON i zdjęcia są przyjmowane z jawnej listy oficjalnych domen. Walidowane są także hosty przekierowań, wzorzec ścieżki i dane zdjęcia (JPEG, PNG, WebP). Przeglądarka pobiera obraz lokalny z `assets/products/` albo `GET /api/product-image?id=<sha256>`. API nie przyjmuje zewnętrznego URL do pobrania.
4. Osobne źródła są sprawdzane równolegle. Na jeden przebieg zwykłego listingu przypadają maksymalnie dwie nowo wykryte karty do szczegółowej kontroli. Następne oczekujące karty nie są oznaczane jako zakończone. Do prezentacji trafiają maksymalnie cztery pozycje na źródło. Przy braku nowego zdjęcia pozycja jest ponawiana; produkt bez potwierdzonego zdjęcia nie jest publikowany. Ponowne odczyty tego samego adresu nie tworzą duplikatów.
5. Awaria źródła zachowuje jego poprzednie poprawne pozycje i czas ostatniego sukcesu; inne źródła działają niezależnie. Po poprawnym odczycie pozycje znikające z monitorowanej listy przestają wyświetlać się jako aktualne. Zapis warunkowy ETag (`onlyIfMatch`/`onlyIfNew`) zapobiega nadpisaniu nowszych danych przez równoległy przebieg.
6. `sources[].status`: `ok` — dostępne produkty; `monitoring` — lista sprawdzona, brak nowych dopasowanych kart do wyświetlenia; `partial` — część szczegółów/zdjęć niedostępna; `error` — odczyt nie powiódł się. Kody błędu pozwalają odróżnić 403, zmianę HTML, timeout lub niedostępność serwera. W przypadku globalnej awarii magazynu funkcja odczytu używa zestawu startowego z paczki, a strona zachowuje lokalny zestaw, gdy funkcja jest niedostępna.

## Wdrożenie i sprawdzenie

Wgraj cały projekt przez repozytorium Git bądź Netlify CLI, z poleceniem budowania `npm run build`, generowanym folderem publikacji `markin-publish` i funkcjami `netlify/functions`. Pliki źródłowe strony są w `public`. Sam statyczny folder zawiera katalog, ale nie realizuje harmonogramu. [Funkcje Netlify](https://docs.netlify.com/build/functions/get-started/).

Po wdrożeniu sprawdź znaczek **Scheduled** przy `refresh-partner-news`, wybierz **Run now** na aktualnym wdrożeniu produkcyjnym i po odświeżeniu cache CDN sprawdź `/api/partner-news`: `mode: cached`, datę i statusy poszczególnych marek. Częściowa awaria jednego zewnętrznego serwisu nie oznacza awarii całego katalogu. Po następnym uruchomieniu sprawdź logi harmonogramu. Lokalne testy nie zastępują tej kontroli na koncie Netlify.

`npm test` uruchamia testy. `npm run news:verify` odpytuje prawdziwe źródła bez zapisywania paczki; `npm run news:snapshot` zapisuje aktualny zestaw, stan pierwszego odczytu oraz nowe zdjęcia w `public/assets/products/`. Kod wyjścia 1 po zapisaniu zestawu sygnalizuje co najmniej jedno źródło z błędem/częściowym wynikiem — odczytaj `sources` w JSON. Po zapisaniu uruchom `npm run build`.
