#!/bin/zsh

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"

echo "Kontrollerar $BASE_URL"
echo

echo "1. Health"
curl -fsS "$BASE_URL/api/health"
echo
echo

echo "2. Mail health"
curl -fsS "$BASE_URL/api/mail-health"
echo
echo

echo "3. Scores"
curl -fsS "$BASE_URL/api/scores"
echo
echo

echo "4. TV page"
curl -fsS "$BASE_URL/tv" >/dev/null
echo "OK"
