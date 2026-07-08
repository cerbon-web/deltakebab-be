#!/bin/sh
set -eu

until nc -z "${DB_HOST:-db}" "${DB_PORT:-3306}"; do
  echo "Waiting for MySQL..."
  sleep 2
done

echo "Checking database state..."
if node scripts/check-db-empty.js; then
  echo "Database is empty. Preparing Prisma client and schema..."
  npm run db:prepare

  echo "Applying database seed..."
  npm run db:seed
else
  echo "Database already has tables. Skipping Prisma prepare and seed."
fi

echo "Starting backend..."
# When entrypoint already ran the Prisma seed, prevent the app bootstrap from running it again.
SKIP_PRISMA_SEED=true exec npm run dev
