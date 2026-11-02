# Watchever

## Opis ogólny

Aplikacja korzysta z bazy danych **TMDB API** (bazy danych zawierającej szczegółowe dane o filmach i serialach) i na jej podstawie generuje rekomendacje filmów do obejrzenia dla użytkownika.

Użytkownik po uruchomieniu aplikacji ustala preferencje dotyczące rekomendacji, np. rok produkcji, czas trwania, gatunek itp. Ustala również platformy streamingowe, do których ma dostęp, aby generowane były jedynie filmy na nich dostępne.

Następnie użytkownikowi wyświetlana jest lista rekomendowanych filmów. Każda propozycja spełnia wybrane preferencje i jest dostępna w abonamencie na co najmniej jednej wskazanej platformie w Polsce.

### Funkcjonalności opcjonalne

Aplikacja może otrzymać możliwość importu plików `.csv` z danymi na temat obejrzanych przez użytkownika filmów oraz ich ocen. Dzięki temu można by dodatkowo zaimplementować sugestie bazujące na dotychczasowej historii użytkownika. Ułatwiłoby to również generowanie rekomendacji filmów, których użytkownik jeszcze nie widział.

## Wymagania funkcjonalne

1. Aplikacja pobiera dane na temat filmów z **TMDB API**.
2. Aplikacja umożliwia użytkownikowi wybór preferowanych platform streamingowych.
3. Aplikacja umożliwia użytkownikowi ustawienie filtrów wyszukiwanych filmów.
4. Aplikacja rekomenduje filmy zgodne z preferencjami użytkownika.
5. Aplikacja wyświetla podstawowe dane na temat wybranego filmu.
6. Aplikacja umożliwia odrzucenie rekomendacji i wygenerowanie kolejnej.
7. **(Opcjonalnie)** Aplikacja umożliwia import plików `.csv` z danymi użytkownika na temat obejrzanych filmów oraz ocen.
8. **(Opcjonalnie)** Aplikacja ustala preferencje użytkownika na podstawie wystawionych przez niego ocen filmów.

## Wymagania niefunkcjonalne

1. Aplikacja działa na urządzeniach z systemem **Android**.
2. Aplikacja przestrzega warunków użytkowania **TMDB API**.
3. Aplikacja obsługuje błędy związane z komunikacją z **TMDB API**.
4. Aplikacja generuje rekomendacje bez zauważalnych opóźnień.
5. Aplikacja przetwarza dane użytkownika w minimalnym zakresie koniecznym do jej działania.

## Technologie

- **React Native**
- **Expo**
- **Expo Router**
- **Expo SQLite**

## Uruchomienie

Projekt wymaga Node.js 24 lub 26 LTS i npm. Korzysta z Expo SDK 58.

Przed pierwszym uruchomieniem skopiuj `.env.example` do `.env.local` i wpisz token **API Read Access Token** z [ustawień API TMDB](https://www.themoviedb.org/settings/api):

```sh
cp .env.example .env.local
```

Ustaw zmienną `EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN`. Plik `.env.local` jest wykluczony z Gita. Zmienne `EXPO_PUBLIC_*` trafiają do kodu uruchamianego na urządzeniu; token odczytu można odczytać z aplikacji. Nie używaj tu haseł ani tokenów kont użytkowników.

Po zmianie tokenu uruchom ponownie serwer Expo.

```sh
npm ci
npm start
```

Na telefonie z Androidem otwórz projekt w [Expo Go dla SDK 58](https://expo.dev/go?sdkVersion=58&platform=android&device=true), skanując kod QR. Telefon i komputer powinny być w tej samej sieci.

Jeśli korzystasz z emulatora, uruchom go wcześniej i wykonaj:

```sh
npm run android
```

Android SDK musi być dostępny przez `ANDROID_HOME`, a `adb` przez `PATH`.

Kontrola typów i reguł rekomendacji:

```sh
npm run typecheck
npm test
```

## Dane TMDB

Platformy są pobierane dla regionu `PL`, a nazwy gatunków i dane filmów w języku `pl-PL`. Aplikacja łączy się bezpośrednio z TMDB przez HTTPS i uwierzytelnia zapytania nagłówkiem Bearer.

Na ekranie wyboru można zaznaczyć kilka platform. Przycisk „Wszystkie platformy” rozwija pełną listę TMDB dla Polski.

Gatunki są opcjonalne. „Dowolne” usuwa ograniczenie gatunkowe. Przy kilku zaznaczonych gatunkach wystarcza dopasowanie do jednego z nich.

Po wybraniu platformy naciśnij „Znajdź filmy”. Wynik pokazuje listę tytułów z pierwszej strony wyników TMDB, do 20 propozycji, w kolejności popularności. Przed wyświetleniem każdego filmu aplikacja potwierdza abonament (`flatrate`) w Polsce na przynajmniej jednej wybranej platformie i dopasowanie gatunków. Zakup, wypożyczenie i dostępność wyłącznie w innych krajach nie spełniają tego warunku. Gdy TMDB nie potwierdza dostępności filmu, nie pojawia się on na liście.

Logo TMDB pochodzi z [oficjalnych materiałów TMDB](https://www.themoviedb.org/about/logos-attribution). Dane o dostępności filmów dostarcza JustWatch za pośrednictwem TMDB.

Informacje o źródłach znajdują się na osobnym ekranie „O aplikacji”, dostępnym z nagłówka. Ekrany wyboru i wyników nie zawierają stopki.
