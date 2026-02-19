#!/usr/bin/env sh
# Smoke test: create job, poll until complete, verify MP4 and /terms, /privacy
# Usage: BASE=https://nonfictionfooty-site.pages.dev ./scripts/smoke-test.sh

set -e
BASE="${BASE:-https://nonfictionfooty-site.pages.dev}"

echo "Create job..."
RES=$(curl -s -X POST "$BASE/api/generate" -H "Content-Type: application/json" -d '{"topic":"smoke test"}')
JOB_ID=$(echo "$RES" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)
if [ -z "$JOB_ID" ]; then echo "No jobId in response: $RES"; exit 1; fi
echo "Job: $JOB_ID"

echo "Poll until completed..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  STATUS=$(curl -s "$BASE/api/jobs/$JOB_ID" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  echo "  $STATUS"
  [ "$STATUS" = "completed" ] && break
  [ "$STATUS" = "failed" ] && echo "Job failed" && exit 1
  sleep 2
done
[ "$STATUS" != "completed" ] && echo "Timeout" && exit 1

echo "Download MP4..."
curl -s -o /tmp/nff-smoke.mp4 "$BASE/api/jobs/$JOB_ID/download"
if [ ! -s /tmp/nff-smoke.mp4 ]; then echo "MP4 empty or missing"; exit 1; fi
echo "MP4 OK ($(wc -c < /tmp/nff-smoke.mp4) bytes)"

echo "Check /terms and /privacy..."
T=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/terms")
P=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/privacy")
[ "$T" = "200" ] && [ "$P" = "200" ] || { echo "terms=$T privacy=$P"; exit 1; }
echo "terms=$T privacy=$P OK"
echo "Smoke test passed."
