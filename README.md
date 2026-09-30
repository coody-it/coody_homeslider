# Coody Home Slider

Moduł slidera banerów na stronie głównej dla **PrestaShop 8.x i 9.x**.

Autor: [coody.it](https://coody.it)  
Wersja: **1.1.0**

## Wymagania

| Wymaganie | Wersja |
|-----------|--------|
| PrestaShop | 8.0.0 – 9.99.99 |
| PHP | 8.1+ (zalecane przez PS 8) |

Moduł jest **samodzielny** — zawiera Owl Carousel; nie wymaga zmian w motywie po instalacji (opcjonalny własny hook / style w motywie).

## Instalacja

1. Skopiuj folder `coody_homeslider` do `modules/`.
2. W panelu administracyjnym: **Moduły → Module Manager**.
3. Znajdź **Coody - Slider strony głównej** i kliknij **Zainstaluj**.
4. Zarządzaj slajdami i ustawieniami: **Coody → Slider**.
5. Wyłącz moduł `ps_imageslider`, jeśli jest aktywny (może kolidować ze sliderem na stronie głównej).
6. Wyczyść cache: `php bin/console cache:clear` (lub w BO).

## Wyświetlanie na stronie głównej

Moduł rejestruje się automatycznie na hookach:

- `displayWrapperTop` — motyw Classic (nad kontenerem)
- `displayHomeTop` — standardowy hook w `index.tpl`
- `displayHomeSliders` — opcjonalny hook niestandardowy (jeśli motyw go definiuje)

Slider renderuje się **jeden raz** — pierwszy dostępny hook w szablonie wygrywa.

### Opcjonalnie: własny hook w motywie

Jeśli chcesz slider w konkretnym miejscu layoutu, dodaj w szablonie strony głównej:

```smarty
{hook h='displayHomeSliders'}
```

Następnie w **Projektowanie → Pozycje** przypnij moduł do tego hooka.

### Motyw: tryb „contained”

Motyw może dodać klasę `coody-homeslider--contained` na `<section>` (np. override `slider.tpl`) — wtedy JS nie rozciąga slidera na full-bleed i nie włącza peeka na ultra-wide.

## Panel administracyjny

Menu: **Coody → Slider**

| Pozycja | Opis |
|---------|------|
| **Konfiguracja** | Ustawienia modułu |
| **Slajdy** | CRUD slajdów |

### Konfiguracja

- **Włączony** — globalne włączenie/wyłączenie slidera.
- **Czas slajdu (ms)** — minimalnie 1000 ms; czas autoplay karuzeli.
- **Nawigacja: strzałki + kropki** — gdy włączone: strzałki lewo/prawo na slajdzie i kropki na dole zamiast paska z nazwami slajdów. Style w module są ogólne (łatwe do nadpisania w motywie).

Zapis konfiguracji działa w **multistore** (wartość trafia do wszystkich sklepów).

- **Układ** — *Pełna szerokość* (od krawędzi do krawędzi) albo *W kontenerze* (szerokość treści strony, zaokrąglone rogi, naturalna wysokość grafiki).
- **Kolor akcentu** — domyślny kolor przycisków i naklejek w edytorze (domyślnie `#1d2f67`).
- **Animacja napisów** — warstwy wjeżdżają przy zmianie slajdu (wyłączane automatycznie przy `prefers-reduced-motion`).

### Zarządzanie slajdami

Formularz slajdu to jeden ekran edytora: pasek narzędzi, podgląd slajdu z paskiem warstw pod spodem (klik — zaznacz, oko — widoczność na urządzeniu) i panel boczny z przełącznikiem **Warstwa / Slajd**:

- **Warstwa** — ustawienia zaznaczonej warstwy (treść, rozmiar tekstu, wyśrodkowanie, wygląd, animacja; w nagłówku: na wierzch / pod spód, duplikuj, usuń).
- **Slajd** — aktywny, grafika desktop (zalecane 2592 × 900 px) i mobile (opcjonalnie, ok. 1500 × 970 px), nazwa slajdu (lista i pasek nawigacji), link całego slajdu, tekst alt. Panel otwiera się też po kliknięciu w puste miejsce slajdu.

Cały slajd jest **osobny dla każdego języka** (jak pola językowe PrestaShop): własne grafiki i własny układ warstw. W edytorze jest przełącznik języka i „Skopiuj z języka”. Brak grafik w danym języku → na froncie użyty zostanie cały slajd z języka domyślnego.

Dostępne akcje na liście: edycja, duplikacja, usuwanie, zmiana kolejności (pozycja).

### Edytor slajdu (warstwy)

Napisy układa się bezpośrednio na podglądzie slajdu:

- **Warstwy**: *Tekst* (nadtytuł, nagłówek, podtytuł, opis, naklejka), *Przycisk* (pełny, jasny, obrys, link), *Obraz* (PNG/JPG/WebP/GIF — logo, naklejka; zachowuje przezroczystość), *Kształt* (jasna / ciemna karta z rozmyciem, pasek).
- **Przeciąganie** myszą z przyciąganiem do marginesów, środka i innych warstw (Alt — bez przyciągania), strzałki = przesunięcie (Shift — większy krok). Położenie ustawia się tylko myszą; w panelu są przyciski *Środek poziomo / pionowo*.
- **Uchwyty**: z prawej — szerokość; w rogu warstwy tekstowej / przycisku — rozmiar tekstu (skalowanie), obrazu — szerokość; kształt — szerokość i wysokość. Rozmiar tekstu także suwakiem i A− / A+.
- **Zoom podglądu** (lupa −/+, Ctrl + kółko myszy) — do precyzyjnej pracy z małym tekstem.
- **Dwuklik** lub Enter — edycja tekstu na slajdzie. Delete — usuń, Ctrl+D — duplikuj, Ctrl+Z / Ctrl+Shift+Z — cofnij / ponów.
- **Komputer / Telefon** — osobne położenie, szerokość, rozmiar tekstu i widoczność dla każdego urządzenia. *Ułóż automatycznie* ustawia warstwy na telefonie jedna pod drugą.
- **Ustawienia warstwy**: treść (duże pole na górze panelu), link (nowa karta), kolor, tło, krycie, grubość, wyrównanie, interlinia, odstęp liter, wersaliki, cień, zaokrąglenie; animacja wejścia (efekt, opóźnienie, czas) — odtwarza się od razu po zmianie.
- **Przyciemnienie zdjęcia** pod warstwami (od lewej / prawej / dołu / góry / całe), osobno dla komputera i telefonu, z siłą i kolorem.

Rozmiary w edytorze odnoszą się do szerokości referencyjnej (komputer 1296 px, telefon 375 px); na froncie warstwy skalują się proporcjonalnie ze slajdem (jednostki `cqi`), więc układ wygląda tak samo na każdej szerokości.

Dane warstw: kolumna `layers` (JSON) w `ps_coody_homeslider_slide_lang`, normalizowana przez `CoodyHomeSlideLayers` przy zapisie i renderze.

## Zachowanie na froncie

### Nawigacja — tryb tytułów (domyślny)
- Dolny pasek: strzałki + nazwy slajdów.

### Nawigacja — tryb strzałki + kropki
- Strzałki po bokach slajdu, kropki na dole (Owl dots).
- Klasa sekcji: `coody-homeslider--arrows-dots`.

### Desktop (768–1920px)
- Jeden pełny slajd na szerokość.
- Autoplay z pauzą po najechaniu.

### Mobile (≤767px)
- W trybie tytułów pasek nawigacji jest ukryty (pełny ekran / peek zależnie od layoutu).
- W trybie strzałki + kropki strzałki i kropki pozostają widoczne.
- Brak osobnej grafiki mobile → używana grafika desktop.

### Ultra-wide (>1920px)
- Środkowy slajd max 1920px, po bokach widać fragmenty sąsiednich slajdów (wyłączone w trybie `coody-homeslider--contained`).

## Dostosowanie w motywie (opcjonalne)

Moduł nie wymaga zmian w motywie. Przykład odstępów tylko na swoim sklepie:

```css
@media (max-width: 767px) {
  section.coody-homeslider {
    margin-top: 3rem;
    margin-bottom: 3rem;
  }
}
```

Przykład nadpisania styli trybu strzałki + kropki:

```css
section.coody-homeslider.coody-homeslider--arrows-dots button.coody-homeslider__arrow {
  background: #fff;
}
```

Marginesy mobile **nie są** częścią modułu — każdy sklep może je ustawić osobno.

## Struktura plików

```
coody_homeslider/
├── coody_homeslider.php          # Główna klasa modułu
├── classes/CoodyHomeSlide.php    # Model slajdu (ObjectModel)
├── classes/CoodyHomeSlideLayers.php # Warstwy: normalizacja JSON, render, migracja
├── controllers/admin/            # Parent / Konfiguracja / Slajdy
├── views/
│   ├── css/front.css             # Style slidera, nawigacji i warstw
│   ├── css/admin-slide.css       # Edytor warstw (BO)
│   ├── js/admin-slide.js         # Edytor warstw (BO)
│   ├── css/owl.carousel.min.css  # Owl Carousel (wbudowany)
│   ├── js/front.js               # Logika karuzeli i breakpointów
│   ├── js/owl.carousel.min.js    # Owl Carousel (wbudowany)
│   └── templates/hook/slider.tpl, _caption.tpl (warstwy)
├── img/                          # Grafiki slajdów + placeholder.svg
├── img/layers/                   # Obrazy warstw (logo, naklejki)
├── sql/                          # Tabele bazy danych
└── upgrade/                      # Skrypty aktualizacji
```

## Baza danych

Tabele tworzone przy instalacji:

- `ps_coody_homeslider_slide` — slajdy (aktywność, pozycja)
- `ps_coody_homeslider_slide_lang` — tłumaczenia i grafiki
- `ps_coody_homeslider` — powiązanie slajd ↔ sklep (multistore)

## Aktualizacja

1. Nadpisz folder modułu nową wersją.
2. W BO: **Moduły** → znajdź moduł → **Aktualizuj** (jeśli dostępne).
3. Wyczyść cache.

Historia zmian: [CHANGELOG.md](CHANGELOG.md)

## Licencja

Proprietary — © 2026 coody.it
