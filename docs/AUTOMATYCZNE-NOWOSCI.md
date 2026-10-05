# Automatyczne inspiracje i wiadomości partnerów

Moduł do włączenia w paczkę strony MARKIN. Wersja Node.js 22+, funkcje Netlify w formacie ESM. Nie wymaga klucza AI, hasła do strony partnera ani ręcznie tworzonego tokenu Blobs.

## Pliki do integracji

- `netlify/functions/partner-news.mjs` — odczyt JSON pod `/api/partner-news` oraz standardowym adresem funkcji.
- `netlify/functions/refresh-partner-news.mjs` — automatyczne odświeżanie raz dziennie.
- `netlify/lib/news-*.mjs` — lista źródeł, parser, trwały cache i początkowy snapshot.
- `public/data/partner-news.json` — początkowe dane dla strony statycznej, generowane przez `npm run news:snapshot` po weryfikacji.
- zależności z `package.json` i odpowiadające im wpisy lockfile.

Połącz konfigurację strony z:

```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[build.environment]
  NODE_VERSION = "22"
```

Publikacja automatu: po rozpakowaniu projektu podłącz repozytorium Git do Netlify, ustaw istniejące polecenie budowania strony i folder publikacji. Alternatywnie użyj Netlify CLI, zaloguj się, powiąż projekt i wykonaj `netlify deploy --build --prod`. O zwykłym udostępnieniu folderu statycznego nie należy mówić, że uruchamia automat: wymagana jest obecność obu wdrożonych funkcji. Dokumentacja Netlify opisuje też obsługę budowania niektórych projektów przez zalogowane Netlify Drop; niezależnie od sposobu publikacji sprawdź kartę Functions.

## Harmonogram i pierwszy start

Netlify używa UTC. `0 5 * * *` oznacza 05:00 UTC: 06:00 zimą i 07:00 latem w Polsce. Harmonogram działa tylko dla opublikowanej wersji produkcyjnej. Po pierwszym wdrożeniu uruchom **Functions → refresh-partner-news → Run now**, a następnie otwórz `/api/partner-news` i sprawdź `mode`, `sources`, `lastSuccessAt`. Do czasu pierwszego poprawnego odświeżenia serwowany jest dołączony snapshot.

Funkcja harmonogramu nie ma publicznego adresu wywołania. Endpoint odczytu przyjmuje wyłącznie GET/HEAD i nie pobiera stron partnerów przy każdym wejściu klienta.

W Netlify **Data & Storage → Blobs** pojawi się store `markin-partner-news-v1`, klucz `snapshot-v1`. Dane są zachowywane pomiędzy kolejnymi wdrożeniami strony. Automatyczne dane uwierzytelniania zapewnia Netlify. Czytanie cache musi się udać przed zapisem; awaria odczytu nie nadpisze istniejącego cache. Błąd źródła zachowuje jego wcześniejsze wpisy oraz datę ostatniego udanego pobrania. Podgląd wdrożenia nie zapisuje danych produkcyjnych.

Funkcja sprawdza udokumentowane `context.deploy.context` i `context.deploy.published`; brak kontekstu, podgląd, wdrożenie gałęzi lub starszy deploy kończy odświeżanie przed dostępem do cache. Nie opiera się na `process.env.CONTEXT`, które jest zmienną etapu budowania. Równoległe wywołania są zabezpieczone ETag i warunkowym zapisem: wolniejszy przebieg nie może nadpisać nowszych danych. Do lokalnej weryfikacji pobierania użyj skryptu `news:verify`; wrapper harmonogramu celowo nie zapisuje bez potwierdzonego produkcyjnego kontekstu.

## Pasek nad menu / frontend

