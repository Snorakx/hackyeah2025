#!/bin/bash

echo "🚀 Setting up Cut Sprint Application..."
echo "======================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Create .env files if they don't exist
if [ ! -f "cut-sprint-front/.env" ]; then
    echo "📝 Creating frontend .env file..."
    cp cut-sprint-front/env.example cut-sprint-front/.env
    echo "✅ Frontend .env created"
else
    echo "✅ Frontend .env already exists"
fi

if [ ! -f "cut-sprint-backend/.env" ]; then
    echo "📝 Creating backend .env file..."
    cp cut-sprint-backend/env.example cut-sprint-backend/.env
    echo "✅ Backend .env created"
else
    echo "✅ Backend .env already exists"
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd cut-sprint-front
npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd cut-sprint-backend
npm install
cd ..

# Start Supabase services
echo "🐘 Starting Supabase services..."
docker-compose up -d

echo "⏳ Waiting for Supabase services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Supabase services are running"
else
    echo "❌ Failed to start Supabase services"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo "=================="
echo ""
echo "📋 Next steps:"
echo "1. Start the backend API:"
echo "   cd cut-sprint-backend && npm run dev"
echo ""
echo "2. Start the frontend:"
echo "   cd cut-sprint-front && npm run dev"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:4321"
echo "   Backend API: http://localhost:3001"
echo "   Supabase Studio: http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "   Main README: ./README.md"
echo "   Frontend README: ./cut-sprint-front/README.md"
echo "   Backend README: ./cut-sprint-backend/README.md"
echo ""
