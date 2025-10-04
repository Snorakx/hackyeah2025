# Symulator Emerytalny ZUS

Narzędzie edukacyjne do prognozowania wysokości emerytury - projekt na Hackathon 2025

## Opis projektu

Symulator emerytalny to aplikacja webowa stworzona dla Zakładu Ubezpieczeń Społecznych, która umożliwia użytkownikom prognozowanie wysokości ich przyszłej emerytury. Aplikacja została zbudowana w Vue.js 3 i spełnia wszystkie wymagania określone w specyfikacji.

## Funkcjonalności

### ✅ Wymagania podstawowe

- **Pulpit podstawowy** - wprowadzenie oczekiwanej emerytury z porównaniem do średnich
- **Symulacja emerytury** - formularz z danymi obowiązkowymi i fakultatywnymi
- **Wyniki** - wyświetlanie emerytury rzeczywistej i urealnionej
- **Dashboard zaawansowany** - rozszerzone opcje prognozowania
- **Pobieranie raportu** - eksport do PDF i Excel
- **Kod pocztowy** - opcjonalne zbieranie danych regionalnych
- **Raportowanie zainteresowania** - panel administracyjny

### 🎨 Design i dostępność

- Kolory zgodne z Księgą Znaku ZUS
- Zgodność ze standardem WCAG 2.0
- Responsywny design
- Wsparcie dla trybu wysokiego kontrastu
- Wsparcie dla preferencji ruchu (reduced motion)

### 📊 Funkcjonalności zaawansowane

- Wprowadzanie konkretnych kwot wynagrodzeń z przeszłości
- Prognozy wynagrodzeń z indeksacją lub konkretnymi kwotami
- Zarządzanie okresami choroby w przeszłości i przyszłości
- Wizualizacja wzrostu konta ZUS w czasie
- Analiza regionalna użycia symulatora
- Eksport danych do Excel

## Technologie

- **Vue.js 3** - framework frontend
- **Vue Router** - routing
- **Chart.js** - wykresy i wizualizacje
- **XLSX** - eksport do Excel
- **Vite** - bundler i dev server

## Instalacja i uruchomienie

### Wymagania

- Node.js 16+
- npm lub yarn

### Kroki instalacji

1. **Zainstaluj zależności:**

```bash
npm install
```

2. **Uruchom serwer deweloperski:**

```bash
npm run dev
```

3. **Otwórz aplikację:**
   Aplikacja będzie dostępna pod adresem `http://localhost:3000`

### Budowanie dla produkcji

```bash
npm run build
```

Zbudowane pliki znajdą się w folderze `dist/`.

## Struktura projektu

```
src/
├── components/          # Komponenty Vue
│   ├── Dashboard.vue           # Pulpit podstawowy
│   ├── Simulation.vue          # Formularz symulacji
│   ├── Results.vue             # Wyniki symulacji
│   ├── AdvancedDashboard.vue   # Dashboard zaawansowany
│   └── AdminPanel.vue          # Panel administracyjny
├── utils/              # Narzędzia pomocnicze
│   └── reportGenerator.js      # Generator raportów
├── App.vue             # Główny komponent aplikacji
└── main.js             # Punkt wejścia aplikacji
```

## Użycie aplikacji

### 1. Pulpit podstawowy

- Wprowadź oczekiwaną wysokość emerytury
- Zobacz porównanie ze średnimi emeryturami w Polsce
- Przeczytaj ciekawostki o emeryturach

### 2. Symulacja emerytury

- Wypełnij dane obowiązkowe: wiek, płeć, wynagrodzenie, lata pracy
- Opcjonalnie wprowadź dane o koncie ZUS
- Wybierz czy uwzględnić zwolnienia lekarskie

### 3. Wyniki

- Zobacz prognozowaną emeryturę rzeczywistą i urealnioną
- Porównaj ze średnią krajową
- Sprawdź stopę zastąpienia
- Zobacz jak dodatkowe lata pracy wpłyną na emeryturę

### 4. Dashboard zaawansowany

- Wprowadź konkretne wynagrodzenia z przeszłości
- Zaplanuj przyszłe wynagrodzenia
- Zarządzaj okresami choroby
- Zobacz wizualizację wzrostu konta ZUS

### 5. Panel administracyjny

- Zobacz statystyki użycia
- Filtruj dane według różnych kryteriów
- Eksportuj raporty do Excel
- Analizuj dane regionalne

## Specyfikacja techniczna

### Kolory ZUS

- Pomarańczowy: `rgb(255, 179, 79)`
- Zielony: `rgb(0, 153, 63)`
- Szary: `rgb(190, 195, 206)`
- Niebieski: `rgb(63, 132, 210)`
- Ciemnoniebieski: `rgb(0, 65, 110)`
- Czerwony: `rgb(240, 94, 94)`
- Czarny: `rgb(0, 0, 0)`

### Dostępność (WCAG 2.0)

- Kontrast kolorów zgodny z wytycznymi
- Obsługa klawiatury
- Wsparcie dla czytników ekranu
- Elastyczne rozmiary czcionek
- Wsparcie dla trybu wysokiego kontrastu

## Licencja

MIT License - projekt stworzony na Hackathon 2025

## Autorzy

Zespół Hackathon 2025 - Gabinet Prezesa ZUS
