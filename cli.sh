#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# CLI Version
CLI_VERSION="2.0.0"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🚀 $1${NC}"
    echo "======================================"
}

print_subheader() {
    echo -e "${CYAN}📋 $1${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_status "Docker is running"
}

# Function to check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ required. Current version: $(node --version)"
        exit 1
    fi
    
    print_status "Node.js $(node --version) is available"
}

# Function to check system requirements
check_requirements() {
    print_subheader "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "❌ Node.js is not installed"
        print_info "Install from: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "❌ Node.js 18+ required. Current: $(node --version)"
        print_info "Update from: https://nodejs.org/"
        exit 1
    fi
    print_status "✅ Node.js $(node --version)"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "❌ Docker is not installed"
        print_info "Install from: https://docker.com/"
        exit 1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        print_error "❌ Docker is not running"
        print_info "Start Docker Desktop and try again"
        exit 1
    fi
    print_status "✅ Docker is running"
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_warning "⚠️  Git is not installed (optional)"
    else
        print_status "✅ Git is available"
    fi
    
    print_status "All requirements met!"
}

# Function to setup environment
setup_env() {
    print_subheader "Setting up environment files..."
    
    # Setup backend environment
    if [ ! -f "cut-sprint-backend/.env" ]; then
        if [ -f "cut-sprint-backend/env.example" ]; then
            cp cut-sprint-backend/env.example cut-sprint-backend/.env
            print_status "Backend .env created from env.example"
        else
            print_warning "Backend env.example not found"
        fi
    else
        print_info "Backend .env already exists"
    fi
    
    # Setup core framework environment (optional)
    if [ ! -f "coderno-ai-app-core/.env" ]; then
        print_info "Core framework uses default configuration"
        print_info "No .env file needed for core framework"
    else
        print_info "Core framework .env already exists"
    fi
    
    # Check if .env files are properly configured
    if [ -f "cut-sprint-backend/.env" ]; then
        print_status "Backend environment configured"
    else
        print_warning "Backend .env not found - some features may not work"
    fi
}

# Function to install dependencies
install_deps() {
    print_subheader "Installing dependencies..."
    
    # Backend dependencies
    print_info "Installing backend dependencies..."
    cd cut-sprint-backend
    npm install
    cd ..
    
    # Core framework dependencies
    print_info "Installing core framework dependencies..."
    cd coderno-ai-app-core
    npm install
    cd ..
    
    # Install dependencies for all apps
    print_info "Installing app dependencies..."
    if [ -d "coderno-ai-app-core/apps" ]; then
        for app_dir in coderno-ai-app-core/apps/*/; do
            if [ -f "${app_dir}package.json" ]; then
                print_info "Installing dependencies for $(basename "$app_dir")..."
                cd "$app_dir"
                npm install
                cd - > /dev/null
            fi
        done
    fi
    
    print_status "Dependencies installed"
}

# Function to start Supabase
start_supabase() {
    print_subheader "Starting Supabase services..."
    
    check_docker
    
    # Start Supabase local development environment
    supabase start
    
    print_info "Waiting for services to be ready..."
    sleep 5
    
    # Check if Supabase is running
    if supabase status > /dev/null 2>&1; then
        print_status "Supabase services are running"
        print_info "API URL: http://127.0.0.1:54321"
        print_info "Studio URL: http://127.0.0.1:54323"
    else
        print_error "Failed to start Supabase services"
        exit 1
    fi
}

# Function to stop Supabase
stop_supabase() {
    print_subheader "Stopping Supabase services..."
    
    supabase stop
    print_status "Supabase services stopped"
}

# Function to restart Supabase
restart_supabase() {
    print_subheader "Restarting Supabase services..."
    
    stop_supabase
    start_supabase
}

# Function to show status
show_status() {
    print_subheader "Service Status"
    
    echo ""
    echo "🐳 Docker Services:"
    docker-compose ps
    
    echo ""
    echo "🌐 Port Status:"
    
    # Check backend
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        print_status "Backend (3001): Running"
    else
        print_warning "Backend (3001): Not running"
    fi
    
    # Check Supabase API
    if curl -s http://localhost:54321 > /dev/null 2>&1; then
        print_status "Supabase API (54321): Running"
    else
        print_warning "Supabase API (54321): Not running"
    fi
    
    # Check Supabase Studio
    if curl -s http://localhost:54323 > /dev/null 2>&1; then
        print_status "Supabase Studio (54323): Running"
    else
        print_warning "Supabase Studio (54323): Not running"
    fi
    
    # Check PostgreSQL
    if curl -s http://localhost:5432 > /dev/null 2>&1; then
        print_status "PostgreSQL (5432): Running"
    else
        print_warning "PostgreSQL (5432): Not running"
    fi
    
    # Check available apps
    echo ""
    echo "📱 Available Apps:"
    if [ -d "coderno-ai-app-core/apps" ]; then
        for app_dir in coderno-ai-app-core/apps/*/; do
            app_name=$(basename "$app_dir")
            if [ -f "${app_dir}package.json" ]; then
                print_info "App: $app_name"
            fi
        done
    else
        print_warning "No apps found in coderno-ai-app-core/apps/"
    fi
}

