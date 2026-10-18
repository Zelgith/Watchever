# Jukebox

Darmowa aplikacja mobilna do słuchania i organizowania muzyki na telefonie.
Pliki, katalog, ulubione i playlisty są zapisane na urządzeniu. Podstawowe funkcje
działają offline.

## MVP

- Import plików MP3 dostępnych na telefonie.
- Katalog utworów, albumów i wykonawców oraz wyszukiwanie lokalne.
- Play, pause, next, previous i przewijanie; kolejność wynika z wybranej listy.
- Dodawanie i usuwanie ulubionych.
- Tworzenie, zmiana nazwy i usuwanie playlist oraz dodawanie i usuwanie ich utworów.

Brakujące metadane nie blokują importu. Brakujący tytuł zastępuje nazwa pliku,
a brakujący wykonawca i album są oznaczane jako nieznane. Odtwarzanie w tle,
shuffle, repeat i edytowalna kolejka są rozszerzeniami po MVP.

## Technologie

- React Native, Expo, TypeScript i Expo Router: interfejs i nawigacja.
- expo-audio i React Context: jeden odtwarzacz współdzielony przez ekrany.
- expo-sqlite: trwały katalog, ulubione i playlisty.
- expo-document-picker i expo-file-system: wybór i trwałe przechowywanie plików.

## Dane i niezawodność

Import kopiuje nagranie do katalogu dokumentów aplikacji i zachowuje oryginał.
Wpis biblioteki powstaje po poprawnym skopiowaniu pliku. Anulowanie importu,
brak miejsca i niedostępny plik wymagają obsługi bez pozostawiania niekompletnych wpisów.

Usunięcie utworu z playlisty nie usuwa nagrania. Biblioteka pozostaje po restarcie;
wyczyszczenie danych aplikacji lub jej odinstalowanie może ją usunąć.
Synchronizacja i kopie zapasowe są poza MVP.

## Soulseek (poza MVP)

Wyszukiwanie w sieci Soulseek i pobieranie bezpośrednio
na telefon. Ukończony plik trafia do lokalnej biblioteki. Internet jest potrzebny
do wyszukiwania i pobierania; zapisane nagrania pozostają dostępne offline.

## Odbiór MVP

Import MP3, play/pause/seek. Po ponownym uruchomieniu aplikacji plik i biblioteka
muszą pozostać dostępne.

## Licencja

[MIT](LICENSE) dla kodu i dokumentacji.
