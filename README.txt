MARKIN · aktualizacja strony · 9 listopada 2026

WDROŻENIE W ISTNIEJĄCYM PROJEKCIE NETLIFY
1. Rozpakuj cały plik MARKIN-strona-v7-Netlify.zip w Windows („Wyodrębnij wszystkie”).
2. W GitHub Desktop wybierz swoje repozytorium MARKIN i „Show in Explorer”. Do głównego folderu repozytorium skopiuj ZAWARTOŚĆ rozpakowanej paczki. Plik netlify.toml ma leżeć bezpośrednio obok package.json i folderów public oraz netlify. Nie zmieniaj folderu .git. Pełna paczka może też posłużyć jako zawartość nowego, pustego repozytorium.
3. W GitHub Desktop sprawdź zmiany, wpisz opis (np. „Nowi partnerzy i pielęgnacja kostki”), wybierz „Commit to main” i „Push origin”. Jeśli Netlify śledzi ten branch, rozpocznie budowanie strony.
4. Konfiguracja jest w netlify.toml: główny folder repozytorium, polecenie npm run build, publikowany folder markin-publish (powstaje przy budowaniu, zawiera tylko bieżące materiały), funkcje netlify/functions. W Netlify poczekaj na produkcyjne wdrożenie (Published). Ręczne przeciągnięcie samego public uruchomi wersję statyczną, bez codziennego pobierania nowości.
5. Po publikacji otwórz Partnerzy oraz Zadbaj o swoją kostkę. Na stronie /api/partner-news powinien pojawić się zestaw produktów w formacie JSON. W panelu Functions sprawdź następne zaplanowane uruchomienie refresh-partner-news i jego wynik.

CO ZAWIERA STRONA
Główna: pokaz aranżacji co 4 sekundy, pasek informacyjny oraz niżej osobny rząd produktów. Przyciski otwierają osobne podstrony.
Partnerzy: 17 marek, pozycja w menu i stopce. Cersanit i Tubądzin pokazują gres zewnętrzny; New Form reprezentuje Goliat Gres, a PRO-GRES jest opisany jako dystrybutor. TARRACE oznacza markę LIS / PH Saturn.
Zadbaj o swoją kostkę: osobno czyszczenie i ochrona, 4 preparaty Nanobauer oraz Semmelrock Pave Care. Z karty preparatu można przejść do źródła, zapisać produkt lub przygotować zapytanie.
Zdjęcia i treść startowa są w projekcie. Dostępność u producenta i cena nie są stanem magazynowym MARKIN.
 
AUTOMAT
Raz dziennie o 05:00 UTC (06:00 w Polsce zimą, 07:00 latem). Działa po produkcyjnym wdrożeniu z funkcjami i Netlify Blobs. Nie wymaga podawania kluczy firm partnerskich. Odczytuje wybrane kategorie lub karty oznaczone przez producenta, pomija artykuły prasowe. Gdy ktoś doda kartę w monitorowanej kategorii, automat rozróżnia wykrycie od premiery zadeklarowanej przez partnera. Awaria jednego źródła nie usuwa wyboru lokalnego. Szczegółowy zakres i ograniczenia: docs/AUTOMATYCZNE-NOWOSCI.md. Bieżący wynik testu źródeł: RAPORT-SPRAWDZENIA.txt.

EDYCJA I PODGLĄD
data/partners.json — lista marek; data/curated-products.json — wybór produktów i zdjęcia; data/campaign.json — kolejność slajdów.
Źródło każdego dodanego zdjęcia i karty opisano w docs/produkty-zrodla-v7.json. Zdjęcia produktów dynamicznych mają imageSource w public/data/partner-news.json.
Podgląd po rozpakowaniu: w głównym folderze projektu npm ci i npm run build; public udostępnij przez lokalny serwer HTTP. Samo otwarcie .html wprost z dysku nie uruchamia wszystkich interakcji.
Kontrola: npm test oraz node scripts/verify-local.mjs. Podgląd bieżącego pobierania bez zmiany projektu: npm run news:verify.

