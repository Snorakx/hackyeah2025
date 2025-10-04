# 🚀 First Start Guide - AI App Framework

Przewodnik pierwszego uruchomienia aplikacji AI App Framework.

## 📋 Wymagania

### System Requirements
- **Node.js** 18+ 
- **Docker** (dla Supabase)
- **Git**

### Sprawdź wymagania:
```bash
node --version    # Powinno być 18+
docker --version  # Docker musi być zainstalowany
```

## 🛠️ Setup - Pierwsze uruchomienie

### 1. **Sklonuj repozytorium**
```bash
git clone <repository-url>
cd hackyeah2025
```

### 2. **Uruchom pełny setup**
```bash
./cli.sh setup
```

To polecenie automatycznie:
- ✅ Sprawdzi Docker i Node.js
- ✅ Utworzy pliki `.env` 
- ✅ Zainstaluje wszystkie zależności
- ✅ Uruchomi Supabase

### 3. **Sprawdź status**
```bash
./cli.sh status
```

Powinieneś zobaczyć:
- ✅ Backend (3001): Running
- ✅ Supabase API (54321): Running  
- ✅ Supabase Studio (54323): Running
- 📱 Available Apps: finance, fitness

## 🎯 Dostępne aplikacje

### **Finance App** - Zarządzanie finansami
- Onboarding: dochody, wydatki, cele oszczędnościowe
- AI: analiza budżetu, porady inwestycyjne
- URL: `http://localhost:3000`

### **Fitness App** - Trening i żywienie  
- Onboarding: waga, wzrost, cele treningowe
- AI: analiza posiłków, plany treningowe
- URL: `http://localhost:5173`

## 🚀 Uruchamianie aplikacji

### **Opcja 1: Wszystko naraz**
```bash
./cli.sh start
```
Uruchamia backend + Supabase + pierwszą dostępną aplikację

### **Opcja 2: Konkretna aplikacja**
```bash
./cli.sh frontend finance    # Finance app
./cli.sh frontend fitness    # Fitness app
```

### **Opcja 3: Tylko backend**
```bash
./cli.sh backend
```

## 📁 Struktura projektu

```
hackyeah2025/
├── cli.sh                    # Główny CLI
├── cut-sprint-backend/       # Backend API
├── coderno-ai-app-core/      # Framework aplikacji
│   ├── apps/                 # Aplikacje
│   │   ├── finance/          # Finance app
│   │   └── fitness/          # Fitness app
│   └── core/                 # Core framework
└── supabase/                 # Baza danych
```

## 🔧 Konfiguracja środowiska

### **Backend (.env)**
```bash
# cut-sprint-backend/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-jwt-secret
```

### **Supabase**
- **API URL**: `http://localhost:54321`
- **Studio URL**: `http://localhost:54323` 
- **Database**: `postgresql://postgres:postgres@localhost:54322/postgres`

## 🆕 Tworzenie nowej aplikacji

```bash
./cli.sh create-app
```

Dostępne szablony:
1. **Fitness Tracker** - AI-powered fitness tracking
2. **Finance Tracker** - AI-powered finance management  
3. **Travel Planner** - AI-powered travel planning
4. **Wellbeing Tracker** - AI-powered wellness tracking

## 🐛 Rozwiązywanie problemów

### **Docker nie działa**
```bash
# Sprawdź czy Docker jest uruchomiony
docker info

# Jeśli nie, uruchom Docker Desktop
```

### **Porty zajęte**
```bash
# Sprawdź co używa portów
lsof -i :3001  # Backend
lsof -i :54321  # Supabase API
lsof -i :54323  # Supabase Studio

# Zabij procesy jeśli potrzeba
kill -9 <PID>
```

### **Błędy zależności**
```bash
# Wyczyść i zainstaluj ponownie
rm -rf node_modules package-lock.json
npm install
```

### **Supabase nie startuje**
```bash
# Zatrzymaj i uruchom ponownie
./cli.sh supabase:stop
./cli.sh supabase
```

## 📊 Monitoring

### **Status serwisów**
```bash
./cli.sh status
```

### **Logi**
```bash
./cli.sh logs              # Wszystkie serwisy
./cli.sh logs postgres     # Tylko baza danych
```

### **Restart**
```bash
./cli.sh restart           # Restart wszystkiego
./cli.sh stop              # Zatrzymaj wszystko
```

## 🔄 Workflow development

### **1. Pierwszy setup**
```bash
./cli.sh setup
```

### **2. Rozwój aplikacji**
```bash
./cli.sh start             # Uruchom wszystko
# Edytuj kod w apps/[app-name]/src/
```

### **3. Nowa aplikacja**
```bash
./cli.sh create-app        # Stwórz nową aplikację
./cli.sh frontend [name]   # Uruchom konkretną aplikację
```

### **4. Debugging**
```bash
./cli.sh logs              # Sprawdź logi
./cli.sh status            # Sprawdź status
```

## 🌐 Dostępne URL-e

Po uruchomieniu `./cli.sh start`:

- **Finance App**: `http://localhost:3000`
- **Fitness App**: `http://localhost:5173` 
- **Backend API**: `http://localhost:3001`
- **Supabase Studio**: `http://localhost:54323`
- **Supabase API**: `http://localhost:54321`

## 🆘 Pomoc

```bash
./cli.sh help              # Pokaż wszystkie komendy
./cli.sh status            # Sprawdź status
```

## 🎉 Gotowe!

Jeśli wszystko działa, powinieneś móc:
1. Otworzyć aplikację w przeglądarce
2. Przejść przez onboarding
3. Zobaczyć dane w Supabase Studio
4. Używać AI features

**Happy coding! 🚀**
