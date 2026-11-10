# ✈️ js-jet

Novo projeto do Gomes (09/11/2026), nascido do show do caça do Ônibus da Ilha.

## 📁 Pastas
- `fonte/` — código do jogo (html/js)
- `tools/` — scripts (montar, gerar etc.)
- `testes/` — testes headless e fotos
- `backups/` — cópias antes de mudanças grandes
- `docs/` — ideias, planos, anotações
- `referencias/` — `caca_do_onibus.js` = caça, câmeras, flares e sons do jogo do ônibus (ponto de partida)
- `assets/sons`, `assets/texturas`

## ▶️ Rodar
- `./rodar.sh` (ou `systemd-run --user --unit=jsjet --collect ~/js-jet/rodar.sh`) → servidor na porta **8791**
- Notebook: http://localhost:8791 · Celular (mesmo Wi-Fi): http://192.168.15.31:8791
- Teste headless: `node testes/voo.js` (ou `node testes/voo.js toque`) → fotos em `testes/`

## 🧩 Como funciona (v0.1)
- `servidor/servidor.py`: aiohttp, sala única em `/ws`; guarda vida/pontos, valida acertos, voa os **bots** (completa até 4 aviões)
- `fonte/jogo.js`: three.js r128; cada cliente voa o próprio caça e manda o estado 20x/s; mira assistida; radar, placar, seta do inimigo

## 🚀 v0.2 (09/11) — mísseis e flares
- Trava: inimigo até 2,8 km e dentro de 22° do nariz por 1 s → **F** / 🚀 lança (2 mísseis, recarga 1 a cada 10 s, 60 de dano)
- Mísseis simulados **no servidor** (inclusive os dos bots); **X** / ✨ solta flares (espera 6 s, 70% de chance de desviar cada míssil)
- Teste: `node testes/missil.js` · backups da v0.1 em `backups/`

## 🛩️ v0.3 (09/11) — Esc, visão da cabine
- **Esc** volta ao menu · **V** / 👁️ troca câmera de trás ⇄ cabine
- Cabine: painel com 3 telas (radar, horizonte, estado), HUD verde (escada, velocidade, altitude, rumo, LOCK), manche que mexe, acelerador, pernas/mãos do piloto
- Desenhada numa cena separada por cima do mundo (`cenaCab`), sem briga de profundidade

## 🛫 v0.4 (10/11) — salas e bases
- Menu: **🤖 Sala com bots** (igual antes) ou **⚔️ Sala sem bots** (só gente, com bases)
- Sala sem bots: 4 bases no máximo, num anel a 7,2 km; a **zona de combate** é o círculo amarelo de 3,8 km no meio
- Cada um nasce **parado na cabeceira da pista** da sua base; acelera, puxa o manche (a partir de ~230 km/h) e decola (a 360 km/h o nariz sobe sozinho)
- Base dos outros: a menos de 3 km = **míssil terra-ar (SAM)** a cada 3,5 s (80 de dano, flare desvia); a sua base não atira em você
- 2 jogadores ficam em bases opostas; a bandeira da base tem a cor do dono; radar mostra bases (verde = sua) e os anéis
- Teste: `node testes/bases.js` · backup antes das bases em `backups/v0.3b/`
