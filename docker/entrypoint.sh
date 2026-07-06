#!/bin/sh
set -eu

until nc -z "${DB_HOST:-db}" "${DB_PORT:-3306}"; do
  echo "Waiting for MySQL..."
  sleep 2
done

echo "Preparing Prisma client, schema, and seed data..."
npm run db:prepare

echo "Starting backend..."
exec npm run dev
