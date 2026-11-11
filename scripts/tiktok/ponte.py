"""js-jet — ponte TikTok LIVE → sala da live (10/11/2026).

Lê comentários, presentes, curtidas, seguidores e compartilhamentos da live pelo @ (sem login, sem chave)
e manda p/ o jogo em POST /api/live. Fica tentando a cada 30 s até a live abrir; se cair, volta a tentar.

    scripts/tiktok/.venv/bin/python scripts/tiktok/ponte.py @usuario [http://127.0.0.1:8791]

Biblioteca: TikTokLive (não oficial; usa o servidor de assinatura da Euler Stream). Pode quebrar quando o TikTok mudar.
"""
import asyncio, json, sys, time, urllib.request

from TikTokLive import TikTokLiveClient
from TikTokLive.events import (CommentEvent, ConnectEvent, DisconnectEvent, FollowEvent, GiftEvent, LikeEvent,
                               LiveEndEvent, ShareEvent)

USUARIO = (sys.argv[1] if len(sys.argv) > 1 else '@yodamalhumorado')
JOGO = (sys.argv[2] if len(sys.argv) > 2 else 'http://127.0.0.1:8791').rstrip('/') + '/api/live'
ESPERA = 30


def log(*a):
    print(time.strftime('%H:%M:%S'), *a, flush=True)


def manda(ev):
    """POST p/ o jogo (em thread, p/ não travar a leitura da live)."""
    try:
        req = urllib.request.Request(JOGO, json.dumps(ev).encode(), {'content-type': 'application/json'})
        urllib.request.urlopen(req, timeout=5).read()
    except Exception as e:
        log('⚠️ jogo não respondeu:', e)


async def enviar(ev):
    await asyncio.to_thread(manda, ev)


def quem(u):
    """(id, nome, foto) de um usuário do TikTok — tolerante a campos faltando."""
    uid = getattr(u, 'unique_id', None) or getattr(u, 'display_id', None) or str(getattr(u, 'id', '') or '?')
    nome = getattr(u, 'nickname', None) or uid
    foto = None
    for campo in ('avatar_thumb', 'avatar_medium', 'avatar_large'):
        img = getattr(u, campo, None)
        urls = (getattr(img, 'url_list', None) or getattr(img, 'm_urls', None) or []) if img else []
        foto = next((x for x in urls if isinstance(x, str) and x.startswith('https://')), None)
        if foto:
            break
    return uid, nome, foto


def base(u, tipo):
    uid, nome, foto = quem(u)
    ev = {'tipo': tipo, 'id': uid, 'nome': nome}
    if foto:
        ev['avatar'] = foto
    return ev


def criar_cliente():
    c = TikTokLiveClient(unique_id=USUARIO)

    @c.on(ConnectEvent)
    async def _(e):
        log(f'✅ conectado na live de {USUARIO}')

    @c.on(CommentEvent)
    async def _(e):
        ev = base(e.user, 'comentario')
        ev['texto'] = getattr(e, 'content', None) or getattr(e, 'comment', '') or ''
        log('💬', ev['nome'], ':', ev['texto'])
        await enviar(ev)

    @c.on(GiftEvent)
    async def _(e):
        g = e.gift
        if getattr(e, 'streaking', False):   # presente em sequência: só conta no fim do combo
            return
        n = max(1, int(getattr(e, 'repeat_count', 1) or 1))
        ev = base(e.user, 'presente')
        ev['presente'] = getattr(g, 'name', None) or 'presente'
        ev['moedas'] = max(1, int(getattr(g, 'diamond_count', 1) or 1)) * n
        log('🎁', ev['nome'], ev['presente'], f'x{n}', ev['moedas'], 'moedas')
        await enviar(ev)

    @c.on(LikeEvent)
    async def _(e):
        ev = base(e.user, 'curtida')
        ev['n'] = int(getattr(e, 'count', 1) or 1)
        await enviar(ev)

    @c.on(FollowEvent)
    async def _(e):
        log('⭐ seguiu:', quem(e.user)[1])
        await enviar(base(e.user, 'seguir'))

    @c.on(ShareEvent)
    async def _(e):
        log('🔁 compartilhou:', quem(e.user)[1])
        await enviar(base(e.user, 'compartilhar'))

    @c.on(LiveEndEvent)
    async def _(e):
        log('🔚 a live acabou')

    @c.on(DisconnectEvent)
    async def _(e):
        log('🔌 desconectou')

    return c


async def principal():
    log(f'📡 ponte TikTok → js-jet · {USUARIO} → {JOGO}')
    avisou = False
    while True:
        c = criar_cliente()
        try:
            if not await c.is_live():
                if not avisou:
                    log(f'⏳ {USUARIO} não está ao vivo — tento de novo a cada {ESPERA} s')
                    avisou = True
                await asyncio.sleep(ESPERA)
                continue
            avisou = False
            await c.connect()          # fica aqui enquanto a live durar
            log('↩️ conexão terminou — volto a esperar a live')
        except Exception as e:
            log('⚠️', type(e).__name__, str(e)[:200])
        await asyncio.sleep(ESPERA)


if __name__ == '__main__':
    try:
        asyncio.run(principal())
    except KeyboardInterrupt:
        pass
