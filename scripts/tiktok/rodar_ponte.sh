#!/bin/bash
# ponte TikTok LIVE → sala da live do js-jet. Uso: scripts/tiktok/rodar_ponte.sh [@usuario]
cd "$(dirname "$0")/../.." && exec scripts/tiktok/.venv/bin/python -u scripts/tiktok/ponte.py "${1:-@yodamalhumorado}"
