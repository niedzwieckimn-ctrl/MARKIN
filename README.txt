MARKIN — NOWA STRONA + AUTOMATYCZNE WIADOMOŚCI PARTNERÓW
Wersja przygotowana 5 października 2026

GOTOWA PACZKA
To kompletny projekt do wdrożenia na Netlify. Domena nie została zmieniona.
Folder public zawiera gotową stronę, którą można od razu obejrzeć, otwierając
public/index.html. Najpełniejszy podgląd uzyskasz przez serwer HTTP.
Wersja produkcyjna wymaga wdrożenia całego projektu wraz z funkcjami.

ZAWARTOŚĆ
- strona główna, oferta, realizacje, projektowanie, o firmie, poradnik,
  kontakt, nowości, prywatność i własna strona 404;
- oryginalne logo, materiały Markin, 32 zdjęcia realizacji;
- 151 pobranych zasobów treści (oryginały i warianty zdjęć, logotypy, PDF),
  zachowane lokalnie; zoptymalizowane WebP i lokalne fonty;
- pasek wiadomości nad menu: przewijanie, pauza, aktywne linki,
  zatrzymanie po najechaniu / fokusie, respektowanie ograniczenia ruchu;
- codzienne sprawdzanie oficjalnych źródeł Libet, Drogbruk, LedBruk,
  Gatigo i Bozza; filtrowanie treści według asortymentu;
- daty publikacji producenta, pomijanie duplikatów i promocji,
  zachowanie wcześniejszych danych po błędzie;
- pełny kod, konfiguracja Netlify, testy i materiały źródłowe.

WDROŻENIE NA NETLIFY — Z AUTOMATYCZNYMI NOWOŚCIAMI
1. Rozpakuj ZIP. W katalogu głównym są netlify.toml, package.json,
   build.mjs, public, data oraz netlify.
2. Prześlij cały projekt do swojego repozytorium Git (bez node_modules).
3. W Netlify wybierz Add new project / Import an existing project
   i wskaż repozytorium.
4. Katalog bazowy: katalog z netlify.toml. Build command: npm run build.
   Publish directory: public. Node: 22. Konfiguracja jest w netlify.toml.
5. Opublikuj projekt. W zakładce Functions sprawdź obecność:
   partner-news oraz refresh-partner-news (Scheduled).
6. Otwórz refresh-partner-news i kliknij Run now na opublikowanym
   wdrożeniu produkcyjnym. Następnie otwórz adres:
   https://TWOJA-STRONA.netlify.app/api/partner-news
   Oczekiwane: mode = cached, wpisy entries, status źródeł sources,
   prawdziwe daty lastSuccessAt. Brak pasującego wpisu może mieć status empty.
7. Kolejne odczyty odbywają się codziennie o 05:00 UTC, czyli
   o 06:00 zimą lub 07:00 latem w Polsce. Dane trafiają do Netlify Blobs.
   Nie trzeba tworzyć klucza AI, hasła partnera ani tokenu w kodzie.

ALTERNATYWA — NETLIFY CLI
Wymagany Node.js 22 lub nowszy. W katalogu głównym projektu:
  npm ci
  npx netlify-cli login
  npx netlify-cli init
  npx netlify-cli deploy --build --prod
Logowanie wykonujesz na własnym koncie. Nie wysyłaj nikomu haseł ani tokenów.

WAŻNE ROZRÓŻNIENIE
Wgranie samych plików folderu public uruchomi stronę i przewijany pasek
z dołączonym zestawieniem, ale nie codzienne pobieranie. Automat wymaga
obu wdrożonych funkcji. Sposób Git/CLI opisany powyżej obejmuje je w całości.
Harmonogram i trwały zapis na Twoim koncie trzeba sprawdzić po wdrożeniu.
W tej paczce zweryfikowano działanie lokalne i prawdziwe odczyty źródeł.

CO POKAZUJE PASEK
Wstępne zestawienie zawiera 16 prawdziwych wpisów z oficjalnych serwisów.
Część to starsze poradniki, dlatego widoczne są rzeczywiste daty, a sekcja
nazywa się „Nowości i inspiracje”. Brak daty nie jest zastępowany datą dzisiejszą.
Bozza w momencie przygotowania nie miała pasujących tytułów w odczytanej liście.
Źródła można zmieniać w netlify/lib/news-sources.mjs. Kod nie kopiuje artykułów
ani nowych zdjęć producentów — publikuje tytuł, markę, datę i link.
Zmiana układu strony producenta może wymagać aktualizacji parsera.
Szczegóły: docs/AUTOMATYCZNE-NOWOSCI.md.

FORMULARZ KONTAKTOWY
Przycisk „Przygotuj wiadomość” tworzy treść zapytania. Użytkownik otwiera ją
we własnym programie pocztowym albo kopiuje. Formularz nie udaje wysyłki
serwerowej. Telefon, e-mail, Facebook i wyznaczanie trasy są aktywne.

EDYCJA
- treść i szablony stron: build.mjs;
- opisy usług i FAQ: data/content.json;
- lista realizacji: data/gallery.json;
- wygląd: public/styles.css;
- interakcje i pasek: public/app.js;
- źródła aktualności: netlify/lib/news-sources.mjs;
- zdjęcia oryginalne: public/assets/originals;
- używane lekkie wersje zdjęć: public/assets/images.
Po zmianie treści uruchom npm run build. Nie edytuj wyłącznie wynikowego HTML,
bo następne budowanie odtworzy go z build.mjs.

DANE MARKIN
Wykorzystano aktualną zakładkę Kontakt: Radlin 193C, 26-008 Górno,
577 730 739, biuro@markin.pl. Dawny adres 1 Maja 191 w Kielcach nie jest
przedstawiany jako drugi punkt. Nie wymyślano godzin pracy, stażu,
gwarancji, opinii ani własnej ekipy montażowej.
Oryginalny PDF OWS zachowano bez zmian. Dokument zawiera historyczne dane
adresowe, które właściciel powinien sprawdzić przed publikacją na domenie.
Stara polityka prywatności zawierała sprzeczne dane i tekst o wdrożeniach RODO.
Nie skopiowano jej jako aktualnej polityki. Strona Prywatność opisuje faktyczne
działanie nowej strony; dane administratora i obowiązki wobec korespondentów
warto uzupełnić zgodnie z aktualną dokumentacją firmy.

DOMENA
Paczka zakłada docelową domenę markin.pl w sitemap.xml i metadanych.
Można najpierw przetestować ją na adresie Netlify. Podłączenie markin.pl
wykonujesz po zaakceptowaniu podglądu. Zachowano przekierowania starych
podstron, zdjęć i dokumentu PDF.

ŹRÓDŁA I WERYFIKACJA
Zobacz docs/ZRODLA.txt, docs/oryginalne-tresci-markin.json,
docs/manifest-materialow-zrodlowych.json i RAPORT-SPRAWDZENIA.txt.
Pełne oryginalne materiały pobrano z Markin zgodnie z poleceniem właściciela
projektu. Pozostawiono istniejące oznaczenia marek i znaków na zdjęciach.
