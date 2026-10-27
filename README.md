# Watchever

## Opis ogólny

Aplikacja korzysta z bazy danych **TMDB API** (bazy danych zawierającej szczegółowe dane o filmach i serialach) i na jej podstawie generuje rekomendacje filmów do obejrzenia dla użytkownika.

Użytkownik po uruchomieniu aplikacji ustala preferencje dotyczące rekomendacji, np. rok produkcji, czas trwania, gatunek itp. Ustala również platformy streamingowe, do których ma dostęp, aby generowane były jedynie filmy na nich dostępne.

Następnie użytkownikowi wyświetlana jest rekomendacja wraz z najważniejszymi informacjami o filmie. Użytkownik może zdecydować o wygenerowaniu kolejnej, innej propozycji filmu.

### Funkcjonalności opcjonalne

Aplikacja może otrzymać możliwość importu plików `.csv` z danymi na temat obejrzanych przez użytkownika filmów oraz ich ocen. Dzięki temu można by dodatkowo zaimplementować sugestie bazujące na dotychczasowej historii użytkownika. Ułatwiłoby to również generowanie rekomendacji filmów, których użytkownik jeszcze nie widział.

## Wymagania funkcjonalne

1. Aplikacja pobiera dane na temat filmów z **TMDB API**.
2. Aplikacja umożliwia użytkownikowi wybór preferowanych platform streamingowych.
3. Aplikacja umożliwia użytkownikowi ustawienie filtrów wyszukiwanych filmów.
4. Aplikacja rekomenduje film zgodny z preferencjami użytkownika.
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
