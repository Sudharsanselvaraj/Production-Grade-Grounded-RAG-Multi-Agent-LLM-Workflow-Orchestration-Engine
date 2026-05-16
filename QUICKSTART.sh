#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== GenAI RAG Orchestration Engine - Quick Start ===${NC}\n"

# Check prerequisites
echo "Checking prerequisites..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 found${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker found${NC}\n"

# Create .env if doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}\n"
fi

# Offer setup options
echo -e "${YELLOW}Choose setup option:${NC}"
echo "1. Docker Compose (Full stack, recommended)"
echo "2. Local development (Backend + Frontend locally, services in Docker)"
echo "3. Exit"

read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo -e "\n${YELLOW}Starting Docker Compose...${NC}\n"
        docker-compose up --build
        ;;
    2)
        echo -e "\n${YELLOW}Starting local development setup...${NC}\n"
        
        # Start Docker services
        echo -e "${YELLOW}Starting Docker services (DB, Qdrant, Ollama)...${NC}"
        docker-compose up db qdrant ollama -d
        sleep 15
        
        echo -e "\n${YELLOW}Installing backend dependencies...${NC}"
        pip install -r backend/requirements.txt
        
        echo -e "\n${YELLOW}Installing frontend dependencies...${NC}"
        cd frontend
        npm install
        cd ..
        
        echo -e "\n${GREEN}Setup complete!${NC}"
        echo -e "${YELLOW}Next steps:${NC}"
        echo "1. In Terminal 1: uvicorn backend.main:app --reload --port 8000"
        echo "2. In Terminal 2: cd frontend && npm run dev"
        echo "3. Frontend: http://localhost:3000"
        echo "4. Backend API: http://localhost:8000/docs"
        ;;
    3)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
