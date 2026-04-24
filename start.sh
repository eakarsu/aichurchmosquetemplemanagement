#!/bin/bash

# ============================================
# Sacred Grounds Management - Startup Script
# AI Church/Mosque/Temple Management System
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${PURPLE}${BOLD}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║                                                      ║"
echo "║     🕌  Sacred Grounds Management System  ⛪         ║"
echo "║     AI-Powered Religious Organization Manager        ║"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Project root directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
    echo -e "${RED}✗ .env file not found! Please create one from .env.example${NC}"
    exit 1
fi

# ============================================
# Function: Kill processes on specific ports
# ============================================
cleanup_ports() {
    echo -e "\n${YELLOW}🔧 Cleaning up ports...${NC}"

    local ports=("3000" "4000")

    for port in "${ports[@]}"; do
        local pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo -e "${YELLOW}  Killing processes on port $port (PIDs: $pids)${NC}"
            echo "$pids" | xargs kill -9 2>/dev/null || true
            sleep 1
        else
            echo -e "${GREEN}  Port $port is free${NC}"
        fi
    done

    echo -e "${GREEN}✓ Ports cleaned${NC}"
}

# ============================================
# Function: Check and setup PostgreSQL
# ============================================
setup_database() {
    echo -e "\n${YELLOW}🗄️  Setting up database...${NC}"

    # Check if PostgreSQL is running
    if ! pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} > /dev/null 2>&1; then
        echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || {
                echo -e "${RED}✗ Could not start PostgreSQL. Please start it manually.${NC}"
                exit 1
            }
        else
            sudo systemctl start postgresql 2>/dev/null || {
                echo -e "${RED}✗ Could not start PostgreSQL. Please start it manually.${NC}"
                exit 1
            }
        fi
        sleep 2
    fi
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"

    # Create database if it doesn't exist
    echo -e "${YELLOW}  Creating database '${DB_NAME}'...${NC}"
    PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
        PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -c "CREATE DATABASE ${DB_NAME}" 2>/dev/null || true
    echo -e "${GREEN}✓ Database ready${NC}"
}

# ============================================
# Function: Install dependencies
# ============================================
install_dependencies() {
    echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"

    # Backend dependencies
    echo -e "${CYAN}  Installing backend dependencies...${NC}"
    cd "$PROJECT_DIR/backend"
    npm install --silent 2>&1 | tail -1
    echo -e "${GREEN}  ✓ Backend dependencies installed${NC}"

    # Frontend dependencies
    echo -e "${CYAN}  Installing frontend dependencies...${NC}"
    cd "$PROJECT_DIR/frontend"
    npm install --silent 2>&1 | tail -1
    echo -e "${GREEN}  ✓ Frontend dependencies installed${NC}"

    cd "$PROJECT_DIR"
}

# ============================================
# Function: Seed the database
# ============================================
seed_database() {
    echo -e "\n${YELLOW}🌱 Seeding database...${NC}"
    cd "$PROJECT_DIR/backend"
    node seed.js
    echo -e "${GREEN}✓ Database seeded successfully${NC}"
    cd "$PROJECT_DIR"
}

# ============================================
# Function: Start the application
# ============================================
start_application() {
    echo -e "\n${YELLOW}🚀 Starting application...${NC}"

    # Start backend with nodemon for hot reload
    echo -e "${CYAN}  Starting backend server (port 4000)...${NC}"
    cd "$PROJECT_DIR/backend"
    npx nodemon --watch . --ext js,json server.js &
    BACKEND_PID=$!
    echo -e "${GREEN}  ✓ Backend started (PID: $BACKEND_PID)${NC}"

    # Start frontend with Vite (has built-in HMR)
    echo -e "${CYAN}  Starting frontend dev server (port 3000)...${NC}"
    cd "$PROJECT_DIR/frontend"
    npx vite --port 3000 &
    FRONTEND_PID=$!
    echo -e "${GREEN}  ✓ Frontend started (PID: $FRONTEND_PID)${NC}"

    cd "$PROJECT_DIR"

    # Wait for servers to be ready
    sleep 3

    echo -e "\n${GREEN}${BOLD}════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}${BOLD}  ✅ Application is running!${NC}"
    echo -e "${GREEN}${BOLD}════════════════════════════════════════════════${NC}"
    echo -e ""
    echo -e "  ${CYAN}Frontend:${NC}  http://localhost:3000"
    echo -e "  ${CYAN}Backend:${NC}   http://localhost:4000"
    echo -e ""
    echo -e "  ${YELLOW}Login Credentials:${NC}"
    echo -e "  Email:    ${BOLD}admin@temple.org${NC}"
    echo -e "  Password: ${BOLD}password123${NC}"
    echo -e ""
    echo -e "  ${PURPLE}Press Ctrl+C to stop all services${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════${NC}"
}

# ============================================
# Function: Cleanup on exit
# ============================================
cleanup() {
    echo -e "\n\n${YELLOW}🛑 Shutting down...${NC}"

    # Kill background processes
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true

    # Clean up ports
    cleanup_ports

    echo -e "${GREEN}✓ Application stopped. Goodbye! 🙏${NC}"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# ============================================
# Main execution
# ============================================
cleanup_ports
setup_database
install_dependencies
seed_database
start_application

# Wait for background processes
wait
