#!/bin/sh
set -e
bun run db:migrate
exec "$@"
