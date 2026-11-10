"""js-jet — servidor do combate aéreo multiplayer (09/11/2026).

aiohttp: serve o jogo (pasta fonte/) e a sala única por WebSocket em /ws.
Cada cliente simula o próprio caça e manda posição 20x/s; o servidor guarda vida/pontos,
valida acertos e voa os bots (completa a sala até MIN_AVIOES).
Rodar: servidor/.venv/bin/python servidor/servidor.py   (PORTA=8791 por padrão)
"""
import asyncio, json, math, os, random, time
from pathlib import Path
from aiohttp import web, WSMsgType

RAIZ = Path(__file__).resolve().parent.parent / 'fonte'
PORTA = int(os.environ.get('PORTA', 8791))
MIN_AVIOES = int(os.environ.get('MIN_AVIOES', 4))
CORES = ['#e8443a', '#2f7de1', '#f2b632', '#3cb371', '#b05be0', '#ff7f2a', '#1fc3c3', '#e055a0']
NOMES_BOT = ['Bot Tainha', 'Bot Garoupa', 'Bot Anchova', 'Bot Siri', 'Bot Berbigão', 'Bot Corvina', 'Bot Linguado']
DANO_TIRO = 7
ARENA = 4200

AV = {}            # id -> Aviao
_prox = [1]


def norm(v):
    n = math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2) or 1.0
    return [v[0] / n, v[1] / n, v[2] / n]


def cross(a, b):
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]


def dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def quat_de(f, bank):
    """Quaternion do caça (nariz +x, topo +y, asa direita +z) a partir da frente f e da inclinação."""
    z0 = cross(f, [0, 1, 0])
    if dot(z0, z0) < 1e-6:
        z0 = [0, 0, 1]
    z0 = norm(z0)
    y0 = cross(z0, f)
    c, s = math.cos(bank), math.sin(bank)
    y = [y0[i] * c + z0[i] * s for i in range(3)]
    z = [z0[i] * c - y0[i] * s for i in range(3)]
    m00, m01, m02 = f[0], y[0], z[0]
    m10, m11, m12 = f[1], y[1], z[1]
    m20, m21, m22 = f[2], y[2], z[2]
    tr = m00 + m11 + m22
    if tr > 0:
        s = 0.5 / math.sqrt(tr + 1.0)
        return [(m21 - m12) * s, (m02 - m20) * s, (m10 - m01) * s, 0.25 / s]
    if m00 > m11 and m00 > m22:
        s = 2.0 * math.sqrt(1.0 + m00 - m11 - m22)
        return [0.25 * s, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]
    if m11 > m22:
        s = 2.0 * math.sqrt(1.0 + m11 - m00 - m22)
        return [(m01 + m10) / s, 0.25 * s, (m12 + m21) / s, (m02 - m20) / s]
    s = 2.0 * math.sqrt(1.0 + m22 - m00 - m11)
    return [(m02 + m20) / s, (m12 + m21) / s, 0.25 * s, (m10 - m01) / s]


def nums(v, n, lim=1e6):
    try:
        out = [float(x) for x in v[:n]]
    except (TypeError, ValueError):
        return None
    if len(out) != n or not all(math.isfinite(x) and abs(x) < lim for x in out):
        return None
    return out


def ponto_nascer():
    a = random.random() * math.tau
    r = 1800 + random.random() * 1500
    p = [math.cos(a) * r, 650 + random.random() * 500, math.sin(a) * r]
    return p, norm([-p[0], 0, -p[2]])


class Aviao:
    def __init__(self, nome, bot=False, ws=None):
        self.id = _prox[0]; _prox[0] += 1
        usadas = {a.cor for a in AV.values()}
        livres = [c for c in CORES if c not in usadas] or CORES
        self.cor = livres[0]
        self.nome, self.bot, self.ws = nome, bot, ws
        p, f = ponto_nascer()
        self.p, self.f = p, f
        self.v = [f[0] * 120, 0, f[2] * 120]
        self.q = quat_de(f, 0)
        self.vida, self.vivo = 100, bot
        self.pontos = self.mortes = 0
        self.t_morte = 0.0
        self.bank = 0.0
        self.ult_tiro = 0.0
        self.acertos = []          # instantes dos últimos acertos (limite por segundo)
        self.alvo_pts = None       # passeio do bot sem alvo


