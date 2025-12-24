#!/bin/bash

###############################################################################
# Pre-Deployment Verification Script
# Bu script production'a gitmeden önce tüm kontrolleri yapar
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step counter
STEP=1
TOTAL_STEPS=7

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  🚀 Pre-Deployment Verification${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_step() {
    echo ""
    echo -e "${YELLOW}[$STEP/$TOTAL_STEPS]${NC} $1"
    STEP=$((STEP + 1))
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header

# Step 1: Check Node.js version
print_step "Checking Node.js version..."
NODE_VERSION=$(node -v)
if [[ $NODE_VERSION == v20* ]]; then
    print_success "Node.js version: $NODE_VERSION"
else
    print_error "Node.js version must be 20.x. Current: $NODE_VERSION"
    echo "Run: nvm use 20"
    exit 1
fi

# Step 2: TypeScript type checking
print_step "Running TypeScript type check..."
if npm run type-check; then
    print_success "TypeScript type check passed"
else
    print_error "TypeScript type check failed"
    exit 1
fi

# Step 3: ESLint
print_step "Running ESLint..."
if npm run lint; then
    print_success "ESLint check passed"
else
    print_error "ESLint check failed"
    echo "Run: npm run lint:fix to auto-fix"
    exit 1
fi

# Step 4: Prettier format check
print_step "Checking code formatting..."
if npm run format:check; then
    print_success "Code formatting check passed"
else
    print_error "Code formatting check failed"
    echo "Run: npm run format to fix formatting"
    exit 1
fi

# Step 5: Unit tests
print_step "Running unit tests..."
if npm run test:unit; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

# Step 6: Integration tests
print_step "Running integration tests..."
if npm run test:integration; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    exit 1
fi

# Step 7: Build
print_step "Building application..."
if npm run build; then
    print_success "Build successful"
else
    print_error "Build failed"
    exit 1
fi

# Summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ All pre-deployment checks passed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📦 Build output:${NC} .next/"
echo -e "${BLUE}📊 Coverage:${NC} coverage/"
echo ""
echo -e "${GREEN}Ready for deployment! 🚀${NC}"
echo ""

# Optional: Display next steps
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Push to main branch (git push origin main)"
echo "  2. Deploy to Vercel (automatic on push)"
echo "  3. Monitor deployment logs"
echo ""
