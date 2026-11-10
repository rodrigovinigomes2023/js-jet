#!/bin/bash
# sobe o servidor do js-jet (porta 8791) — jogo em http://<ip-do-notebook>:8791
cd "$(dirname "$0")" && exec servidor/.venv/bin/python servidor/servidor.py
