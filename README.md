# Watchever

## Opis ogólny

Aplikacja korzysta z bazy danych **TMDB API** (bazy danych zawierającej szczegółowe dane o filmach i serialach) i na jej podstawie generuje rekomendacje filmów do obejrzenia dla użytkownika.

Użytkownik po uruchomieniu aplikacji ustala preferencje dotyczące rekomendacji, np. rok produkcji, czas trwania, gatunek itp. Ustala również platformy streamingowe, do których ma dostęp, aby generowane były jedynie filmy na nich dostępne.

Następnie użytkownikowi wyświetlana jest lista rekomendowanych filmów. Każda propozycja spełnia wybrane preferencje i jest dostępna w abonamencie na co najmniej jednej wskazanej platformie w Polsce.

Preferencje i historia oglądania są zapisywane lokalnie w SQLite. Film można oznaczyć jako obejrzany i opcjonalnie ocenić w skali 1–5. Rekomendacje pomijają obejrzane tytuły i uwzględniają oceny oraz filmy podobne do wysoko ocenionych, zachowując wszystkie ustawione filtry. Wyszukiwanie sprawdza do pięciu stron TMDB i zwraca do 20 propozycji.

### Funkcjonalności opcjonalne

Import historii i ocen z plików `.csv` pozostaje funkcją opcjonalną.

## Wymagania funkcjonalne

1. Aplikacja pobiera dane na temat filmów z **TMDB API**.
2. Aplikacja umożliwia użytkownikowi wybór preferowanych platform streamingowych.
3. Aplikacja umożliwia użytkownikowi ustawienie filtrów wyszukiwanych filmów.
4. Aplikacja rekomenduje filmy zgodne z preferencjami użytkownika.
5. Aplikacja wyświetla podstawowe dane na temat wybranego filmu.
6. Aplikacja umożliwia odrzucenie rekomendacji i wygenerowanie kolejnej.
7. **(Opcjonalnie)** Aplikacja umożliwia import plików `.csv` z danymi użytkownika na temat obejrzanych filmów oraz ocen.
8. Aplikacja uwzględnia historię oglądania i wystawione przez użytkownika oceny przy doborze filmów.

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

Node.js 24 lub 26 LTS. Android: [Expo Go (SDK 58)](https://expo.dev/go?sdkVersion=58&platform=android&device=true) lub włączony emulator.

```sh
npm ci
cp -n .env.example .env.local
```

W `.env.local` wpisz **API Read Access Token** z [TMDB](https://www.themoviedb.org/settings/api):

```dotenv
EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN=TWOJ_TOKEN
```

```sh
npm start        # telefon w tej samej sieci: QR w Expo Go
# lub
npm run android  # emulator
```

APK testowy: `npm run apk` (JDK 17 i Android SDK).
