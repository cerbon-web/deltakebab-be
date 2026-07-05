#!/bin/sh
set -eu

until nc -z "${DB_HOST:-db}" "${DB_PORT:-3306}"; do
  echo "Waiting for MySQL..."
  sleep 2
done

echo "Generating Prisma client..."
npx prisma generate

echo "MySQL is up. Syncing Prisma schema..."
npx prisma db push

echo "Ensuring seed data exists..."
npx prisma db seed

echo "Starting backend..."
exec npm run dev
