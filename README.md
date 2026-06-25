# Delta Backend

Production-ready Node.js backend for the Delta Kebab restaurant platform.

## Overview

This backend provides:
- REST API endpoints for restaurants, auth, and menu data
- MySQL integration using `knex`
- TypeScript strict mode
- Socket.IO scaffolding for real-time updates
- Environment configuration and migrations

## Setup

1. Install Node.js 22.22.2
2. Copy `.env.example` to `.env`
3. Install packages:
   ```bash
   npm install
   ```
4. Run migrations:
   ```bash
   npm run migrate
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/config` - application configuration
- `src/database` - database connection
- `src/routes` - route definitions
- `src/services` - business logic
- `src/middleware` - HTTP middleware
- `src/sockets` - Socket.IO integration
- `migrations` - database schema migrations

## Notes

The project is intentionally bootstrapped to preserve the existing SQL schema and extend it with order, user, and chat support.
