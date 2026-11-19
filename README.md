# ✈️ js-jet — combate aéreo multiplayer no navegador

Jogo de combate aéreo 3D que roda no **navegador do celular ou do PC**, sem instalar nada.
Feito do zero com **three.js** no cliente e um **servidor Python (aiohttp + WebSocket)** que faz o papel de juiz da partida.

🎮 **Jogar:** https://js-jet-alpha.vercel.app

## 🕹️ Modos
- ⚔️ **Deathmatch** — multiplayer em tempo real; cada jogador decola da sua base, protegida por defesa antiaérea (SAM).
- 🤖 **Sala com bots** — bots com IA no servidor completam a partida.
- 🎖️ **Missões** — modo história com 8 missões (radares, defesa da base, frota naval, tempestade, chefão).
- 🚁 **Helicóptero** — ataque com câmera isométrica: missões primárias, secundárias e resgate de pilotos em ilhas distantes.
- 🎓 **Tutorial de voo**.

## 🧩 Destaques técnicos
- **Servidor autoritativo** em Python/aiohttp: estado de todos os aviões, mísseis guiados, bombas, SAMs e IA dos bots, transmitido por WebSocket.
- **Cliente three.js (r128)** sem framework e sem build: terreno procedural com ilhas, água, sombras, partículas (fogo, fumaça, rotor), HUD e cabine.
- **Controles** para teclado e toque (joystick virtual, botões), câmera livre com zoom e pinça.
- **Modelos 3D convertidos por scripts próprios** (`scripts/`): leitor GLB/STL em numpy → geometria compactada (base64) carregada sob demanda; camuflagem feita em shader.
- **Contas e ranking** com SQLite (senhas com hash + sal, limite de tentativas).
- **Testes headless** com Playwright (`testes/`).

## ▶️ Rodar em casa
```bash
python3 -m venv servidor/.venv && servidor/.venv/bin/pip install -r requirements.txt
servidor/.venv/bin/python servidor/servidor.py      # http://localhost:8791
```

## ☁️ Publicado
- **Site** (pasta `fonte/`): Vercel — `vercel.json` repassa `/api/*` ao servidor.
- **Servidor**: Render (plano grátis, `render.yaml`, variável `PUBLICO=1`). O servidor dorme sem jogadores e acorda em ~1 min; helicóptero e tutorial funcionam enquanto isso.

## 🙏 Créditos de modelos e texturas
- **AH-2 Sabre (Mi-35M):** "Russian Mil Mi-35M" por 42manako — Sketchfab, licença CC-BY-4.0.
- **KC-390:** "Aviâo KC390" por neemiasmiranda — Thingiverse 7310242, domínio público (CC0).
- **Gripen:** modelo "Saab JAS 39 Gripen" do MakerWorld (745326) — _licença a confirmar_.
- **Texturas:** MetalPlates001 — ambientCG, CC0.

Diário de desenvolvimento: [`docs/HISTORICO.md`](docs/HISTORICO.md)
