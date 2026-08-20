#!/bin/bash
set -e
cd "$(dirname "$0")/frontend"
npm install
npm run dev -- --host 0.0.0.0 --port 3000
