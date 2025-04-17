#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up the Hearing Aid Repair System...${NC}"

echo -e "\n${GREEN}1. Install dependencies${NC}"
npm install

echo -e "\n${GREEN}2. Set up Supabase${NC}"
echo "- Create a new Supabase project"
echo "- Run database migrations"
echo "- Update environment variables"

echo -e "\n${GREEN}3. Set up reCAPTCHA${NC}"
echo "- Get reCAPTCHA API keys"
echo "- Update environment variables"

echo -e "\n${GREEN}Setup complete!${NC}"
echo "Run 'npm run dev' to start the development server" 