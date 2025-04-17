#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Hearing Aid Repair Management System...${NC}\n"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ before continuing.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js version 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Creating .env.local file...${NC}"
    cp .env.example .env.local
    echo -e "${GREEN}Created .env.local file. Please update it with your credentials.${NC}"
fi

# Create Supabase migrations directory
mkdir -p supabase/migrations

echo -e "\n${GREEN}Setup completed!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Update .env.local with your credentials"
echo "2. Set up your Supabase project and run the migrations"
echo "3. Set up Clerk authentication"
echo "4. Set up reCAPTCHA"
echo -e "5. Run ${GREEN}npm run dev${NC} to start the development server" 