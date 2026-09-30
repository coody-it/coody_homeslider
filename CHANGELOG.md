# Changelog

Wszystkie istotne zmiany w module **Coody Home Slider** (`coody_homeslider`).

## [1.1.0] — 2026-09-30

### Dodane
- **Wizualny edytor slajdu** w BO: warstwy tekstu, przycisków, obrazów i kształtów układane bezpośrednio na podglądzie — przeciąganie z przyciąganiem, zmiana szerokości, edycja tekstu dwuklikiem, lista warstw, cofnij/ponów, skróty klawiszowe.
- Osobne położenie, rozmiar i widoczność warstw dla komputera i telefonu; „Ułóż automatycznie” dla telefonu.
- Animacje wejścia warstw (efekt, opóźnienie, czas) z podglądem w edytorze.
- Przyciemnienie zdjęcia pod warstwami (gradient z wybranej strony / całość), osobno dla komputera i telefonu.
- Upload obrazów warstw (PNG z przezroczystością) do `img/layers/`.
- Konfiguracja: układ *Pełna szerokość / W kontenerze*, kolor akcentu, animacja napisów.
- Formularz slajdu jako jeden ekran edytora: panel boczny *Warstwa / Slajd* (grafiki, aktywność, nazwa, link, alt w panelu *Slajd*); skalowanie tekstu uchwytem w rogu, suwak i A− / A+; zoom podglądu; animacja odtwarza się po zmianie ustawień; przycisk „Zapisz i zostań”.

### Zmienione
- Cały slajd (grafiki + warstwy) jest per język; brak grafik w danym języku → slajd z języka domyślnego.
- Szablon frontu obsługuje WebP (`<picture>`), `fetchpriority` dla pierwszego slajdu i tryb „W kontenerze” — override w motywie nie jest już potrzebny.

### Migracja
- Upgrade tworzy kolumnę `layers` i zamienia dotychczasowy napis (nazwa slajdu, opis, przycisk) na warstwy.
- Po aktualizacji ustaw **Układ** w Konfiguracji (domyślnie *Pełna szerokość*); sklep, który miał slider w kontenerze przez override motywu, wybiera *W kontenerze*.

---

## [1.0.14] — 2026-09-10

### Naprawione
- Zapis konfiguracji BO przy multistore: wartości zapisywane globalnie i dla każdego sklepu (uniknięcie rozjazdu override’ów).
- Formularz **Konfiguracja** na własnej zakładce: poprawny token kontrolera `AdminCoodyHomeSliderConfig` (wcześniej token `AdminModules` → „Invalid security token”).
- Ikona pozycji **Slider** w menu Coody (przywrócona `image`).

### Zmienione
- Tryb strzałki + kropki: na mobile (≤767px) strzałki i dotsy są ukryte (swipe bez zmian).
- Dokumentacja: README zaktualizowany do 1.0.14 (menu, tryby nawigacji, fallback mobile).

---

## [1.0.13] — 2026-09-10

### Dodane
- Menu BO: **Coody → Slider → Konfiguracja / Slajdy** (submenu zamiast jednej pozycji).

---

## [1.0.12] — 2026-09-10

### Dodane
- Opcja BO **Nawigacja: strzałki + kropki** — zamiast paska z nazwami slajdów: strzałki lewo/prawo na slajdzie i kropki na dole (styl ogólny, do nadpisania w motywie).
- Fallback front: brak grafiki mobile → używana grafika desktop.

---

## [1.0.11] — 2026-08-12

### Dodane
- Pola slajdu w BO: **Tekst przycisku** (`button_title`) i **Link przycisku** (`button_link`) — wielojęzyczne CTA na slajdzie.

---

## [1.0.10] — 2026-08-12

### Naprawione
- Zakładka nadrzędna **Coody** w BO: pusta `icon` (jak w `ds_contacts` / `advancedcms`). W PrestaShop 8 new-theme (`nav_bar.tpl`) root z ikoną renderuje się jako pojedynczy link bez submenu.

---

## [1.0.9] — 2026-07-14

