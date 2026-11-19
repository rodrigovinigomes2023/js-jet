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

## 👤 v0.5 (10/11) — login e ranking
- Menu: **nome + senha** (ENTRAR / CRIAR CONTA) ou **jogar como convidado** (vira "Convidado NNN", fora do ranking)
- Senha guardada só como hash scrypt com sal; sessão = token no navegador (180 dias); 8 erros em 5 min = espera
- Mesma conta entrando em outro aparelho derruba a conexão antiga
- **🏆 Ranking** separado por sala (sem bots / com bots): abates, mortes, abates/mortes, melhor sequência, tempo de voo
- Contas em `servidor/dados/jsjet.db` (fora do git) · `servidor/contas.py` · banco de teste: `JSJET_DB=/caminho.db`

### v0.5b (10/11) — arena 4x e seta
- Sala sem bots: zona de combate com raio 15,2 km (era 3,8), bases a 18,6 km, limite 20,9 km; +40 ilhas e mais nuvens no anel de fora.
- Seta do inimigo só liga dentro do círculo da arena; direção calculada no espaço da câmera (não inverte mais quando o alvo está atrás).
- Quem fica 10 s sem mandar nada (celular com tela apagada/app fechado) sai da sala; o cliente manda ping quando morto. Teste: `testes/seta.js`.

### v0.5c (10/11) — leme, freio e stall
- Teclado: A/D = leme (esquerda/direita), ← → = girar asas, E = desacelerar (freio aerodinâmico). Celular: botão 🪂 = freio.
- Stall abaixo de ~223 km/h: comandos perdem força, nariz cai sozinho e o avião afunda; abaixar o nariz/soltar o freio recupera. Teste: `testes/stall.js`.
- Celular: barra **LEME** à direita, em cima dos botões (arrasta p/ os lados, volta ao centro). Placar fica curto no celular. Teste: `testes/leme.js`.

### v0.5d (10/11) — tutorial de voo
- Botão 🎓 TUTORIAL DE VOO no menu: offline (não conecta no servidor, não conta no ranking), 9 etapas: decolagem, subir, inclinar, curva por 3 anéis, leme, desacelerar, stall e recuperação, turbo, rasante pelo anel em cima da pista. Textos mudam p/ celular/teclado; seta amarela aponta o próximo anel. Teste: `testes/treino.js` (TOQUE=1 p/ celular).

### v0.5e (10/11) — bombas, tutorial de combate, Gripen
- 💣 Bombas: 4 por avião (recarrega 1 a cada 8 s), tecla **B** / botão 💣. Queda balística igual no cliente e no servidor (relógio real); quem soltou avisa o impacto (conhece o relevo), servidor confere e explode sozinho se o aviso não vier. Raio 75 m.
- 🎯 CCIP: anel vermelho no chão mostra onde a bomba cai (aparece com o nariz um pouco p/ baixo).
- 🛡️ Sala sem bots: os 3 lançadores SAM de cada base podem ser destruídos a bomba (voltam em 90 s); sem nenhum de pé a base fica sem defesa.
- 🎓 Tutorial agora com 13 etapas: + canhão (drone), míssil (drone blindado), flare (míssil inimigo), bombardeio (3 barcos); botão "pular etapa". Testes: `testes/combate.js`, `testes/bomba_sam.js`.
- ✈️ Avião = Gripen (STL do Gomes sem a base, ~13 mil triângulos, `fonte/gripen.json` via `scripts/gripen_stl.py`); deriva e canards na cor do piloto, cocar da FAB.
- ☁️ Nuvens compensam a rolagem da câmera (não giram mais junto no tunô).

### Plano: modo história (combinado 10/11, não começado)
- "Céus do Desterro": Esquadrilha Garoupa × Frota Cinzenta / ás "Corvo"; 8 missões (patrulha, interceptação, escolta, radares/SAM, defender base, tempestade, noite, chefão) + missão de bombardeio.
- **Munição limitada sem recarga p/ nós e p/ o inimigo** (obriga a cuidar dos disparos).
- Estrelas, desbloqueios, progresso na conta; cada missão numa sala privada no servidor.