async def mandar(a, msg):
    if a.ws is None or a.ws.closed:
        return
    try:
        await a.ws.send_str(msg if isinstance(msg, str) else json.dumps(msg, separators=(',', ':')))
    except Exception:
        pass


async def todos(msg, exceto=None):
    s = json.dumps(msg, separators=(',', ':'))
    await asyncio.gather(*(mandar(a, s) for a in list(AV.values()) if not a.bot and a is not exceto))


async def placar():
    await todos({'t': 'placar', 'l': [{'id': a.id, 'nome': a.nome, 'cor': a.cor, 'bot': a.bot,
                                         'pontos': a.pontos, 'mortes': a.mortes} for a in AV.values()]})


async def matar(alvo, por):
    if not alvo.vivo:
        return
    alvo.vivo, alvo.vida = False, 0
    alvo.mortes += 1
    alvo.t_morte = time.monotonic()
    if por is not None and por is not alvo:
        por.pontos += 1
    await todos({'t': 'abate', 'alvo': alvo.id, 'por': por.id if por and por is not alvo else None, 'p': alvo.p})
    await placar()


async def dano(alvo, qto, por):
    if not alvo.vivo:
        return
    alvo.vida = max(0, alvo.vida - qto)
    if alvo.vida <= 0:
        await matar(alvo, por)


async def ajustar_bots():
    humanos = sum(1 for a in AV.values() if not a.bot)
    bots = [a for a in AV.values() if a.bot]
    falta = (MIN_AVIOES - humanos - len(bots)) if humanos else -len(bots)
    if falta > 0:
        usados = {b.nome for b in bots}
        for nome in [n for n in NOMES_BOT if n not in usados][:falta]:
            b = Aviao(nome, bot=True)
            AV[b.id] = b
    elif falta < 0:
        for b in bots[:(-falta)]:
            AV.pop(b.id, None)


# ---------------------------------------------------------------- bots
async def voar_bot(b, dt, agora):
    if not b.vivo:
        if agora - b.t_morte > 4:
            b.p, b.f = ponto_nascer()
            b.vida, b.vivo, b.bank = 100, True, 0.0
        return
    vivos = [a for a in AV.values() if a.vivo and a is not b]
    humanos = [a for a in vivos if not a.bot]
    cand = humanos if humanos and random.random() > 0.0 else vivos

    def dist(a):
        return math.dist(a.p, b.p)
    alvo = min(cand, key=dist) if cand else None
    if alvo and dist(alvo) > 2600 and vivos:   # longe demais: briga com quem estiver perto
        alvo = min(vivos, key=dist)
    if alvo:
        d = dist(alvo)
        t = min(1.5, d / 950)
        mira = [alvo.p[i] + alvo.v[i] * t for i in range(3)]
        des = norm([mira[i] - b.p[i] for i in range(3)])
    else:
        if not b.alvo_pts or math.dist(b.alvo_pts, b.p) < 300:
            b.alvo_pts = [random.uniform(-2500, 2500), random.uniform(500, 1400), random.uniform(-2500, 2500)]
        des = norm([b.alvo_pts[i] - b.p[i] for i in range(3)])
    if b.p[1] < 420:
        des[1] += (420 - b.p[1]) / 120
    if b.p[1] > 2400:
        des[1] -= 0.6
    rh = math.hypot(b.p[0], b.p[2])
    if rh > ARENA:
        des[0] -= b.p[0] / rh * 1.5
        des[2] -= b.p[2] / rh * 1.5
    des = norm(des)
    f0 = b.f
    ang = math.acos(max(-1.0, min(1.0, dot(f0, des))))
    passo = 0.85 * dt
    if ang > passo:
        k = passo / ang
        f1 = norm([f0[i] + (des[i] - f0[i]) * k for i in range(3)])
    else:
        f1 = des
    omega_y = cross(f0, f1)[1] / max(dt, 1e-3)
    alvo_bank = max(-1.2, min(1.2, -omega_y * 1.6))
    b.bank += (alvo_bank - b.bank) * min(1.0, 3 * dt)
    b.f = f1
    vel = 118.0
    b.v = [f1[i] * vel for i in range(3)]
    b.p = [b.p[i] + b.v[i] * dt for i in range(3)]
    b.q = quat_de(f1, b.bank)
    if alvo and alvo.vivo:
        d = math.dist(alvo.p, b.p)
        dirr = norm([alvo.p[i] - b.p[i] for i in range(3)])
        if d < 850 and dot(f1, dirr) > math.cos(math.radians(6)) and agora - b.ult_tiro > 0.1:
            b.ult_tiro = agora
            await todos({'t': 'tiro', 'id': b.id, 'p': [round(x, 1) for x in b.p], 'd': [round(x, 3) for x in f1]})
            if random.random() < 0.16:
                await dano(alvo, 6, b)


