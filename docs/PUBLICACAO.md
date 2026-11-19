# ☁️ Publicação do js-jet (19/11/2026)

Tudo grátis e sem cartão. Contas criadas com o GitHub **rodrigovinigomes2023**.

| Parte | Serviço | Endereço / onde |
|---|---|---|
| 🌐 Site (pasta `fonte/`) | **Vercel** (time "YODA", plano Hobby) | https://js-jet-br.vercel.app |
| 🎮 Servidor Python | **Render** (plano Free, `render.yaml`) | https://js-jet.onrender.com |
| 💾 Banco (contas, ranking, missões) | **Neon** Postgres (us-east-2) | variável `DATABASE_URL` no painel do Render |
| 📦 Código | **GitHub** (privado) | https://github.com/rodrigovinigomes2023/js-jet |

## Como funciona
- Cada `git push` na `master` atualiza o **Vercel** e o **Render** sozinhos.
- `fonte/config.js`: em `*.vercel.app` o jogo conecta no WebSocket `wss://js-jet.onrender.com/ws`; `vercel.json` repassa `/api/*` ao Render.
- No Render, `PUBLICO=1`: sem sala da live/TikTok, sem ponte, `_rede_de_casa()` sempre falso, IP do jogador vem do `X-Forwarded-For`, rota `/api/ping`.
- `servidor/contas.py`: usa **Postgres** se `DATABASE_URL` existir; senão **SQLite** em `servidor/dados/jsjet.db` (em casa).
- O Render grátis **dorme após 15 min** sem tráfego e leva ~1 min p/ acordar; o menu mostra "⏳ acordando o servidor…" (helicóptero e tutorial funcionam offline).

## Em casa (sem mudança)
- `systemctl --user restart jsjet` → http://localhost:8791 (com sala da live e ponte do TikTok).

## Pendências
- Licença do modelo do **Gripen** (MakerWorld 745326) a confirmar antes de deixar o repositório público.
- Teste: `node testes/publicado.js [url]`.