Wyświetl najpierw wpisy z dołączonego snapshotu. Następnie spróbuj `fetch('/api/partner-news', { signal: AbortSignal.timeout(5000) })`. Zastąp wpisy tylko po poprawnym JSON i niepustej tablicy `entries`. Gdy funkcja nie jest dostępna, zostaw snapshot. Pole `title` wstawiaj przez `textContent`, nigdy `innerHTML`; przed użyciem `url` akceptuj tylko HTTPS i domeny partnerów z listy źródeł. Dla nowych okien użyj `rel="noopener noreferrer"`.

Proponowana etykieta paska: **„Inspiracje i nowości partnerów”**. Nie nazywaj każdego wpisu „dzisiejszą nowością”: źródła mogą publikować nieregularnie i zwracać starsze poradniki. `publishedAt` to rzeczywista data ze źródła albo `null`. `discoveredAt` jest techniczną datą pierwszego odczytu i nie powinna udawać daty publikacji. Na stronie warto pokazać nazwę partnera, tytuł i link **„Czytaj u producenta”**. Dostępność produktu w MARKIN potwierdza sprzedawca.

Animacja paska powinna zatrzymywać się przy `hover`/fokusie i respektować `prefers-reduced-motion`. Dodaj przycisk pauzy, jeśli zawartość stale się przewija.

## Kontrola źródeł

W `news-sources.mjs` można zmienić wyłącznie jawnie zatwierdzone domeny i źródła. Moduł nie przyjmuje URL od odwiedzającego. Ruch ma limit czasu 8 s na źródło/metodę, maks. 1,5 MB na odpowiedź i maks. 3 przekierowania w obrębie listy dozwolonych domen. Maksymalnie 6 źródeł jest pobieranych równolegle, a każdy ma maks. jedną próbę RSS i jedną próbę HTML. DTD i deklaracje encji są odrzucane. Nie są pobierane pełne artykuły ani zdjęcia partnerów.

Zmiana struktury strony partnera może wymagać poprawienia selektorów HTML. Kanały RSS są preferowane. W `sources` JSON znajdują się `status`, `checkedAt`, `lastSuccessAt`, `count`, `method`, `error`. Sprawdzanie `sources` lub logów Functions pozwala wychwycić źródło, które przestało działać. Nie ma gwarancji publikacji nowych artykułów przez samych producentów.

`status: "empty"` oznacza poprawny odczyt, w którym żaden wpis nie pasował do oferty MARKIN; nie jest awarią połączenia. Przykładowo blog Bozza ma artykuły o wannach i drzwiach, które są odrzucane. Promocje z ceną/procentem i tytułami promocyjnymi są wykluczone, ponieważ sam kanał nie potwierdza okresu obowiązywania oferty. Drogbruk jest odczytywany z publicznych kart HTML wyróżnionych poradników; ta wersja nie pobiera pełnego archiwum dynamicznej wyszukiwarki producenta.

## Weryfikacja lokalna

```powershell
npm ci
npm test
npm run news:verify
npm run news:snapshot
```

`news:verify` wykonuje prawdziwe odczyty publicznych źródeł i zapisuje materiał kontrolny do `test/live/` (nie publikuj go razem ze stroną). Testy jednostkowe sprawdzają daty, deduplikację, ochronę linków, limity odpowiedzi i zachowanie ostatnich danych przy awarii. Testy lokalne nie potwierdzają aktywności harmonogramu ani dostępu do Blobs na koncie docelowym; sprawdź to po własnym wdrożeniu.

## Zweryfikowana dokumentacja Netlify — 5 października 2026

- Harmonogram UTC, 30 s, tylko publikacja produkcyjna, Run now: https://docs.netlify.com/build/functions/scheduled-functions/
- API JavaScript i wdrożenie przez Git/CLI: https://docs.netlify.com/build/functions/get-started/
- Blobs, site-wide store i trwałość pomiędzy wdrożeniami: https://docs.netlify.com/build/data-and-storage/netlify-blobs/
- Sposoby publikacji i aktualne zachowanie Drop: https://docs.netlify.com/deploy/create-deploys/

Te odnośniki dokumentują mechanizm. Nie stanowią potwierdzenia wdrożenia tej paczki na koncie użytkownika.