async def laco(app):
    dt = 0.05
    while True:
        t0 = time.monotonic()
        try:
            for b in [a for a in AV.values() if a.bot]:
                await voar_bot(b, dt, t0)
            if any(not a.bot for a in AV.values()):
                j = [[a.id] + [round(x, 1) for x in a.p] + [round(x, 4) for x in a.q] + [round(x, 1) for x in a.v]
                     + [a.vida, 1 if a.vivo else 0] for a in AV.values()]
                await todos({'t': 'snap', 'j': j})
        except Exception as e:  # o laço nunca pode morrer
            print('laço:', e, flush=True)
        await asyncio.sleep(max(0.0, dt - (time.monotonic() - t0)))


# ---------------------------------------------------------------- jogadores
async def ws_jogo(req):
    ws = web.WebSocketResponse(heartbeat=20)
    await ws.prepare(req)
    a = None
    try:
        async for m in ws:
            if m.type != WSMsgType.TEXT:
                continue
            try:
                d = json.loads(m.data)
            except ValueError:
                continue
            t = d.get('t')
            if t == 'entrar' and a is None:
                nome = str(d.get('nome') or 'Piloto').strip()[:16] or 'Piloto'
                a = Aviao(nome, ws=ws)
                AV[a.id] = a
                print(f'entrou {a.id} {nome}', flush=True)
                await ajustar_bots()
                await mandar(a, {'t': 'bemvindo', 'id': a.id, 'cor': a.cor})
                await placar()
            elif a is None:
                continue
            elif t == 'e':
                p, q, v = nums(d.get('p', []), 3), nums(d.get('q', []), 4, 2), nums(d.get('v', []), 3, 1000)
                if p and q and v and a.vivo:
                    a.p, a.q, a.v = p, q, v
            elif t == 'tiro' and a.vivo:
                p, dd = nums(d.get('p', []), 3), nums(d.get('d', []), 3, 2)
                if p and dd:
                    await todos({'t': 'tiro', 'id': a.id, 'p': p, 'd': dd}, exceto=a)
            elif t == 'acerto' and a.vivo:
                alvo = AV.get(d.get('alvo'))
                agora = time.monotonic()
                a.acertos = [x for x in a.acertos if agora - x < 1]
                if alvo and alvo is not a and alvo.vivo and len(a.acertos) < 18 and math.dist(a.p, alvo.p) < 1500:
                    a.acertos.append(agora)
                    await dano(alvo, DANO_TIRO, a)
            elif t == 'caiu':
                await matar(a, None)
            elif t == 'renascer' and not a.vivo and time.monotonic() - a.t_morte > 2.5:
                p = nums(d.get('p', []), 3)
                if p:
                    a.p = p
                a.vida, a.vivo = 100, True
    finally:
        if a:
            AV.pop(a.id, None)
            print(f'saiu {a.id} {a.nome}', flush=True)
            await ajustar_bots()
            await placar()
    return ws


async def arquivo(req):
    nome = req.match_info.get('arq') or 'index.html'
    alvo = (RAIZ / nome).resolve()
    if RAIZ not in alvo.parents or not alvo.is_file():
        raise web.HTTPNotFound()
    return web.FileResponse(alvo, headers={'Cache-Control': 'no-store'})


async def iniciar(app):
    app['laco'] = asyncio.create_task(laco(app))


def main():
    app = web.Application()
    app.router.add_get('/ws', ws_jogo)
    app.router.add_get('/', arquivo)
    app.router.add_get('/{arq}', arquivo)
    app.on_startup.append(iniciar)
    print(f'js-jet em http://0.0.0.0:{PORTA}', flush=True)
    web.run_app(app, host='0.0.0.0', port=PORTA, print=None)


if __name__ == '__main__':
    main()