### Naprawione
- Białe slajdy od drugiego wzwyż przy działającym ładowaniu grafik w Network — motyw (Bootstrap) ukrywał `.carousel-item` bez klasy `.active`; Owl nie przełącza tej klasy.
- Lazy load Owl Carousel na desktopie (768–1920 px) — kolejne slajdy zostawały na placeholderze mimo pobrania obrazków.
- Błąd upgrade modułu na PHP 8.1+ (`clearCache(): void` zwracane jako `bool` w skryptach `upgrade-*.php`) — moduł był wyłączany po nieudanej aktualizacji.

### Zmienione
- Slajdy w szablonie: klasa `coody-homeslider__slide` zamiast `carousel-item` (brak konfliktu z Bootstrap).
- Obrazki slajdów ładują się bezpośrednio z `src` (bez `data-src` / `owl-lazy`).
- `lazyLoad: false` w Owl Carousel.
- `repairSlideImages()` po refresh/clone karuzeli (zabezpieczenie przy `loop`).

---

## [1.0.8] — 2026-07-14

### Zmienione
- Aktualizacja wersji dokumentacji i plików konfiguracyjnych.

---

## [1.0.6] — 2026-07-14

### Zmienione
- Nawigacja slidera: stały rozmiar czcionki **12px** (tytuły slajdów i strzałki).
- Ikony strzałek SVG: **12×12px**.
- Usunięto marginesy mobile (`margin-top` / `margin-bottom: 3rem`) z CSS modułu — odstępy na mobile są konfigurowane w motywie sklepu, nie w module.

---

## [1.0.5] — 2026-07-14

### Naprawione
- Zbyt duża nawigacja na domyślnych motywach PrestaShop (konflikt globalnych stylów `button`).
- Poziomy scroll strony spowodowany przez `width: 100vw` w CSS.

### Zmienione
- Pełna szerokość slidera liczona w JS (`syncFullWidth`) zamiast `100vw` w CSS.
- Reset stylów przycisków nawigacji (`appearance`, `box-shadow`, `min-height` itd.).
- Wyższy priorytet ładowania CSS modułu (250), aby nadpisywać style motywu.

---

## [1.0.4] — 2026-07-14

### Dodane
- Owl Carousel wbudowany w moduł (JS + CSS) — brak zależności od motywu.
- Hook `displayWrapperTop` (motyw Classic i podobne).
- Własny placeholder obrazka (`img/placeholder.svg`).
- Ikony strzałek jako SVG (bez fontu ikon motywu).

### Zmienione
- Unikalna klasa karuzeli `.coody-homeslider__carousel` zamiast `#sliderHome` (brak konfliktu z `ps_imageslider`).
- Moduł działa po instalacji bez edycji motywu (hooki `displayWrapperTop`, `displayHomeTop`, `displayHomeSliders`).
- Zaktualizowany opis w konfiguracji modułu.

---

## [1.0.3] — 2026

### Naprawione
- Pozycje slajdów w BO: numeracja od 0 (wyświetlanie `position + 1`).

---

## [1.0.2] — 2026

### Naprawione
- Wyświetlanie slidera na stronie głównej — rejestracja hooków `displayHomeSliders`, `displayHomeTop`, `displayHeader`.
- Duplikacja slidera przez wczesne wywołanie `displayHome` w `IndexController`.

---

## [1.0.1] — 2026

### Zmienione
- Zakładka zarządzania slajdami przeniesiona pod grupę menu BO **Coody** (`AdminCoody`).

---

## [1.0.0] — 2026

### Dodane
- Pierwsza wersja modułu.
- Panel BO: dodawanie, edycja, duplikacja i sortowanie slajdów.
- Osobne grafiki desktop i mobile na slajd.
- Pola wielojęzyczne: tytuł, opis, link, tekst alternatywny (alt).
- Slider na stronie głównej z karuzelą Owl Carousel.
- Dolny pasek nawigacji ze strzałkami i tytułami slajdów (desktop).
- Podgląd sąsiednich slajdów na mobile i ekranach >1920px.
- Konfiguracja: włącz/wyłącz, czas slajdu (ms).
- Wsparcie multistore (`actionShopDataDuplication`).