### v0.5f (10/11) — trem de pouso e manete
- ⌨️ **W/S = manete** (acelera/desacelera, 🎚️% no HUD); ↑ ↓ = manche; E = freio; **G = trem de pouso** (celular: botão TREM à esquerda).
- 🛞 Trem: anima 2,5 s; não recolhe no chão; baixado = arrasto (máx ~380 km/h, 540 no turbo). Os outros jogadores veem o seu trem (vai no snapshot).
- 🛬 Pouso: só no pátio/pista das bases, trem baixado, descendo < 7 m/s, asas niveladas, < 340 km/h; senão é acidente. Aviso "TREM RECOLHIDO" na aproximação. No chão: manete, freio, bequilha esterça com leme/manche.
- 🔧 Parado 2,5 s na pista da própria base (sala sem bots; no tutorial qualquer base) = vida, mísseis e bombas cheios (servidor confere).
- 🎓 Tutorial: etapa "recolher o trem" e etapa final "Pouso" (14 etapas). Teste: `testes/pouso.js`.
- 🛬 (10/11) Pouso facilitado: anéis verdes (rampa de 4°) até a pista da sua base quando o trem está baixado; trem baixado já segura ~320 km/h; abaixo de 15 m sobre a base o avião arredonda e nivela as asas sozinho; tolerância maior (descida < 12 m/s, < 410 km/h, asas até ~40°); manete zerada no chão = freio automático. Teste: `testes/pouso_facil.js`.

## v0.6 (10/11) — 📺 Sala da LIVE (TikTok)
- Botão **📺 SALA DA LIVE** no menu. Mesmo jogo da sala com bots, só que **cada pessoa que comenta vira um caça com o nome dela**.
- `!time azul` = ala do host (🟦, não leva tiro nosso, briga com os vermelhos) · `!time vermelho` (padrão) = contra o host (🟥).
- Comentar de novo = **fúria** por 10 s. Calado 3 min = o avião sai. Máximo `LIVE_MAX`=12 aviões; no máximo 3 caças em cima do host ao mesmo tempo.
- ❤️ a cada `LIVE_CURTIDAS`=500 curtidas → onda de 3 caças · ⭐ seguir → avião dourado · 🔁 compartilhar → +1 míssil.
- 🎁 Presentes por moedas: <10 (🔧 conserta o host / 😡 fúria) · 10–99 (🚀 +4 mísseis e 💣 pro host / salva de 2 mísseis no host) · 100–999 (🚢 2 navios com metralhadora antiaérea: alcance 900 m, anel vermelho na água, 200 de vida, 4 m/s, sem trava de míssil — de 1 km de altura dá p/ bombardear; teste `testes/live_navio.js`) · 1000–4999 (👑 chefão 2,2x, 400 de vida) · 5000+ (🛡️ esquadrilha aliada / ☠️ ataque total).
- 🎮 **Placar EU ✕ CHAT** no topo: host derruba alguém do chat = +1 pra ele; qualquer coisa do chat derruba o host = +1 pro chat (cair sozinho não conta). Zera no simulador (🔄). Teste `testes/live_vs.js`.
- Pódio na tela de morte: 💀 quem mais te derrubou e 🎁 quem mais deu presente.
- Eventos entram por `POST /api/live` (só rede de casa). **Simulador**: `/simulador.html`. Teste: `testes/live.js`.
- 👤 **Foto e nome em tudo**: avatar (campo `avatar` https do evento; sem foto = bolinha com a inicial) ao lado do nome em cima do avião/navio, nos alertas e nas falas. Cada comentário vira **balão em cima do avião** da pessoa + linha no chat da tela.
- 🎥 **Close em quem te derrubou**: câmera vai até o avião/navio do matador e gira em volta; cartão com foto, nome, como te pegou e "🎯 N× em você nesta live". HUD some enquanto isso (renasce em 4,6 s). Teste `testes/live_close.js`.
- 📷 **Câmera frontal** num cantinho (botão 📷 ao lado do 👁️). Navegador só libera câmera em **https** → servidor também abre `https://<ip>:8793` (certificado próprio em `servidor/dados/`, fora do git; o celular avisa "não seguro" na 1ª vez → Avançado → Continuar).
- 📡 **Ponte TikTok** `scripts/tiktok/ponte.py` (TikTokLive 7.0.1, não oficial, venv própria `scripts/tiktok/.venv`, fora do git). Lê pelo @ sem login; tenta a cada 30 s até a live abrir e reconecta se cair. Serviço: `systemd-run --user --unit=jsjet-ponte --collect ~/js-jet/scripts/tiktok/rodar_ponte.sh [@usuario]` · log: `journalctl --user -u jsjet-ponte -f`.

