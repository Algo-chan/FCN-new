#!/bin/sh
set -e

echo "Running Prisma migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Starting server..."
exec node dist/server.js
