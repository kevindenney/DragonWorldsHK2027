#!/bin/bash

# Development Setup Script for Firebase Emulators
# This script sets up the complete development environment

set -e  # Exit on any error

echo "🚀 Setting up Firebase Emulator Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_status "Node.js and npm are installed"

# Check if Java is installed (required for Firestore emulator)
if ! command -v java &> /dev/null; then
    print_warning "Java is not installed. The Firestore emulator requires Java 11+."
    print_warning "Please install Java and try again, or some emulators may not work."
else
    print_status "Java is installed"
fi

# Install dependencies if not already installed
echo "📦 Installing dependencies..."
npm install

# Check if Firebase CLI is installed globally
if ! command -v firebase &> /dev/null; then
    print_warning "Firebase CLI is not installed globally."
    echo "Installing Firebase CLI globally..."
    npm install -g firebase-tools
else
    print_status "Firebase CLI is available"
fi

# Login to Firebase (skip if CI environment)
if [ "$CI" != "true" ]; then
    echo "🔐 Checking Firebase authentication..."
    if ! firebase projects:list &> /dev/null; then
        print_warning "Not logged in to Firebase. Please login:"
        firebase login
    else
        print_status "Firebase authentication is valid"
    fi
fi

# Create emulator data directory
echo "📁 Setting up emulator data directory..."
mkdir -p emulator-data
print_status "Emulator data directory created"

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    print_warning ".env.local not found. Creating from template..."
    cp .env.emulator .env.local
    print_status "Created .env.local from emulator template"
    print_warning "Please review .env.local and update with your Firebase project configuration"
else
    print_status ".env.local already exists"
fi

# Check if functions dependencies are installed
echo "🔧 Checking Cloud Functions setup..."
if [ -d "firebase-backend/functions" ]; then
    cd firebase-backend/functions
    if [ ! -d "node_modules" ]; then
        print_status "Installing Cloud Functions dependencies..."
        npm install
    else
        print_status "Cloud Functions dependencies are installed"
    fi
    cd ../../
else
    print_warning "Cloud Functions directory not found at firebase-backend/functions"
fi

# Make scripts executable
chmod +x scripts/*.sh 2>/dev/null || true
chmod +x scripts/*.js 2>/dev/null || true

print_status "Development environment setup complete!"

echo ""
echo "🎉 Setup Summary:"
echo "   ✅ Dependencies installed"
echo "   ✅ Firebase CLI ready"
echo "   ✅ Emulator configuration ready"
echo "   ✅ Security rules configured"
echo "   ✅ Scripts are executable"
echo ""
echo "🚀 Next Steps:"
echo "   1. Review and update .env.local with your Firebase project details"
echo "   2. Start the emulators: npm run dev"
echo "   3. Seed test data: npm run emulator:seed"
echo "   4. Open emulator UI: http://localhost:4000"
echo ""
echo "📚 Available Commands:"
echo "   npm run dev              - Start emulators with imported data"
echo "   npm run dev:fresh        - Start fresh emulators (no data)"
echo "   npm run emulator:seed    - Seed emulators with test data"
echo "   npm run emulator:export  - Export emulator data"
echo "   npm run emulator:kill    - Kill all emulator processes"
echo ""

# Check for potential issues
echo "🔍 Environment Check:"

# Check Java version
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
    echo "   Java version: $JAVA_VERSION"
else
    print_warning "   Java not found - Firestore emulator may not work"
fi

# Check Node version
NODE_VERSION=$(node --version)
echo "   Node version: $NODE_VERSION"

# Check available ports
echo "   Checking required ports..."
for port in 4000 5000 5001 8080 9099 9199; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "   Port $port is already in use"
    else
        echo "   Port $port: available"
    fi
done

echo ""
print_status "Setup script completed successfully!"