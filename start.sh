#!/bin/bash

# Prolog Tutor Startup Script
# Starts both backend and frontend development servers

echo "========================================="
echo "    Starting Prolog Tutor System"
echo "========================================="

# Check prerequisites
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command -v swipl &> /dev/null; then
    echo "❌ SWI-Prolog not found. Please install SWI-Prolog 8.4+"
    echo "   Ubuntu/Debian: sudo apt-get install swi-prolog"
    echo "   macOS: brew install swi-prolog"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ SWI-Prolog version: $(swipl --version | head -1)"

# Create necessary directories
echo "Creating directories..."
mkdir -p Backend/temp
mkdir -p Frontend/public

# Install dependencies if needed
echo "Checking dependencies..."
if [ ! -d "Backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd Backend && npm install
    cd ..
fi

if [ ! -d "Frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd Frontend && npm install
    cd ..
fi

# Start services
echo "Starting services..."

# Start backend in background
echo "Starting backend server (port 3000)..."
cd Backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 3

# Check if backend is running
if ! curl -s http://localhost:3000/api/health > /dev/null; then
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend is running"

# Start frontend in background
echo "Starting frontend development server (port 5173)..."
cd Frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "Waiting for frontend to start..."
sleep 5

echo "========================================="
echo "    Prolog Tutor is now running!"
echo "========================================="
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "⚙️  Backend API: http://localhost:3000"
echo "📊 Health check: http://localhost:3000/api/health"
echo "📈 Statistics: http://localhost:3000/api/stats"
echo ""
echo "Press Ctrl+C to stop all services"
echo "========================================="

# Trap Ctrl+C to clean up
trap 'cleanup' INT

cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Keep script running
wait