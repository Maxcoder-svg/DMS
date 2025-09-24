#!/bin/bash

# DMS Development Setup Script
echo "🚀 Setting up DMS (Discipline Management System)..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js $(node --version) and npm $(npm --version) detected"

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

echo "📦 Installing frontend dependencies..."
cd client && npm install && cd ..

# Setup environment file
if [ ! -f .env ]; then
    echo "🔧 Creating environment file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your Twilio and Firebase credentials!"
else
    echo "✅ Environment file already exists"
fi

# Create database directory
mkdir -p database

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your credentials"
echo "2. Start development servers:"
echo "   Terminal 1: npm run dev:server"
echo "   Terminal 2: npm run dev:client"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "📚 Read README.md for detailed setup instructions"