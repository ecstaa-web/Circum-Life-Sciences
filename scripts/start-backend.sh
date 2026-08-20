#!/bin/bash
set -e
cd "$(dirname "$0")/backend"
pip install -r requirements.txt -q
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
