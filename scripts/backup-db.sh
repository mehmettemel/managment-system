#!/bin/bash

# Configuration
# TIP: Set your connection string in .env.local or pass it as argument
# DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
# Load from .env.local if available
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '#' | awk '/=/ {print $1}')
fi

# Fallback or Override
# DB_URL=${DATABASE_URL:-$1}

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set. Please set it in .env.local or export it."
  echo "Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
  exit 1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

echo "Starting backup to $BACKUP_FILE..."

# Check if pg_dump is installed
if command -v pg_dump &> /dev/null; then
    pg_dump "$DATABASE_URL" -f "$BACKUP_FILE" --schema=public --clean --if-exists
    
    if [ $? -eq 0 ]; then
      echo "✅ Backup successful: $BACKUP_FILE"
    else
      echo "❌ Backup failed."
      exit 1
    fi
elif command -v docker &> /dev/null; then
    echo "pg_dump not found locally, trying via Docker..."
    # Use postgres:15-alpine image to run pg_dump
    docker run --rm -it postgres:15-alpine pg_dump "$DATABASE_URL" --schema=public --clean --if-exists > "$BACKUP_FILE"
    
     if [ $? -eq 0 ]; then
      echo "✅ Backup successful (via Docker): $BACKUP_FILE"
    else
      echo "❌ Backup failed."
      exit 1
    fi
else
    echo "Error: Neither 'pg_dump' nor 'docker' is installed. Please install specific tools."
    exit 1
fi

# Keep only last 5 backups
ls -t $BACKUP_DIR/backup_*.sql | tail -n +6 | xargs -I {} rm -- {}
echo "Cleaned up old backups (kept last 5)."
