#!/bin/bash
echo "Running full type check..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20 > /dev/null

# Run tsc and capture output, but don't fail the script immediately
# We want to see all errors
npx tsc --noEmit
echo "Type check complete."
