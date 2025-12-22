#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until nc -z postgres 5432; do
  echo "Database is unavailable - sleeping"
  sleep 1
done

echo "Database is ready! Applying Prisma schema..."
npx prisma db push --accept-data-loss || true

echo "Starting NestJS application..."
exec npm run start:prod