## v0.6b (11/11) — 🎯 mira de compensação
- **Sem mira assistida**: a rajada sai reta do nariz (antes ela curvava sozinha até o alvo perto do nariz — fácil demais).
- **◇ losango de compensação** na cor do alvo: onde ele vai estar quando a bala chegar (alvo travado ou o mais perto na frente, até 1,6 km). A mira (○) passa a ficar na distância do alvo; ◇ fica **verde** quando o tiro vai pegar. Teste `testes/compensacao.js` (mirando direto: 100→58; mirando no ◇: 100→9).
- 🤖 (11/11) **Sala com bots = todos contra todos**: cada bot pega o mais perto (bot ou humano, com sorte no meio) e segura ~12 s; no máximo **1 bot atrás de cada humano** (2 se tiver mais de 4 bots). Antes todos iam no humano.
- ⚔️ (11/11) **Bots de deathmatch** (só sala com bots): alvo = perto + machucado + de costas + ocupado com outro (evitam encarar de frente quem está inteiro); **alguém na cauda** → quebram a curva p/ um lado e trocam de altura; **míssil** → põem de lado (beam) e soltam flare < 650 m; **vida < 35** → saem da briga subindo, só voltam p/ abate fácil. Simulação 5 min/5 bots: 80% atacando, 14% se defendendo, 30 flares.

## v0.7 (11/11) — ⚔️ sala com bots vira deathmatch com bases
- **4 bases novas** a 5,8 km do centro (75°/165°/255°/345°, no mar livre — mesmas no servidor e no cliente). Cada um (humano e bot) tem a **sua base**; humano nasce na cabeceira da pista e decola, bot nasce no ar em cima da base.
- **4 baterias por base**: metralhadora antiaérea (alcance 1,2 km, erra de longe) + **SAM** (anel de 2,5 km). Atiram em todo mundo menos no dono; base sem dono fica quieta. Bomba destrói bateria (volta em 90 s).
- **Munição acaba** (só nesta sala): canhão 500 balas, 2 mísseis, 4 bombas, sem recarga automática. **Rasante** (< 130 m de altura, até 850 m do centro da base) na **própria base** rearma tudo e conserta. HUD mostra 🔫; sem munição aparece aviso e a seta aponta p/ casa.
- **Bots**: tiro de verdade (bala tem que passar a < 10 m do alvo, erro de mira de 0,8° a 2° por piloto, atiram quando o "◇" deles alinha); com pouca munição ou machucados **voltam p/ casa e fazem o rasante**; virada com rotação de verdade (antes, alvo bem atrás travava a curva).
- Testes: `testes/dm_bases.js` (nasce na base, gasta bala, rasante recarrega, base inimiga derruba) + simulações em Python.

## v0.7b (11/11) — 🔥 queda em chamas, ejeção e rastro de vapor
- **Abatido não some mais**: a carcaça (cópia do avião) cai girando, com fogo e fumaça; no **chão** explode, solta estilhaços e deixa fogo + coluna de fumaça (~14 s); na **água** espirra e some. **Navio** afunda inclinando e pegando fogo. Drones do tutorial também caem.
- 🪂 **Piloto ejeta** (85%): assento sobe com foguete, abre paraquedas laranja e desce balançando até o chão/água.
- Na minha morte a câmera **segue a minha carcaça** caindo (se cair direto no chão: fogo/espirro no lugar).
- 💨 **Rastro de vapor nas pontas das asas** (fita branca que some aos poucos): aparece com G alto (> ~2,2 G) e em alta velocidade, no meu avião e nos outros.
- Teste `testes/queda.js`; física conferida empurrando o tempo direto (cai de 800 m em ~13 s).
