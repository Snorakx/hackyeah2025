# 🚀 AI App Framework

Uniwersalny framework do tworzenia aplikacji opartych na AI z konfigurowalnym onboardinguem i dynamicznymi widokami.

## ⚡ Quick Start

### 1. **Sprawdź wymagania**
```bash
./cli.sh check
```

### 2. **Pierwszy setup**
```bash
./cli.sh setup
```

### 3. **Uruchom aplikację**
```bash
./cli.sh start
```

## 📱 Dostępne aplikacje

- **Finance App** - Zarządzanie finansami z AI
- **Fitness App** - Trening i żywienie z AI  
- **Travel App** - Planowanie podróży z AI
- **Wellbeing App** - Wellness i zdrowie psychiczne z AI

## 🛠️ Komendy CLI

```bash
./cli.sh help              # Pokaż wszystkie komendy
./cli.sh check             # Sprawdź wymagania systemowe
./cli.sh setup             # Pierwszy setup
./cli.sh start             # Uruchom wszystko
./cli.sh create-app        # Stwórz nową aplikację
./cli.sh frontend [app]    # Uruchom konkretną aplikację
./cli.sh status            # Sprawdź status serwisów
./cli.sh stop              # Zatrzymaj wszystko
```

## 📋 Wymagania

- **Node.js** 18+
- **Docker** (dla Supabase)
- **Git** (opcjonalnie)

## 🌐 URL-e po uruchomieniu

- **Finance App**: `http://localhost:3000`
- **Fitness App**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`
- **Supabase Studio**: `http://localhost:54323`

## 📚 Dokumentacja

- **[FIRST_START.md](./FIRST_START.md)** - Szczegółowy przewodnik pierwszego uruchomienia
- **[CLI_USAGE.md](./coderno-ai-app-core/CLI_USAGE.md)** - Dokumentacja CLI
- **[FRAMEWORK_SUMMARY.md](./coderno-ai-app-core/FRAMEWORK_SUMMARY.md)** - Opis frameworka

## 🆘 Pomoc

Jeśli masz problemy:

1. **Sprawdź wymagania**: `./cli.sh check`
2. **Sprawdź status**: `./cli.sh status`
3. **Zobacz logi**: `./cli.sh logs`
4. **Restart**: `./cli.sh restart`

## 🎯 Struktura projektu

```
hackyeah2025/
├── cli.sh                    # Główny CLI
├── cut-sprint-backend/       # Backend API
├── coderno-ai-app-core/      # Framework aplikacji
│   ├── apps/                 # Aplikacje
│   └── core/                 # Core framework
└── supabase/                 # Baza danych
```

## 🚀 Rozwój

### Tworzenie nowej aplikacji
```bash
./cli.sh create-app
```

### Uruchamianie konkretnej aplikacji
```bash
./cli.sh frontend fitness
```

### Debugging
```bash
./cli.sh logs postgres    # Logi bazy danych
./cli.sh logs             # Wszystkie logi
```

---

**Happy coding! 🎉**