# Function to create new app
create_app() {
    print_subheader "Creating new AI app..."
    
    check_node
    
    cd coderno-ai-app-core
    print_info "Starting AI App Generator..."
    node cli/create-app.js
    cd ..
    
    print_status "App creation completed!"
}

# Function to start frontend
start_frontend() {
    print_subheader "Starting frontend..."
    
    check_node
    
    # Check if specific app is requested
    if [ -n "$2" ]; then
        app_name="$2"
        app_path="coderno-ai-app-core/apps/$app_name"
        
        if [ -d "$app_path" ]; then
            cd "$app_path"
            print_info "Starting app: $app_name"
            print_info "App will be available at: http://localhost:5173"
            npm run dev
        else
            print_error "App '$app_name' not found in coderno-ai-app-core/apps/"
            exit 1
        fi
    else
        # Start the core framework app runner
        cd coderno-ai-app-core
        print_info "Starting AI App Core framework..."
        print_info "Available apps will be listed for selection"
        npm run dev
    fi
}

# Function to start backend
start_backend() {
    print_subheader "Starting backend..."
    
    check_node
    
    cd cut-sprint-backend
    print_info "Backend will be available at: http://localhost:3001"
    npm run dev
}

# Function to show logs
show_logs() {
    print_subheader "Showing logs..."
    
    if [ -z "$1" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$1"
    fi
}

# Function to clean up
cleanup() {
    print_subheader "Cleaning up..."
    
    print_warning "This will remove all containers and volumes. Are you sure? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        docker-compose down -v
        print_status "All containers and volumes removed"
    else
        print_info "Cleanup cancelled"
    fi
}

# Function to show help
show_help() {
    echo "AI App Framework CLI v$CLI_VERSION"
    echo ""
    echo "Usage: ./cli.sh [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  setup                    Setup the entire application (env, deps, supabase)"
    echo "  start                    Start all services (supabase + backend + core framework)"
    echo "  stop                     Stop all services"
    echo "  restart                  Restart all services"
    echo "  status                   Show status of all services"
    echo "  create-app               Create a new AI app"
    echo "  frontend [app-name]      Start specific app or core framework"
    echo "  backend                  Start backend only"
    echo "  supabase                 Start Supabase services only"
    echo "  supabase:stop           Stop Supabase services"
    echo "  supabase:restart        Restart Supabase services"
    echo "  logs                     Show logs (all services)"
    echo "  logs [service]           Show logs for specific service"
    echo "  cleanup                  Remove all containers and volumes"
    echo "  check                    Check system requirements"
    echo "  help                     Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./cli.sh check           # Check system requirements"
    echo "  ./cli.sh setup           # First time setup"
    echo "  ./cli.sh create-app      # Create new app"
    echo "  ./cli.sh start           # Start all services"
    echo "  ./cli.sh frontend fitness # Start specific app"
    echo "  ./cli.sh status          # Check status"
    echo "  ./cli.sh logs postgres  # View logs"
    echo ""
    echo "Available Apps:"
    if [ -d "coderno-ai-app-core/apps" ]; then
        for app_dir in coderno-ai-app-core/apps/*/; do
            app_name=$(basename "$app_dir")
            if [ -f "${app_dir}package.json" ]; then
                echo "  - $app_name"
            fi
        done
    else
        echo "  No apps found. Run setup first."
    fi
    echo ""
}

# Function to start all services
start_all() {
    print_header "Starting AI App Framework"
    
    check_docker
    check_node
    setup_env
    install_deps
    start_supabase
    
    print_subheader "Starting application services..."
    
    # Start backend in background
    print_info "Starting backend..."
    cd cut-sprint-backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait a bit for backend to start
    sleep 5
    
    # Start core framework app runner
    print_info "Starting AI App Core framework..."
    cd coderno-ai-app-core
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    print_status "All services started!"
    echo ""
    echo "🌐 Access your application:"
    echo "   AI App Core: http://localhost:5173"
    echo "   Backend:     http://localhost:3001"
    echo "   Supabase API: http://localhost:54321"
    echo "   Supabase Studio: http://localhost:54323"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # Wait for user to stop
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
    wait
}

# Main CLI logic
case "$1" in
    "setup")
        print_header "Setting up AI App Framework"
        check_requirements
        setup_env
        install_deps
        start_supabase
        print_status "Setup complete!"
        print_info "🚀 Next steps:"
        print_info "  ./cli.sh start        # Start all services"
        print_info "  ./cli.sh create-app   # Create new app"
        print_info "  ./cli.sh status       # Check status"
        ;;
    "start")
        start_all
        ;;
    "stop")
        print_header "Stopping AI App Framework"
        stop_supabase
        pkill -f "npm run dev"
        print_status "All services stopped"
        ;;
    "restart")
        print_header "Restarting AI App Framework"
        stop_supabase
        pkill -f "npm run dev"
        sleep 2
        start_all
        ;;
    "status")
        show_status
        ;;
    "create-app")
        create_app
        ;;
    "frontend")
        start_frontend
        ;;
    "backend")
        start_backend
        ;;
    "supabase")
        start_supabase
        ;;
    "supabase:stop")
        stop_supabase
        ;;
    "supabase:restart")
        restart_supabase
        ;;
    "logs")
        show_logs "$2"
        ;;
    "cleanup")
        cleanup
        ;;
    "check")
        print_header "Checking System Requirements"
        check_requirements
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
