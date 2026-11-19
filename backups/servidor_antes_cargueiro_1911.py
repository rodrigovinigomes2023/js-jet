"""js-jet — servidor do combate aéreo multiplayer (09/11/2026).

aiohttp: serve o jogo (pasta fonte/) e a sala única por WebSocket em /ws.
Cada cliente simula o próprio caça e manda posição 20x/s; o servidor guarda vida/pontos,
valida acertos e voa os bots (completa a sala até MIN_AVIOES).
Rodar: servidor/.venv/bin/python servidor/servidor.py   (PORTA=8791 por padrão)
"""
import asyncio, base64, ipaddress, json, math, os, random, time
from array import array
from pathlib import Path
from aiohttp import web, WSMsgType
import contas   # (10/11) login e ranking

RAIZ = Path(__file__).resolve().parent.parent / 'fonte'
PORTA = int(os.environ.get('PORTA', 8791))
MIN_AVIOES = int(os.environ.get('MIN_AVIOES', 4))
CORES = ['#e8443a', '#2f7de1', '#f2b632', '#3cb371', '#b05be0', '#ff7f2a', '#1fc3c3', '#e055a0']
NOMES_BOT = ['Bot Tainha', 'Bot Garoupa', 'Bot Anchova', 'Bot Siri', 'Bot Berbigão', 'Bot Corvina', 'Bot Linguado']
DANO_TIRO = 7
DANO_MISSIL = 60
MISSEIS_MAX, RECARGA_MISSIL, ESPERA_FLARE = 2, 10.0, 6.0
MIS = {}           # id do míssil -> Missil
# (10/11) bombas: queda balística (mesma física do cliente); o cliente de quem soltou avisa onde bateu (ele conhece o relevo)
BOMBAS_MAX, RECARGA_BOMBA, G_BOMBA, ARRASTO_BOMBA = 4, 8.0, 14.0, 0.04
R_BOMBA, DANO_BOMBA, R_LANCADOR = 75.0, 130.0, 45.0
BOMBAS = {}        # id -> dict(dono, sala, p, v, t)
_prox_m = [1]
ARENA = 4200

AV = {}            # id -> Aviao
_prox = [1]

# (10/11) salas: 'bots' (como antes, completa com bots) e 'pvp' (sem bots, com bases)
SALAS = ('bots', 'pvp', 'live')   # (10/11) live = sala do TikTok: chat vira avião
# Bases da sala pvp: 4 no máximo, num anel fora da zona de combate (círculo no meio do mapa).
# Cada um nasce na pista da sua base; chegar perto de base alheia = míssil terra-ar (SAM).
BASE_R, ZONA, R_SAM = 18600, 15200, 3000   # (10/11) arena 4x maior (era zona 3800, bases a 7200)
BASE_H = 18.0
BASE_R_BOTS = 5800                # (11/11) sala com bots (deathmatch): bases perto do centro, no mar livre
BASES = ([[math.cos(math.radians(a)) * BASE_R, BASE_H, math.sin(math.radians(a)) * BASE_R] for a in (45, 135, 225, 315)]
         + [[math.cos(math.radians(a)) * BASE_R_BOTS, BASE_H, math.sin(math.radians(a)) * BASE_R_BOTS] for a in (75, 165, 255, 345)])
BASE_SALA = ['pvp'] * 4 + ['bots'] * 4
ORDEM_BASES = {'pvp': (0, 2, 1, 3), 'bots': (4, 6, 5, 7)}   # os 2 primeiros ficam em bases opostas
R_SAM_SALA = {'pvp': R_SAM, 'bots': 2500}
MUN_LIMITADA = ('bots',)          # (11/11) sala com bots: munição acaba; recarrega num rasante na própria base


def e_missao(sala):
    return sala.startswith('m:')


def lim(sala):
    """Munição que acaba: sala com bots (recarrega no rasante) e missões (19/11: sem recarga nenhuma)."""
    return sala in MUN_LIMITADA or e_missao(sala)


BALAS_MAX = 500
R_AA, AA_ESPERA, DANO_AA = 1200.0, 0.15, 4   # metralhadora antiaérea das baterias
SAM_ESPERA, DANO_SAM = 3.5, 80
T_SAM = [0.0] * len(BASES)       # último disparo de cada base
# (10/11) 3 lançadores SAM por base (mesmas posições do cliente, no referencial da pista); bomba destrói, volta em 90 s
def _ilhas():
    """Mesmas ilhas do cliente (jogo.js, rnd(20251109)) — o servidor precisa saber onde é mar."""
    s = [20251109]

    def r():
        s[0] = (s[0] * 16807) % 2147483647
        return s[0] / 2147483647
    il = [(300, -200, 1100)]
    for _ in range(16):
        a = r() * math.tau; d = 900 + r() * 4200; raio = 220 + r() * 700; r()
        il.append((math.cos(a) * d, math.sin(a) * d, raio))
    b0 = [(math.cos(math.radians(g)) * BASE_R, math.sin(math.radians(g)) * BASE_R) for g in (45, 135, 225, 315)]
    for _ in range(40):
        a = r() * math.tau; d = 5600 + r() * 10200; x, z = math.cos(a) * d, math.sin(a) * d
        if any(math.hypot(x - bx, z - bz) < 3200 for bx, bz in b0):
            continue
        raio = 220 + r() * 700; r()
        il.append((x, z, raio))
    b1 = [(math.cos(math.radians(g)) * BASE_R_BOTS, math.sin(math.radians(g)) * BASE_R_BOTS) for g in (75, 165, 255, 345)]
    return il + [(bx, bz, 760) for bx, bz in b0 + b1]


ILHAS = _ilhas()


def _terreno():
    """(18/11) Relevo das ilhas-montanha: as mesmas grades que o cliente usa (fonte/terreno.js, gerado por scripts/terreno/gerar.py)."""
    txt = (RAIZ / 'terreno.js').read_text()
    meta = json.loads(txt.split('window.TERRENO=', 1)[1].split(';\n', 1)[0])
    a = array('h')
    a.frombytes(base64.b64decode(txt.split('window.TERRENO.dados="', 1)[1].split('"', 1)[0]))
    for I in meta['ilhas']:
        I['x1'] = I['x0'] + (I['nx'] - 1) * meta['passo']
        I['z1'] = I['z0'] + (I['nz'] - 1) * meta['passo']
    return meta, a


TER, TER_A = _terreno()


def relevo_bruto(x, z):
    """Altura do terreno das ilhas (m); fora delas, o fundo do mar."""
    h, p = TER['fundo'], TER['passo']
    for I in TER['ilhas']:
        if I['x0'] <= x <= I['x1'] and I['z0'] <= z <= I['z1']:
            fx, fz = (x - I['x0']) / p, (z - I['z0']) / p
            i, j = max(0, min(I['nx'] - 2, int(fx))), max(0, min(I['nz'] - 2, int(fz)))
            u, v, o, n = fx - i, fz - j, I['of'] + j * I['nx'] + i, I['nx']
            hi = ((TER_A[o] * (1 - u) + TER_A[o + 1] * u) * (1 - v) + (TER_A[o + n] * (1 - u) + TER_A[o + n + 1] * u) * v) * 0.25
            h = max(h, hi)
    return h


def relevo(x, z):
    """Chão (m): ilhas, ilha plana das bases ou o mar (0)."""
    h = max(0.0, relevo_bruto(x, z))
    if h < BASE_H and any(math.hypot(x - b[0], z - b[2]) < 760 for b in BASES):
        h = BASE_H
    return h


def visada(a, b):
    """O morro está no meio entre os pontos a e b?"""
    dx, dz = b[0] - a[0], b[2] - a[2]
    n = max(2, math.ceil(math.hypot(dx, dz) / 60))
    for k in range(1, n):
        t = k / n
        y = a[1] + (b[1] - a[1]) * t
        if y < 820 and relevo_bruto(a[0] + dx * t, a[2] + dz * t) > y:
            return False
    return True


VIS = {}   # (18/11) cache de linha de visada entre dois aviões: (id, id) -> (validade, vê?)


def ve(b, a, agora):
    """O bot b enxerga a? (morro no meio = não). Recalcula a cada 0,4 s por par."""
    k = (b.id, a.id) if b.id < a.id else (a.id, b.id)
    c = VIS.get(k)
    if c and agora < c[0]:
        return c[1]
    v = visada(b.p, a.p)
    VIS[k] = (agora + 0.4, v)
    if len(VIS) > 4000:
        VIS.clear()
    return v


def e_mar(x, z, folga=120):
    if any(math.hypot(x - b[0], z - b[2]) < 760 + folga for b in BASES):
        return False
    return all(relevo_bruto(x + dx, z + dz) < -3 for dx, dz in ((0, 0), (folga, 0), (-folga, 0), (0, folga), (0, -folga)))


LANC_LOCAL = ((-320, -120), (320, -120), (0, -190))
LANC_LOCAL_BOTS = LANC_LOCAL + ((380, 160),)   # (11/11) base da sala com bots: 4 baterias
VOLTA_LANC = 90.0


def _lancadores(b, i):
    yaw = math.atan2(b[2], -b[0])
    c, s = math.cos(yaw), math.sin(yaw)
    return [[b[0] + x * c + z * s, b[1], b[2] - x * s + z * c] for x, z in (LANC_LOCAL_BOTS if BASE_SALA[i] == 'bots' else LANC_LOCAL)]


LANC = [_lancadores(b, i) for i, b in enumerate(BASES)]
LANC_MORTO = [[0.0] * len(l) for l in LANC]   # instante em que foi destruído (0 = de pé)
T_AA = [0.0] * len(BASES)


def sams_msg():
    return {'t': 'sams', 'l': [[0 if m else 1 for m in base] for base in LANC_MORTO]}


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


def escolher_base(sala='pvp'):
    """Base com menos aviões (empate: ordem que deixa os 2 primeiros em lados opostos)."""
    conta = [0] * len(BASES)
    for a in AV.values():
        if a.sala == sala and a.base is not None:
            conta[a.base] += 1
    ordem = ORDEM_BASES[sala]
    return min(ordem, key=lambda i: (conta[i], ordem.index(i)))


def ponto_base(i, alt=260):
    """Nasce em cima da própria base (bots), já voando p/ o centro."""
    b = BASES[i]
    f = norm([-b[0], 0, -b[2]])
    return [b[0] - f[0] * 400, alt, b[2] - f[2] * 400], f


# (18/11) DIFICULDADE DINÂMICA (escondida, sem aviso): cada humano tem um "nível" que regula os bots/bases que miram nele.
# Morreu p/ bot ou base -> cai (mais rápido se morrer várias seguidas); derrubou alguém -> sobe (mais rápido em sequência).
# 1.0 = bots como eram até a v0.9. Lembrado pelo nome enquanto o servidor estiver no ar.
NIVEL_INI, NIVEL_MIN, NIVEL_MAX = 0.8, 0.3, 1.25
NIVEL = {}


def fac(alvo):
    """Força dos bots contra este alvo (1 = normal; só humanos têm nível)."""
    return alvo.nivel if (alvo is not None and not alvo.bot) else 1.0


def ajusta_nivel(a, delta):
    a.nivel = max(NIVEL_MIN, min(NIVEL_MAX, a.nivel + delta))
    NIVEL[a.nome.lower()] = a.nivel
    print(f'nivel {a.nome}: {a.nivel:.2f} ({delta:+.2f})', flush=True)


class Aviao:
    def __init__(self, nome, bot=False, ws=None, sala='bots'):
        self.id = _prox[0]; _prox[0] += 1
        self.sala = sala
        self.base = escolher_base(sala) if sala in ORDEM_BASES else None
        usadas = {a.cor for a in AV.values() if a.sala == sala}
        livres = [c for c in CORES if c not in usadas] or CORES
        self.cor = livres[0]
        self.nome, self.bot, self.ws = nome, bot, ws
        p, f = ponto_base(self.base) if (bot and self.base is not None) else ponto_nascer()
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
        self.misseis = MISSEIS_MAX
        self.t_recarga = 0.0
        self.bombas, self.t_rec_bomba, self.t_bomba = BOMBAS_MAX, 0.0, 0.0
        self.trem = 0               # (10/11) trem de pouso: 1 = baixado (só p/ desenhar nos outros)
        self.t_reab = 0.0
        self.t_flare = -99.0
        self.t_missil_bot = 0.0
        self.conta = None          # id da conta (None = bot ou convidado: fora do ranking)
        self.seq = 0               # abates seguidos sem morrer
        self.t_entrou = time.monotonic()
        self.time = 'azul' if (sala == 'live' and not bot) else None   # live: azul = do lado do host, vermelho = contra
        self.chave = None          # live: @ do TikTok dono deste avião
        self.esc = 1               # live: chefão é maior
        self.temp = False          # live: some quando morre (ondas, chefões)
        self.t_ativo = time.monotonic()
        self.furia_ate = 0.0
        self.t_alvo, self.alvo_id = 0.0, None
        self.av = None             # live: foto do perfil (URL https do TikTok)
        self.dono_chave = None     # live: @ de quem criou (navios/chefão contam p/ a pessoa)
        self.balas = BALAS_MAX      # (11/11) munição do canhão (só conta na sala com bots)
        self.pontaria = random.uniform(0.014, 0.035)   # bot: erro de mira (rad) — cada piloto é de um jeito
        self.nivel = NIVEL.get(nome.lower(), NIVEL_INI) if not bot else 1.0   # (18/11) dificuldade escondida (humano)
        self.mortes_seg = 0        # mortes seguidas sem derrubar ninguém
        self.navio = False         # live: navio com metralhadora antiaérea
        self.vel_seg = None        # (19/11) ala/escolta: velocidade p/ alcançar quem segue


class Missil:
    def __init__(self, dono, alvo, base=None):
        self.id = _prox_m[0]; _prox_m[0] += 1
        self.dono, self.alvo, self.base = dono, alvo, base
        self.t = 0.0
        if base is not None:   # SAM: sai da base subindo em direção ao alvo
            vivos = [LANC[base][k] for k in range(len(LANC[base])) if not LANC_MORTO[base][k]] or [BASES[base]]
            b = random.choice(vivos)
            self.sala = BASE_SALA[base]
            self.p = [b[0], b[1] + 8, b[2]]
            d = norm([alvo.p[i] - self.p[i] for i in range(3)])
            self.f = norm([d[0], d[1] + 1.2, d[2]])
            self.vel = 120.0
            return
        self.sala = dono.sala
        f = norm(dono.v) if dot(dono.v, dono.v) > 1 else [1, 0, 0]
        self.p = [dono.p[i] + f[i] * 12 - (0, 3, 0)[i] for i in range(3)]
        self.f = f
        self.vel = max(150.0, math.sqrt(dot(dono.v, dono.v)))


async def mandar(a, msg):
    if a.ws is None or a.ws.closed:
        return
    try:
        await a.ws.send_str(msg if isinstance(msg, str) else json.dumps(msg, separators=(',', ':')))
    except Exception:
        pass


async def todos(msg, sala, exceto=None):
    s = json.dumps(msg, separators=(',', ':'))
    await asyncio.gather(*(mandar(a, s) for a in list(AV.values()) if not a.bot and a is not exceto and a.sala == sala))


async def placar(sala):
    l = [a for a in AV.values() if a.sala == sala]
    msg = {'t': 'placar', 'l': [{'id': a.id, 'nome': a.nome, 'cor': a.cor, 'bot': a.bot,
                                 'pontos': a.pontos, 'mortes': a.mortes, 'base': a.base,
                                 'conv': not a.bot and a.conta is None, 'vm': getattr(a, 'vida_max', 100), 'tipo': getattr(a, 'tipo', None), 'time': a.time, 'esc': a.esc, 'navio': a.navio, 'av': a.av,
                                 'kh': LIVE['derrubou'].get(a.dono_chave, 0) if a.dono_chave else 0} for a in l]}
    await todos(msg, sala)


async def matar(alvo, por, arma='canhao'):
    if not alvo.vivo:
        return
    alvo.vivo, alvo.vida = False, 0
    alvo.alvo_id = None
    alvo.mortes += 1
    alvo.t_morte = time.monotonic()
    if por is not None and por is not alvo:
        por.pontos += 1
        por.seq += 1
        contas.somar(por.conta, por.sala, abates=1, abates_missil=1 if arma == 'missil' else 0)
        contas.recorde_seq(por.conta, por.sala, por.seq)
    contas.somar(alvo.conta, alvo.sala, mortes=1)
    if not alvo.bot and (por is None or por.bot) and por is not alvo:   # morreu p/ bot, SAM ou antiaérea: alivia
        alvo.mortes_seg += 1
        ajusta_nivel(alvo, -0.08 * (1 + 0.5 * min(3, alvo.mortes_seg - 1)))
    if por is not None and por is not alvo and not por.bot:            # humano derrubou alguém: aperta
        por.mortes_seg = 0
        ajusta_nivel(por, 0.04 * (1 + 0.3 * min(3, por.seq - 1)))
    alvo.seq = 0
    if alvo.sala == 'live':
        live_abate(alvo, por)
        await todos(live_rank_msg(), 'live')   # antes do abate: a tela de morte já mostra o pódio
    msg = {'t': 'abate', 'alvo': alvo.id, 'por': por.id if por and por is not alvo else None, 'p': alvo.p, 'arma': arma}
    if alvo.sala == 'live' and por is not None and por.dono_chave:
        msg['kh'] = LIVE['derrubou'].get(por.dono_chave, 0)
    await todos(msg, alvo.sala)
    await placar(alvo.sala)


async def dano(alvo, qto, por, arma='canhao'):
    if not alvo.vivo:
        return
    alvo.vida = max(0, alvo.vida - qto)
    if alvo.vida <= 0:
        await matar(alvo, por, arma)


def pode_travar(a, alvo):
    """Confere a trava pelo lado do servidor: alvo vivo, até 3 km e na frente do nariz (cone de 40°)."""
    if not alvo or alvo is a or not alvo.vivo or not a.vivo or alvo.sala != a.sala or alvo.navio:
        return False
    d = math.dist(a.p, alvo.p)
    if d > 3000 or d < 1:
        return False
    f = norm(a.v) if dot(a.v, a.v) > 1 else a.f
    return dot(f, norm([alvo.p[i] - a.p[i] for i in range(3)])) > math.cos(math.radians(40))


async def lancar(a, alvo):
    if a.misseis <= 0 or not pode_travar(a, alvo):
        return
    if a.misseis == MISSEIS_MAX:
        a.t_recarga = time.monotonic()
    a.misseis -= 1
    m = Missil(a, alvo)
    MIS[m.id] = m
    await todos({'t': 'missil', 'id': m.id, 'dono': a.id, 'alvo': alvo.id}, a.sala)
    if not a.bot:
        await mandar(a, {'t': 'mun', 'm': a.misseis})


async def soltar_flare(a):
    agora = time.monotonic()
    if not a.vivo or agora - a.t_flare < ESPERA_FLARE:
        return
    a.t_flare = agora
    for m in MIS.values():
        if m.alvo is a and random.random() < 0.7:   # 70% dos mísseis vão atrás do flare
            m.alvo = None
    await todos({'t': 'flare', 'id': a.id}, a.sala)
    if not a.bot:
        await mandar(a, {'t': 'flareok', 'espera': ESPERA_FLARE})


async def voar_misseis(dt, agora):
    for m in list(MIS.values()):
        m.t += dt
        m.vel = min(430.0, m.vel + 200 * dt)
        alvo = m.alvo if m.alvo and m.alvo.vivo and m.alvo.id in AV else None
        if alvo:
            d = math.dist(alvo.p, m.p)
            t = min(2.0, d / max(m.vel, 1))
            des = norm([alvo.p[i] + alvo.v[i] * t * 0.6 - m.p[i] for i in range(3)])
            ang = math.acos(max(-1.0, min(1.0, dot(m.f, des))))
            passo = 2.4 * dt
            m.f = norm([m.f[i] + (des[i] - m.f[i]) * min(1.0, passo / max(ang, 1e-6)) for i in range(3)])
        m.p = [m.p[i] + m.f[i] * m.vel * dt for i in range(3)]
        acabou = m.t > 9 or m.p[1] < relevo(m.p[0], m.p[2])   # (18/11) míssil bate no morro
        if alvo and math.dist(alvo.p, m.p) < 20:
            await todos({'t': 'boom', 'p': [round(x, 1) for x in m.p], 'acertou': alvo.id}, m.sala)
            if m.base is not None:
                await dano(alvo, DANO_SAM, None, 'sam')
            else:
                await dano(alvo, DANO_MISSIL, AV.get(m.dono.id), 'missil')
            acabou = True
        elif acabou:
            await todos({'t': 'boom', 'p': [round(x, 1) for x in m.p], 'acertou': 0}, m.sala)
        if acabou:
            MIS.pop(m.id, None)
    for a in AV.values():   # recarga dos mísseis: um a cada RECARGA_MISSIL (sala com bots: só no rasante)
        if not lim(a.sala) and a.misseis < MISSEIS_MAX and agora - a.t_recarga > RECARGA_MISSIL:
            a.misseis += 1
            a.t_recarga = agora
            if not a.bot:
                await mandar(a, {'t': 'mun', 'm': a.misseis})


def base_ocupada(i):
    return any(x.base == i and x.sala == BASE_SALA[i] for x in AV.values())


async def defesa_bases(agora):
    """(10/11) SAM: base atira em quem chega a menos de R_SAM dela, menos no dono da base.
    (11/11) vale p/ a sala com bots também (bots são alvo); base sem dono na sala fica quieta; + metralhadora AA."""
    ocup = [base_ocupada(i) for i in range(len(BASES))]
    for a in AV.values():
        if a.sala not in ORDEM_BASES or not a.vivo or (a.bot and a.sala == 'pvp'):
            continue
        for i, b in enumerate(BASES):
            if BASE_SALA[i] != a.sala or not ocup[i]:
                continue
            if i == a.base or math.hypot(a.p[0] - b[0], a.p[2] - b[2]) > R_SAM_SALA[a.sala] or a.p[1] > 6000:
                continue
            if not visada([b[0], b[1] + 15, b[2]], a.p):   # (18/11) atrás do morro o radar do SAM não vê
                continue
            if agora - T_SAM[i] < SAM_ESPERA or any(m.base == i and m.alvo is a for m in MIS.values()):
                continue
            if all(LANC_MORTO[i]):          # base com os 3 lançadores destruídos: sem defesa
                continue
            T_SAM[i] = agora + SAM_ESPERA * max(0.0, 1 / fac(a) - 1)   # (18/11) nível baixo: SAM demora mais
            m = Missil(None, a, base=i)
            MIS[m.id] = m
            await todos({'t': 'missil', 'id': m.id, 'dono': 0, 'base': i, 'alvo': a.id}, a.sala)
    # metralhadoras: cada bateria de pé atira no inimigo mais perto (alcance curto; de longe quase não acerta)
    for i, base in enumerate(LANC):
        if not ocup[i] or agora - T_AA[i] < AA_ESPERA:
            continue
        sala = BASE_SALA[i]
        if not any(not x.bot and x.sala == sala for x in AV.values()):
            continue
        T_AA[i] = agora
        for k, lp in enumerate(base):
            if LANC_MORTO[i][k]:
                continue
            boca = [lp[0], lp[1] + 6, lp[2]]
            cand = [a for a in AV.values() if a.sala == sala and a.vivo and a.base != i and math.dist(a.p, boca) < R_AA and visada(boca, a.p)]
            if not cand:
                continue
            alvo = min(cand, key=lambda a: math.dist(a.p, boca))
            d = math.dist(alvo.p, boca)
            t = d / 900
            mira = [alvo.p[j] + alvo.v[j] * t + random.gauss(0, 5 + d * 0.02) for j in range(3)]
            await todos({'t': 'tiro', 'id': 0, 'p': [round(x, 1) for x in boca], 'd': [round(x, 3) for x in norm([mira[j] - boca[j] for j in range(3)])]}, sala)
            if random.random() < 0.3 * (1 - d / R_AA) ** 1.5 * min(1.0, fac(alvo)):
                await dano(alvo, DANO_AA, None, 'sam')


async def soltar_bomba(a, p, v):
    agora = time.monotonic()
    if not a.vivo or a.bombas <= 0 or agora - a.t_bomba < 0.25:
        return
    if math.dist(p, a.p) > 60 or math.dist(v, a.v) > 80:   # tem que sair de perto do avião, com a velocidade dele
        return
    if a.bombas == BOMBAS_MAX:
        a.t_rec_bomba = agora
    a.bombas -= 1
    a.t_bomba = agora
    bid = _prox_m[0]; _prox_m[0] += 1
    BOMBAS[bid] = {'dono': a, 'sala': a.sala, 'p': list(p), 'v': list(v), 't': 0.0}
    await todos({'t': 'bomba', 'id': bid, 'dono': a.id, 'p': [round(x, 1) for x in p], 'v': [round(x, 1) for x in v]}, a.sala)
    if not a.bot:
        await mandar(a, {'t': 'bombas', 'n': a.bombas})


async def explodir_bomba(bid, p):
    b = BOMBAS.pop(bid, None)
    if not b:
        return
    dono, sala = b['dono'], b['sala']
    por = dono if dono.id in AV else None
    for alvo in list(AV.values()):
        if alvo.sala != sala or not alvo.vivo:
            continue
        d = math.dist(alvo.p, p)
        if d < R_BOMBA:
            await dano(alvo, DANO_BOMBA * (1 - d / R_BOMBA) + 10, por, 'bomba')
    if sala in ORDEM_BASES:
        mudou = False
        for i, base in enumerate(LANC):
            if BASE_SALA[i] != sala:
                continue
            for k, lp in enumerate(base):
                if not LANC_MORTO[i][k] and math.dist(lp, p) < R_LANCADOR:
                    LANC_MORTO[i][k] = time.monotonic()
                    mudou = True
                    print(f'lançador {i}/{k} destruído por {dono.nome}', flush=True)
        if mudou:
            await todos(sams_msg(), sala)


async def voar_bombas(dt, agora):
    for bid, b in list(BOMBAS.items()):
        b['t'] += dt
        v, p = b['v'], b['p']
        v[1] -= G_BOMBA * dt
        v[0] *= 1 - ARRASTO_BOMBA * dt
        v[2] *= 1 - ARRASTO_BOMBA * dt
        for i in range(3):
            p[i] += v[i] * dt
        chao = relevo(p[0], p[2])                   # (18/11) o servidor também conhece as ilhas
        if p[1] <= chao and 'toque' not in b:
            b['toque'] = [p[0], chao, p[2]]          # onde tocou o chão
        if p[1] < chao - 60 or b['t'] > 40:   # o cliente não avisou (lento ou saiu): explode onde tocou
            await explodir_bomba(bid, b.get('toque') or [p[0], 0.0, p[2]])
    for a in AV.values():   # recarga: uma bomba a cada RECARGA_BOMBA (sala com bots: só no rasante)
        if not lim(a.sala) and a.bombas < BOMBAS_MAX and agora - a.t_rec_bomba > RECARGA_BOMBA:
            a.bombas += 1
            a.t_rec_bomba = agora
            if not a.bot:
                await mandar(a, {'t': 'bombas', 'n': a.bombas})
    mudou = False                       # lançadores reconstruídos
    for base in LANC_MORTO:
        for k, t in enumerate(base):
            if t and agora - t > VOLTA_LANC:
                base[k] = 0.0
                mudou = True
    if mudou:
        await todos(sams_msg(), 'pvp')
        await todos(sams_msg(), 'bots')


def na_pista(a):
    if a.base is None:
        return False
    b = BASES[a.base]
    return math.hypot(a.p[0] - b[0], a.p[2] - b[2]) < 850 and a.p[1] < BASE_H + 130


async def rasantes(agora):
    """(11/11) sala com bots: rasante (< 130 m) em cima da própria base rearma tudo e conserta."""
    for a in AV.values():
        if a.sala not in MUN_LIMITADA or not a.vivo or agora - a.t_reab < 8 or not na_pista(a):
            continue
        if a.misseis >= MISSEIS_MAX and a.bombas >= BOMBAS_MAX and a.balas >= BALAS_MAX and a.vida >= 100:
            continue
        a.t_reab = agora
        a.vida, a.misseis, a.bombas, a.balas = 100, MISSEIS_MAX, BOMBAS_MAX, BALAS_MAX
        if not a.bot:
            await mandar(a, {'t': 'mun', 'm': a.misseis, 'g': a.balas})
            await mandar(a, {'t': 'bombas', 'n': a.bombas})
            await mandar(a, {'t': 'reabastecido'})


async def ajustar_bots():
    humanos = sum(1 for a in AV.values() if not a.bot and a.sala == 'bots')
    bots = [a for a in AV.values() if a.bot and a.sala == 'bots']
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
def frente_de(a):
    return a.f if a.bot else (norm(a.v) if dot(a.v, a.v) > 1 else a.f)


def ameaca_na_cauda(b, vivos):
    """Inimigo até 900 m, atrás de mim e apontando p/ mim (= vai atirar)."""
    pior = None
    for a in vivos:
        d = math.dist(a.p, b.p)
        if d > 900 or d < 1:
            continue
        de_mim = norm([a.p[i] - b.p[i] for i in range(3)])
        if dot(b.f, de_mim) < -0.2 and dot(frente_de(a), [-x for x in de_mim]) > 0.85:
            if not pior or d < pior[1]:
                pior = (a, d)
    return pior[0] if pior else None


MAX_EM_CIMA = 2   # (11/11) sala com bots: até 4 bots, só 1 atrás de cada humano; mais que isso, 2. O resto briga entre si


def alvo_todos(b, vivos, agora):
    """Todos contra todos: o mais perto (bot ou humano), com sorte no meio; segura o alvo ~12 s."""
    atual = AV.get(b.alvo_id)
    if atual and atual in vivos and agora - b.t_alvo < 12 and math.dist(atual.p, b.p) < 3000:
        return atual
    em_cima = {}
    for x in AV.values():
        if x.bot and x is not b and x.sala == b.sala and x.alvo_id is not None:
            em_cima[x.alvo_id] = em_cima.get(x.alvo_id, 0) + 1
    nbots = sum(1 for x in AV.values() if x.bot and x.sala == b.sala)
    lim = 1 if nbots <= 4 else MAX_EM_CIMA
    cand = [a for a in vivos if a.bot or em_cima.get(a.id, 0) < (1 if a.nivel < 0.6 else lim)]

    def custo(a):   # menor = melhor presa: perto, machucado, de costas p/ mim, ocupado com outro
        d = math.dist(a.p, b.p)
        para_mim = norm([b.p[i] - a.p[i] for i in range(3)])
        de_frente = dot(frente_de(a), para_mim)          # 1 = ele está me encarando
        k = (0.45 + 0.55 * a.vida / 100)
        k *= 1.6 if (de_frente > 0.7 and a.vida > 50) else 0.75 if de_frente < -0.3 else 1.0
        k *= 0.8 if (a.bot and a.alvo_id not in (None, b.id)) else 1.0
        if b.vida < 35 and a.vida > b.vida:              # machucado: só abate fácil
            k *= 3
        return d * k * random.uniform(0.85, 1.15)
    alvo = min(cand, key=custo) if cand else None
    b.alvo_id, b.t_alvo = (alvo.id if alvo else None), agora + random.uniform(-3, 3)
    return alvo


VEL_BALA, VIDA_BALA = 950.0, 1.25   # iguais ao cliente


def girar(f0, des, passo):
    """Gira f0 em direção a des no máximo 'passo' rad (rotação de verdade: funciona até com o alvo bem atrás)."""
    eixo = cross(f0, des)
    if dot(eixo, eixo) < 1e-6:            # alvo exatamente atrás (ou na frente): vira pelo lado (eixo vertical)
        eixo = [0, 1, 0] if abs(f0[1]) < 0.95 else [1, 0, 0]
    eixo = norm(eixo)
    c, s_ = math.cos(passo), math.sin(passo)
    kxf = cross(eixo, f0)
    kdf = dot(eixo, f0)
    return norm([f0[i] * c + kxf[i] * s_ + eixo[i] * kdf * (1 - c) for i in range(3)])


def passa_perto(p0, vb, alvo):
    """Menor distância entre a bala (p0 + vb*t) e o alvo (andando reto), durante a vida da bala."""
    rp = [alvo.p[i] - p0[i] for i in range(3)]
    rv = [alvo.v[i] - vb[i] for i in range(3)]
    vv = dot(rv, rv) or 1e-9
    t = max(0.0, min(VIDA_BALA, -dot(rp, rv) / vv))
    return math.dist([rp[i] + rv[i] * t for i in range(3)], [0, 0, 0])


async def voar_bot(b, dt, agora):
    if not b.vivo:
        if e_missao(b.sala):            # (19/11) missão: abatido fica abatido
            return
        if b.sala == 'live':
            await live_renascer(b, agora)
            return
        if agora - b.t_morte > 4:
            b.p, b.f = ponto_base(b.base) if b.base is not None else ponto_nascer()
            b.vida, b.vivo, b.bank = 100, True, 0.0
            b.misseis, b.bombas, b.balas = MISSEIS_MAX, BOMBAS_MAX, BALAS_MAX
        return
    if getattr(b, 'papel', None) == 'bomb':
        await voar_bombardeiro(b, dt)
        return
    vivos = [a for a in AV.values() if a.vivo and a is not b and a.sala == b.sala and ve(b, a, agora)]   # (18/11) atrás do morro o bot não vê
    if e_missao(b.sala):   # (19/11) missão: só ataca o outro time
        vivos = [a for a in vivos if a.time != b.time and math.dist(a.p, b.p) < 4500]   # só briga com quem está perto (ala segue, escolta escolta)
    furia = agora < b.furia_ate

    def dist(a):
        return math.dist(a.p, b.p)
    if b.sala == 'live':
        alvo = live_alvo(b, vivos, agora, furia)
    else:
        alvo = alvo_todos(b, vivos, agora)
    C = AV.get(getattr(b, 'caca', None))
    if C and C.vivo and (not alvo or (alvo is not C and math.dist(alvo.p, b.p) > 900)):
        alvo = C   # (19/11) missão 3: vai no cargueiro, a não ser que tenha alguém colado
    modo = None
    if b.sala == 'bots' or e_missao(b.sala):   # (11/11) deathmatch: matar mais E sobreviver (19/11: missões também)
        mis = [m for m in MIS.values() if m.alvo is b and math.dist(m.p, b.p) < 1600]
        cauda = ameaca_na_cauda(b, vivos)
        if mis:                       # míssil vindo: põe ele de lado (beam) e solta flare perto
            m = min(mis, key=lambda m: math.dist(m.p, b.p))
            dm = norm([b.p[i] - m.p[i] for i in range(3)])
            lado = norm(cross(dm, [0, 1, 0]))
            if dot(lado, b.f) < 0:
                lado = [-x for x in lado]
            des = norm([lado[0], -0.25 if b.p[1] > 700 else 0.3, lado[2]])
            modo = 'missil'
            if math.dist(m.p, b.p) < 650 and random.random() < 0.25:
                await soltar_flare(b)
        elif cauda:                   # tem alguém na cauda: quebra a curva p/ um lado e troca de altura
            if agora > getattr(b, 't_lado', 0):
                b.lado, b.t_lado = random.choice((-1, 1)), agora + random.uniform(2.5, 4.5)
            de_mim = norm([cauda.p[i] - b.p[i] for i in range(3)])
            lado = norm(cross(b.f, [0, 1, 0]))
            des = norm([lado[0] * b.lado - de_mim[0] * 0.3, (-0.5 if b.p[1] > 800 else 0.5), lado[2] * b.lado - de_mim[2] * 0.3])
            modo = 'defesa'
        elif b.base is not None and ((b.balas < 250 and b.misseis == 0) or b.balas < 40
                                     or (b.vida < 35 and (not alvo or alvo.vida > b.vida or dist(alvo) > 700))):
            # sem munição ou machucado: volta p/ a base e passa baixinho em cima da pista (rasante)
            bb = BASES[b.base]
            dh = math.hypot(bb[0] - b.p[0], bb[2] - b.p[2])
            alt = 90.0 if dh < 1800 else 160 + min(400.0, dh * 0.12)
            des = norm([(bb[0] - b.p[0]) / max(dh, 1), max(-0.35, min(0.35, (alt - b.p[1]) / max(250.0, dh * 0.5))), (bb[2] - b.p[2]) / max(dh, 1)])
            modo = 'casa'
    if modo:
        alvo_tiro = alvo if (alvo and dist(alvo) < 850) else None   # ainda atira se cruzar alguém na frente
        alvo = alvo_tiro
    elif alvo:
        d = dist(alvo)
        t = min(1.5, d / (VEL_BALA + 118 if lim(b.sala) else 950))
        mira = [alvo.p[i] + alvo.v[i] * t for i in range(3)]
        des = norm([mira[i] - b.p[i] for i in range(3)])
    elif getattr(b, 'segue', None) in AV and AV[b.segue].vivo:   # (19/11) escolta: cola no bombardeiro até achar alguém
        L = AV[b.segue]
        ponto = [L.p[0] + b.off[0], L.p[1] + b.off[1], L.p[2] + b.off[2]]
        b.vel_seg = min(260.0, max(118.0, math.sqrt(dot(L.v, L.v))) + max(0.0, math.dist(ponto, b.p) - 150) * 0.3)   # corre p/ alcançar
        des = norm([ponto[i] + L.v[i] * 2 - b.p[i] for i in range(3)])
    else:
        if not b.alvo_pts or math.dist(b.alvo_pts, b.p) < 300:
            x, z = random.uniform(-2500, 2500), random.uniform(-2500, 2500)
            b.rasante = random.random() < 0.35 and e_mar(x, z, 300)   # (18/11) às vezes patrulha rasante no mar (levanta água)
            b.alvo_pts = [x, 22.0 if b.rasante else random.uniform(500, 1400), z]
        des = norm([b.alvo_pts[i] - b.p[i] for i in range(3)])
    # (18/11) montanhas: olha o chão embaixo e à frente (400 e 900 m) e sobe antes do morro
    chao = max(relevo(b.p[0] + b.f[0] * k, b.p[2] + b.f[2] * k) for k in (0, 400, 900))
    piso = max(420.0, chao + 260) if modo != 'casa' else chao + 120
    if modo != 'casa' and chao < 1:   # (18/11) só mar à frente: pode descer p/ o rasante (patrulha baixa ou caçando alguém baixo)
        if alvo and alvo.p[1] < 420:
            piso = max(25.0, alvo.p[1] - 20)
        elif not alvo and getattr(b, 'rasante', False):
            piso = 25.0
    if b.p[1] < piso and (modo != 'casa' or chao > 30):
        des[1] += (piso - b.p[1]) / 120
    if b.p[1] > 2400:
        des[1] -= 0.6
    rh = math.hypot(b.p[0], b.p[2])
    b.modo = modo
    if rh > (BASE_R_BOTS + 900 if b.sala == 'bots' else 9500 if e_missao(b.sala) else ARENA) and modo != 'casa':   # sala com bots: bases a 5,8 km
        des[0] -= b.p[0] / rh * 1.5
        des[2] -= b.p[2] / rh * 1.5
    des = norm(des)
    f0 = b.f
    ang = math.acos(max(-1.0, min(1.0, dot(f0, des))))
    passo = (1.15 if furia or modo in ('missil', 'defesa') else 0.85) * dt * getattr(b, 'agil', 1.0)   # (19/11) Corvo vira mais
    if not modo and alvo is not None and not alvo.bot:
        passo *= 0.7 + 0.3 * min(1.0, fac(alvo))   # (18/11) contra humano fraco curva menos
    f1 = girar(f0, des, passo) if ang > passo else des
    omega_y = cross(f0, f1)[1] / max(dt, 1e-3)
    alvo_bank = max(-1.2, min(1.2, -omega_y * 1.6))
    b.bank += (alvo_bank - b.bank) * min(1.0, 3 * dt)
    b.f = f1
    vel = 135.0 if furia else (b.vel_seg if modo is None and not alvo and b.vel_seg else getattr(b, 'vel_cru', 118.0))
    b.vel_seg = None
    b.v = [f1[i] * vel for i in range(3)]
    b.p = [b.p[i] + b.v[i] * dt for i in range(3)]
    b.p[1] = max(b.p[1], relevo(b.p[0], b.p[2]) + 12)   # (18/11) nunca atravessa o morro
    b.q = quat_de(f1, b.bank)
    if b.sala != 'bots' and any(m.alvo is b and math.dist(m.p, b.p) < 900 for m in MIS.values()) and random.random() < 0.03:
        await soltar_flare(b)
    if alvo and alvo.vivo and agora - b.t_missil_bot > 7 / fac(alvo) and math.dist(alvo.p, b.p) < 2200 and random.random() < (0.05 if furia else 0.02) * fac(alvo):
        b.t_missil_bot = agora
        await lancar(b, alvo)
    if alvo and alvo.vivo:
        d = math.dist(alvo.p, b.p)
        dirr = norm([alvo.p[i] - b.p[i] for i in range(3)])
        if lim(b.sala):
            tl = d / (VEL_BALA + 118)
            dir_lead = norm([alvo.p[i] + alvo.v[i] * tl - b.p[i] for i in range(3)])   # o "◇" do bot
            if d < 900 and dot(f1, dir_lead) > math.cos(math.radians(4)) and agora - b.ult_tiro > 0.1 / min(1.0, fac(alvo)) and b.balas > 0:
                b.ult_tiro = agora
                b.balas -= 1
                sig = b.pontaria / fac(alvo) ** 1.3   # (18/11) nível baixo = mira pior
                tiro = norm([f1[i] + random.gauss(0, sig) for i in range(3)])
                await todos({'t': 'tiro', 'id': b.id, 'p': [round(x, 1) for x in b.p], 'd': [round(x, 3) for x in tiro]}, b.sala)
                if passa_perto(b.p, [tiro[i] * (VEL_BALA + 118) for i in range(3)], alvo) < 10:
                    await dano(alvo, DANO_TIRO, b)
        elif d < 850 and dot(f1, dirr) > math.cos(math.radians(6)) and agora - b.ult_tiro > 0.1:
            b.ult_tiro = agora
            await todos({'t': 'tiro', 'id': b.id, 'p': [round(x, 1) for x in b.p], 'd': [round(x, 3) for x in f1]}, b.sala)
            if random.random() < (0.16 if b.sala != 'live' else 0.18 if furia else 0.09) * fac(alvo):
                await dano(alvo, 6, b)


# ---------------------------------------------------------------- (19/11) MODO HISTÓRIA: "Operação Arquipélago"
# Cada missão roda numa sala particular 'm:<id do jogador>'. Munição sem recarga, morreu = missão fracassada.
# Estrelas: ⭐ cumpriu · ⭐ terminou com mais de metade da vida · ⭐ 3ª depende da missão (tempo, cargueiro...). Progresso salvo na conta.
CASA = 4                    # base de origem do Esquadrão Garoupa (a mesma ilha da sala com bots)
MISSAO = {}                 # sala -> estado da missão
COR_CINZA, COR_BOMB = '#e8443a', '#ff9a2a'
MIS_TUDO_LIBERADO = True    # (19/11) TESTE: todas as missões abertas (o Gomes pediu p/ testar; voltar p/ False depois)
ALT_RADAR, ALC_RADAR = 450.0, 7000.0   # missão 4: acima de 450 m o radar te vê (até 7 km, se o morro não tapar)


def _eixo():
    """Direção da base p/ o centro do arquipélago (no chão) e a posição da base."""
    b = BASES[CASA]
    return b, norm([-b[0], 0, -b[2]])


def _ponto(dist, alt, lado=0.0):
    b, f = _eixo()
    return [b[0] + f[0] * dist - f[2] * lado, alt, b[2] + f[2] * dist + f[0] * lado]


def _gira(f, graus):
    a = math.radians(graus)
    c, s_ = math.cos(a), math.sin(a)
    return norm([f[0] * c - f[2] * s_, 0, f[0] * s_ + f[2] * c])


def _cinza(sala, nome, p, f, cor=COR_CINZA, **kw):
    b = Aviao(nome, bot=True, sala=sala)
    b.p, b.f = list(p), norm(f)
    b.v = [b.f[i] * 118 for i in range(3)]
    b.q = quat_de(b.f, 0)
    b.time, b.cor = 'verm', cor
    for k, v in kw.items():
        setattr(b, k, v)
    AV[b.id] = b
    return b


def _ala(M, a, nome, lado):
    """Ala do Esquadrão Garoupa: voa colado em você e briga com o que aparecer (até 4,5 km)."""
    _, f = _eixo()
    b = _cinza(M['sala'], nome, _ponto(1450, 900, lado * 220), f, cor='#2f7de1',
               pontaria=0.03, misseis=1, segue=a.id, off=[lado * 220 * -f[2] - f[0] * 150, 0, lado * 220 * f[0] - f[2] * 150])
    b.time = 'azul'
    M['extras'].append(b.id)
    return b


def _bombardeiro(M, nome, p, f, **kw):
    b = _cinza(M['sala'], nome, p, f, cor=COR_BOMB, papel='bomb', esc=1.6, vida=200, vida_max=200,
               misseis=0, balas=0, vel_cru=88.0, **kw)
    M['alvos'].append(b.id)
    return b


def _escolta(M, lider, nome, lado, cima=0, **kw):
    f = lider.f
    off = [lado * 600 * -f[2] - f[0] * cima * 1.5, 150 + cima, lado * 600 * f[0] - f[2] * cima * 1.5]
    p = [lider.p[i] + off[i] for i in range(3)]
    b = _cinza(M['sala'], nome, p, f, pontaria=kw.pop('pontaria', 0.04), misseis=1, segue=lider.id, off=off, **kw)
    M['extras'].append(b.id)
    return b


def _terra(perto, rmin, rmax, hmin=80, hmax=520):
    """Ponto em ilha (morro baixo/médio) perto de 'perto' — onde dá p/ pôr um radar."""
    for _ in range(400):
        a, r = random.random() * math.tau, random.uniform(rmin, rmax)
        x, z = perto[0] + math.cos(a) * r, perto[2] + math.sin(a) * r
        h = relevo(x, z)
        if hmin < h < hmax:
            return [x, h, z]
    return None


# ---- missão 1: Primeiro voo
def _m1(M, a):
    _, f = _eixo()
    volta = [-f[0], 0, -f[2]]
    for i, nome in enumerate(('Cinzento 1', 'Cinzento 2')):
        b = _cinza(M['sala'], nome, _ponto(7200, 1000, (i - 0.5) * 500), volta, pontaria=0.055, misseis=0, balas=250)
        M['alvos'].append(b.id)
    M['t_alvo'] = 150
    M['radio'] = [(0, 'Torre', 'Garoupa 1, aqui é a Torre. Dois caças da Frota Cinzenta cruzaram a linha. Vá lá e derrube os dois.'),
                  (7, 'Torre', 'Eles aparecem no seu radar à frente. Munição contada: aqui não tem recarga.'),
                  (20, 'Torre', 'Dica: chegue por trás. Míssil só depois do quadrado ficar vermelho.')]
    M['fala'] = ('Torre', 'Céu limpo. Bom trabalho, novato. Volte p/ a base.')


# ---- missão 2: Interceptação
def _m2(M, a):
    _, f = _eixo()
    volta = [-f[0], 0, -f[2]]
    lider = None
    for i in range(2):
        b = _bombardeiro(M, f'Bombardeiro {i + 1}', _ponto(12500, 1500, (i - 0.5) * 300), volta)
        lider = lider or b
    for i, (lado, cima) in enumerate(((-1, 0), (0, 200), (1, 0))):
        _escolta(M, lider, f'Escolta {i + 1}', lado, cima)
    _ala(M, a, 'Garoupa 2', -1)
    _ala(M, a, 'Garoupa 3', 1)
    M['t_alvo'] = 130
    M['radio'] = [(0, 'Torre', 'Alerta, Garoupa 1! Dois bombardeiros da Frota Cinzenta vêm direto p/ a nossa base, com 3 caças de escolta.'),
                  (5, 'Garoupa 2', 'Garoupa 2 e 3 na sua asa, líder. A gente segura a escolta!'),
                  (11, 'Torre', 'Derrube os 2 bombardeiros antes que cheguem. Seus alas te ajudam com os caças.'),
                  (60, 'Torre', 'Eles estão chegando! Não deixe nenhum passar!')]
    M['fala'] = ('Corvo', '...Garoupa 1, é? Vou lembrar desse nome.')


# ---- missão 3: Escolta
def _m3(M, a):
    _, f = _eixo()
    c = _cinza(M['sala'], '📦 Pelicano', _ponto(2100, 1200), f, cor='#3cd070', papel='bomb', esc=1.8, vida=400, vida_max=400,
               misseis=0, balas=0, vel_cru=85.0, destino=BASES[6], alt=1200.0)
    c.time = 'azul'
    M['carga'] = c.id
    M['extras'].append(c.id)
    _ala(M, a, 'Garoupa 2', -1)
    _ala(M, a, 'Garoupa 3', 1)
    M['ondas'] = [(12, lambda M: _onda_carga(M, -1)), (40, lambda M: _onda_carga(M, 1)), (66, lambda M: _onda_carga(M, -1))]
    M['t_alvo'] = 999
    M['radio'] = [(0, 'Torre', 'Garoupa 1, o cargueiro Pelicano leva peças p/ a base Sul, do outro lado do arquipélago. Escolte até lá.'),
                  (5, 'Pelicano', 'Pelicano no ar. Contamos com vocês, Garoupa!')]
    M['fala'] = ('Pelicano', 'Pousamos inteiros! Devemos uma, Garoupa.')


def _onda_carga(M, lado):
    C = AV.get(M['carga'])
    if not C or not C.vivo:
        return
    f = C.f
    for k in range(2):
        p = [C.p[0] + f[0] * 3200 - f[2] * lado * (2600 + k * 300), 1300 + k * 120, C.p[2] + f[2] * 3200 + f[0] * lado * (2600 + k * 300)]
        b = _cinza(M['sala'], f'Cinzento {len(M["alvos"]) + 1}', p, [C.p[i] - p[i] for i in range(3)],
                   pontaria=0.045, misseis=1, caca=C.id)
        M['alvos'].append(b.id)
    M['onda'] = M.get('onda', 0) + 1
    _diz(M, 'Torre', f'Dois caças vindo pela {"esquerda" if lado < 0 else "direita"} do Pelicano! ({M["onda"]}/3)')


# ---- missão 4: Olhos cegos (radares em terra; acima de 450 m eles te travam e soltam míssil)
def _m4(M, a):
    centro = _ponto(5800, 0)
    usados = []
    for i in range(3):
        p = None
        for _ in range(30):
            p = _terra(centro, 1200, 4200)
            if p and all(math.dist(p, u) > 2200 for u in usados):
                break
        if not p:
            p = _ponto(5800 + (i - 1) * 2500, relevo(*_ponto(5800 + (i - 1) * 2500, 0)[::2]))
        usados.append(p)
        b = _cinza(M['sala'], f'📡 Radar {i + 1}', p, [1, 0, 0], cor='#ff7f2a', navio=True, papel='radar', tipo='radar',
                   vida=120, vida_max=120, misseis=99, balas=0, t_lock=0.0, t_sam=0.0)
        b.v = [0, 0, 0]
        M['alvos'].append(b.id)
    a.bombas = 4
    _ala(M, a, 'Garoupa 2', -1)
    M['t_alvo'] = 240
    M['radio'] = [(0, 'Torre', 'Garoupa 1, a Frota Cinzenta montou 3 radares nas ilhas. Enquanto eles estiverem de pé, a gente está cego.'),
                  (7, 'Torre', f'Acima de {int(ALT_RADAR)} m eles te veem e disparam míssil. Voe baixo, entre os morros, e destrua os 3.'),
                  (16, 'Garoupa 2', 'Os radares são os pontos laranja no mapa. Canhão ou bomba derrubam!')]
    M['fala'] = ('Torre', 'Radares no chão! Agora quem está cego são eles.')


async def radar_passo(b, dt, agora):
    """Radar da missão 4: trava quem passa acima de ALT_RADAR a menos de ALC_RADAR (e com visada); 2,5 s travado = míssil."""
    if not b.vivo:
        return
    topo = [b.p[0], b.p[1] + 20, b.p[2]]
    vistos = [a for a in AV.values() if a.sala == b.sala and a.vivo and a.time != b.time and not a.navio
              and a.p[1] > ALT_RADAR and math.dist(a.p, topo) < ALC_RADAR and visada(topo, a.p)]
    if not vistos:
        b.t_lock = max(0.0, b.t_lock - dt)
        return
    alvo = min(vistos, key=lambda a: math.dist(a.p, topo))
    b.t_lock += dt
    M = MISSAO.get(b.sala)
    if M and not alvo.bot and agora - M.get('t_aviso', 0) > 9:
        M['t_aviso'] = agora
        _diz(M, 'Torre', f'📡 {b.nome[2:]} te pegou! Desça abaixo de {int(ALT_RADAR)} m!')
    if b.t_lock < 2.5 or agora - b.t_sam < 7 / fac(alvo):
        return
    b.t_sam, b.t_lock = agora, 0.0
    m = Missil(b, alvo)
    m.p = [b.p[0], b.p[1] + 25, b.p[2]]
    m.f = norm([alvo.p[i] - m.p[i] + (0, 600, 0)[i] for i in range(3)])
    MIS[m.id] = m
    await todos({'t': 'missil', 'id': m.id, 'dono': b.id, 'alvo': alvo.id}, b.sala)


# ---- missão 5: Defender a base (3 ondas de bombardeiros de lados diferentes)
def _m5(M, a):
    _ala(M, a, 'Garoupa 2', -1)
    _ala(M, a, 'Garoupa 3', 1)
    a.balas, a.misseis = 600, 4
    M['ondas'] = [(4, lambda M: _onda_base(M, 0, 2, 2)), (50, lambda M: _onda_base(M, -55, 3, 2)), (96, lambda M: _onda_base(M, 55, 2, 3))]
    M['n_ondas'] = 3
    M['t_alvo'] = 220
    M['radio'] = [(0, 'Torre', 'Garoupa, é agora: a Frota Cinzenta vai atacar a base com tudo. Três ondas.'),
                  (6, 'Torre', 'Bombardeiro que chegar em cima da base = base perdida. Os caças são problema dos seus alas.')]
    M['fala'] = ('Torre', 'A base está de pé! Ninguém passou. Ninguém!')


def _onda_base(M, graus, nb, ne):
    casa, f = _eixo()
    d = _gira(f, graus)
    volta = [-d[0], 0, -d[2]]
    centro = [casa[0] + d[0] * 9500, 1500, casa[2] + d[2] * 9500]
    lider = None
    for i in range(nb):
        lado = (i - (nb - 1) / 2) * 320
        b = _bombardeiro(M, f'Bombardeiro {len(M["alvos"]) + 1}', [centro[0] - d[2] * lado, 1500, centro[2] + d[0] * lado], volta)
        lider = lider or b
    for i in range(ne):
        _escolta(M, lider, f'Escolta {len(M["extras"])}', (-1, 1, 0)[i % 3], 200 if i == 2 else 0)
    M['onda'] = M.get('onda', 0) + 1
    lado = 'de frente' if graus == 0 else 'pela esquerda' if graus < 0 else 'pela direita'
    _diz(M, 'Torre', f'Onda {M["onda"]}/3: {nb} bombardeiros vindo {lado}!')


# ---- missão 6: Bombardeio (afundar a frota)
def _m6(M, a):
    p0 = ponto_mar([0, 0, 0], 800, 2600) or [0.0, 0.0, 0.0]
    ang = random.random() * math.tau
    f = [math.cos(ang), 0, math.sin(ang)]
    navios = []
    for i in range(4):
        p = p0 if i == 0 else (ponto_mar(p0, 250, 700) or p0)
        b = _cinza(M['sala'], f'🚢 Cinzento {i + 1}', [p[0], 0.0, p[2]], f, cor='#8a96a8', navio=True,
                   vida=VIDA_NAVIO, vida_max=VIDA_NAVIO, misseis=0, balas=0)
        b.v = [f[0] * VEL_NAVIO, 0, f[2] * VEL_NAVIO]
        M['alvos'].append(b.id)
        navios.append(b)
    for i, lado in enumerate((-1, 1)):   # patrulha aérea em cima da frota
        b = _cinza(M['sala'], f'Patrulha {i + 1}', [p0[0] + lado * 900, 1100, p0[2]], f, pontaria=0.04, misseis=1,
                   segue=navios[0].id, off=[lado * 900, 1100, 0])
        M['extras'].append(b.id)
    _ala(M, a, 'Garoupa 2', -1)
    a.bombas, a.misseis = 8, 2
    M['t_alvo'] = 240
    M['radio'] = [(0, 'Torre', 'Garoupa 1, achamos a frota cinzenta: 4 navios no meio do arquipélago. Afunde todos.'),
                  (7, 'Torre', 'Você leva 8 bombas. O anel vermelho no mar mostra onde ela cai. Cuidado com a metralhadora dos navios abaixo de 900 m.'),
                  (15, 'Garoupa 2', 'Eu cuido da patrulha aérea, líder!')]
    M['fala'] = ('Corvo', 'Minha frota... Você vai pagar por isso, Garoupa.')


# ---- missão 7: Tempestade (neblina pesada: só o radar ajuda)
def _m7(M, a):
    _, f = _eixo()
    volta = [-f[0], 0, -f[2]]
    for i in range(4):
        b = _cinza(M['sala'], f'Cinzento {i + 1}', _ponto(6500 + (i % 2) * 600, 900 + i * 90, (i - 1.5) * 700), volta,
                   pontaria=0.045, misseis=1)
        M['alvos'].append(b.id)
    _ala(M, a, 'Garoupa 2', 1)
    M['clima'] = 'tempestade'
    M['t_alvo'] = 200
    M['radio'] = [(0, 'Torre', 'Garoupa 1, tempestade feia sobre o arquipélago. Quatro caças inimigos estão usando ela p/ se esconder.'),
                  (8, 'Torre', 'Você não vai ver nada a olho. Confie no radar e na seta do HUD.'),
                  (40, 'Garoupa 2', 'Não enxergo nem minha asa! Fica no radar, líder.')]
    M['fala'] = ('Torre', 'Saiu da tempestade inteiro? Você é dos bons, Garoupa.')


# ---- missão 8: Corvo (duelo contra o ás)
def _m8(M, a):
    _, f = _eixo()
    volta = [-f[0], 0, -f[2]]
    b = _cinza(M['sala'], '🦅 Corvo', _ponto(6800, 1100), volta, cor='#b05be0', pontaria=0.013, misseis=3,
               vida=220, vida_max=220, agil=1.4, vel_cru=128.0, balas=900)
    M['alvos'].append(b.id)
    M['corvo'] = b.id
    a.balas, a.misseis = 600, 3
    M['t_alvo'] = 180
    M['radio'] = [(0, 'Torre', 'Garoupa 1... é ele. O Corvo, o ás da Frota Cinzenta, quer duelo. Só você e ele, nas montanhas.'),
                  (6, 'Corvo', 'Então você é o novato que derrubou meus bombardeiros. Vamos ver do que é feito.'),
                  (35, 'Corvo', 'Lento demais, Garoupa!'),
                  (75, 'Corvo', 'Ainda está vivo? Interessante...')]
    M['fala'] = ('Torre', 'O CORVO CAIU! A Frota Cinzenta está recuando. O arquipélago é nosso, Garoupa 1!')


MISSOES = {1: _m1, 2: _m2, 3: _m3, 4: _m4, 5: _m5, 6: _m6, 7: _m7, 8: _m8}


def _diz(M, quem, txt):
    M['radio'].insert(0, (0, quem, txt))


def missao_iniciar(a, n):
    M = {'sala': a.sala, 'n': n, 'dono': a.id, 'nasceu': False, 't0': 0.0, 'fim': False,
         'alvos': [], 'extras': [], 'radio': [], 'ondas': [], 'mortos': 0, 'obj': '', 't_alvo': 120, 'fala': None}
    MISSAO[a.sala] = M
    a.time = 'azul'
    a.balas, a.misseis, a.bombas = 400, 2, 0
    MISSOES[n](M, a)
    b, f = _eixo()
    p = _ponto(1600, 900 if n != 4 else 380)
    print(f'missão {n} começou p/ {a.nome}', flush=True)
    return {'missao': n, 'nasce': [p, math.atan2(-f[2], f[0])], 'time': 'azul', 'clima': M.get('clima')}


def missao_limpar(sala):
    M = MISSAO.pop(sala, None)
    if M:
        for i in M['alvos'] + M['extras']:
            AV.pop(i, None)
        for m in [m for m in MIS.values() if m.sala == sala]:
            MIS.pop(m.id, None)


def _checa(M, a, agora):
    """-> (ok, motivo, objetivo na tela). ok None = continua."""
    t = agora - M['t0']
    while M['ondas'] and t >= M['ondas'][0][0]:
        M['ondas'].pop(0)[1](M)
    n = M['n']
    alvos = [AV.get(i) for i in M['alvos']]
    vivos = [b for b in alvos if b and b.vivo]
    mortos = len(alvos) - len(vivos)
    falta = len(vivos)
    if n == 3:
        C = AV.get(M['carga'])
        if not C or not C.vivo:
            return False, '💥 O Pelicano foi derrubado.', '📦 Pelicano abatido'
        d = math.hypot(C.destino[0] - C.p[0], C.destino[2] - C.p[2])
        pct = round(100 * C.vida / 400)
        if pct < 50 and not M.get('aviso50'):
            M['aviso50'] = True
            _diz(M, 'Pelicano', 'Estamos sendo atingidos! Tirem eles daqui!')
        _comenta(M, mortos, 0)
        obj = f'📦 Pelicano: {pct}% · chega em {max(0, int((d - 350) / 85))} s · onda {M.get("onda", 0)}/3'
        if getattr(C, 'chegou', False):
            M['estrela3'] = ('Pelicano com mais de 50%', pct >= 50, f'{pct}%')
            return True, None, obj
        return None, None, obj
    if n in (2, 5):   # bombardeiros: se um chega, perdeu
        if any(getattr(b, 'chegou', False) for b in vivos):
            return False, '💥 Um bombardeiro chegou e bombardeou a base!', M['obj']
        casa = BASES[CASA]
        perto = min((math.hypot(b.p[0] - casa[0], b.p[2] - casa[2]) for b in vivos), default=0)
        chega = f' · chegam em {max(0, int((perto - 350) / 88))} s' if vivos else ''
        onda = f'🏰 Onda {M.get("onda", 0)}/3 · ' if n == 5 else ''
        obj = f'{onda}💣 Bombardeiros derrubados: {mortos}/{len(alvos)}{chega}'
        if n == 5 and (M['ondas'] or M.get('onda', 0) < 3):
            _comenta(M, mortos, 0)
            return None, None, obj
    elif n == 4:
        obj = f'📡 Radares destruídos: {mortos}/{len(alvos)} · fique abaixo de {int(ALT_RADAR)} m'
    elif n == 6:
        obj = f'🚢 Navios afundados: {mortos}/{len(alvos)} · 💣 {a.bombas} bombas'
        if a.bombas == 0 and falta and not any(x['dono'] is a for x in BOMBAS.values()):
            return False, '💣 Acabaram as bombas e ainda tem navio boiando.', obj
    elif n == 8:
        C = AV.get(M['corvo'])
        pct = round(100 * C.vida / 220) if C and C.vivo else 0
        if 0 < pct < 50 and not M.get('aviso50'):
            M['aviso50'] = True
            _diz(M, 'Corvo', 'Nada mal, novato... mas eu ainda não terminei!')
        obj = f'🦅 Corvo: {pct}%'
        return (True, None, obj) if not falta else (None, None, obj)
    else:
        obj = f'🎯 Caças inimigos derrubados: {mortos}/{len(alvos)}'
    _comenta(M, mortos, falta)
    if not falta:
        return True, None, obj
    return None, None, obj


def _comenta(M, mortos, falta):
    if mortos > M['mortos']:
        M['mortos'] = mortos
        if falta or M['n'] in (3, 5):
            _diz(M, 'Torre', random.choice(('Um a menos! Continue.', 'Abatido! Boa, Garoupa.', 'Na mosca!' + (f' Falta{"m" if falta > 1 else ""} {falta}.' if falta else ''))))


async def missoes_passo(agora):
    for sala, M in list(MISSAO.items()):
        a = AV.get(M['dono'])
        if not a or M['fim'] or not M['nasceu']:
            continue
        t = agora - M['t0']
        ok, motivo, obj = _checa(M, a, agora)
        while M['radio'] and t >= M['radio'][0][0]:
            _, quem, txt = M['radio'].pop(0)
            await mandar(a, {'t': 'radio', 'quem': quem, 'txt': txt})
        if obj != M['obj']:
            M['obj'] = obj
            await mandar(a, {'t': 'obj', 'txt': obj})
        if not a.vivo:
            ok, motivo = False, '💀 Você foi abatido.'
        if ok is None:
            continue
        M['fim'] = True
        est, crit = 0, []
        if ok:
            e3 = M.get('estrela3') or ('Tempo até ' + f"{M['t_alvo'] // 60}:{M['t_alvo'] % 60:02d}", t <= M['t_alvo'], f'{int(t) // 60}:{int(t) % 60:02d}')
            est = 1 + (a.vida >= 50) + bool(e3[1])
            crit = [('Cumpriu', True, ''), ('Vida acima de 50%', a.vida >= 50, f'{round(a.vida)}%'), e3]
            contas.missao_feita(a.conta, M['n'], est, round(t, 1))
        print(f'missão {M["n"]} de {a.nome}: {"ok" if ok else "falhou"} {est}★ {t:.0f}s', flush=True)
        await mandar(a, {'t': 'fim', 'ok': ok, 'n': M['n'], 'estrelas': est, 'tempo': round(t), 't_alvo': M['t_alvo'],
                         'vida': a.vida, 'motivo': motivo, 'fala': M['fala'] if ok else None, 'crit': crit})


async def voar_bombardeiro(b, dt):
    """Voa reto p/ o destino (base de origem, ou a do cargueiro) na altitude dele; chegou em cima (350 m) = chegou."""
    casa = getattr(b, 'destino', None) or BASES[CASA]
    alt = getattr(b, 'alt', 1500.0)
    dh = math.hypot(casa[0] - b.p[0], casa[2] - b.p[2])
    if dh < 350:
        b.chegou = True
    des = norm([(casa[0] - b.p[0]) / max(dh, 1), (alt - b.p[1]) / 400, (casa[2] - b.p[2]) / max(dh, 1)])
    f1 = girar(b.f, des, 0.3 * dt)
    b.f = f1
    b.v = [f1[i] * b.vel_cru for i in range(3)]
    b.p = [b.p[i] + b.v[i] * dt for i in range(3)]
    b.p[1] = max(b.p[1], relevo(b.p[0], b.p[2]) + 60)
    b.q = quat_de(f1, 0)


async def laco(app):
    dt = 0.05
    while True:
        t0 = time.monotonic()
        try:
            for b in [a for a in AV.values() if a.bot]:
                await (navegar(b, dt, t0) if b.navio else voar_bot(b, dt, t0))
            await voar_misseis(dt, t0)
            await voar_bombas(dt, t0)
            await defesa_bases(t0)
            await rasantes(t0)
            await missoes_passo(t0)
            for sala in {a.sala for a in AV.values() if not a.bot}:
                j = [[a.id] + [round(x, 1) for x in a.p] + [round(x, 4) for x in a.q] + [round(x, 1) for x in a.v]
                     + [a.vida, 1 if a.vivo else 0, a.trem] for a in AV.values() if a.sala == sala]
                m = [[x.id] + [round(v, 1) for v in x.p] + [round(x.f[i] * x.vel, 1) for i in range(3)]
                     + [x.alvo.id if x.alvo else 0] for x in MIS.values() if x.sala == sala]
                await todos({'t': 'snap', 'j': j, 'm': m}, sala)
        except Exception as e:  # o laço nunca pode morrer
            print('laço:', e, flush=True)
        await asyncio.sleep(max(0.0, dt - (time.monotonic() - t0)))


# ---------------------------------------------------------------- (10/11) sala da LIVE do TikTok
# Quem comenta vira um caça (com o nome dele). Presentes dão poderes p/ o time que a pessoa escolheu.
# Eventos chegam por POST /api/live (do simulador ou da ponte do TikTok), só da rede de casa.
LIVE_MAX = int(os.environ.get('LIVE_MAX', 12))          # aviões do chat ao mesmo tempo
LIVE_OCIOSO = 180.0                                      # sem comentar por 3 min: o avião sai
LIVE_CURTIDAS = int(os.environ.get('LIVE_CURTIDAS', 500))  # curtidas p/ soltar uma onda
LIVE = {'vs': [0, 0], 'avatares': {}, 'curtidas': 0, 'times': {}, 'derrubou': {}, 'moedas': {}, 'nomes': {}}
COR_AZUL, COR_OURO = '#4aa3ff', '#ffd23a'
CORES_VERM = ['#e8443a', '#ff7f2a', '#b05be0', '#e055a0', '#f2b632', '#3cb371', '#1fc3c3', '#c0392b']


def live_nome(s, n=18):
    s = ''.join(c for c in str(s or '') if c.isprintable()).strip()
    return s[:n] or '?'


def live_hosts():
    return [a for a in AV.values() if a.sala == 'live' and not a.bot]


def live_aviao_de(chave):
    return next((a for a in AV.values() if a.sala == 'live' and a.chave == chave and not a.temp), None)


def live_cor(time_):
    if time_ == 'azul':
        return COR_AZUL
    usadas = {a.cor for a in AV.values() if a.sala == 'live'}
    return next((c for c in CORES_VERM if c not in usadas), random.choice(CORES_VERM))


def live_ponto(time_):
    """Inimigo nasce longe do host; aliado nasce perto dele."""
    hs = [h for h in live_hosts() if h.vivo]
    if hs and time_ == 'azul':
        h = random.choice(hs)
        p = [h.p[0] + random.uniform(-500, 500), max(500, h.p[1] + random.uniform(-100, 150)), h.p[2] + random.uniform(-500, 500)]
        return p, norm([h.v[0], 0, h.v[2]]) if dot(h.v, h.v) > 1 else [1, 0, 0]
    for _ in range(12):
        p, f = ponto_nascer()
        if all(math.dist(p, h.p) > 1500 for h in hs):
            break
    return p, f


async def live_alerta(txt, k='info', av=None):
    await todos({'t': 'live', 'txt': txt, 'k': k, 'av': av}, 'live')


def live_rank_msg():
    top = lambda d: [[LIVE['nomes'].get(c, c), n] for c, n in sorted(d.items(), key=lambda x: -x[1])[:3]]
    return {'t': 'liverank', 'vs': LIVE['vs'], 'derrubou': top(LIVE['derrubou']), 'moedas': top(LIVE['moedas']),
            'curtidas': LIVE['curtidas'] % LIVE_CURTIDAS, 'meta': LIVE_CURTIDAS}


async def live_criar(chave, nome, time_=None, temp=False, esc=1, vida=100, rotulo=None, dono=None):
    """Põe um avião do chat na arena (ou devolve o que já existe)."""
    if not temp:
        a = live_aviao_de(chave)
        if a:
            return a, False
        fixos = sorted((a for a in AV.values() if a.sala == 'live' and a.bot and not a.temp), key=lambda a: a.t_ativo)
        while len(fixos) >= LIVE_MAX:   # cheio: sai quem está calado há mais tempo
            velho = fixos.pop(0)
            AV.pop(velho.id, None)
    time_ = time_ or LIVE['times'].get(chave, 'vermelho')
    b = Aviao(rotulo or nome, bot=True, sala='live')
    b.chave, b.time, b.temp, b.esc, b.vida = chave, time_, temp, esc, vida
    b.dono_chave = dono or (None if temp else chave)
    b.av = LIVE['avatares'].get(b.dono_chave)
    b.cor = COR_OURO if (not temp and chave in LIVE.get('ouro', set())) else live_cor(time_)
    b.p, b.f = live_ponto(time_)
    b.v = [b.f[i] * 118 for i in range(3)]
    AV[b.id] = b
    return b, True


def live_abate(alvo, por):
    # (10/11) placar EU x CHAT: chat matou o host = ponto do chat; host matou alguém do chat = ponto do host
    if not alvo.bot and por is not None and por.bot:
        LIVE['vs'][1] += 1
    elif alvo.bot and alvo.time == 'vermelho' and por is not None and not por.bot:
        LIVE['vs'][0] += 1
    if por and por.bot and por.dono_chave and por.time == 'vermelho' and not alvo.bot:   # derrubou o host
        LIVE['derrubou'][por.dono_chave] = LIVE['derrubou'].get(por.dono_chave, 0) + 1


async def live_renascer(b, agora):
    if b.temp or agora - b.t_ativo > LIVE_OCIOSO:   # onda/chefão ou calado: sai da arena
        if agora - b.t_morte > 2:
            AV.pop(b.id, None)
            await placar('live')
        return
    if agora - b.t_morte > 6:
        b.p, b.f = live_ponto(b.time)
        b.vida, b.vivo, b.bank = 100 * b.esc, True, 0.0


def live_alvo(b, vivos, agora, furia):
    inimigos = [a for a in vivos if a.time != b.time and not a.navio]
    if not inimigos:
        return None
    hs = [a for a in inimigos if not a.bot]
    atual = AV.get(b.alvo_id)
    if atual and atual in inimigos and agora - b.t_alvo < 15 and not (furia and hs and atual not in hs):
        return atual
    # no máximo 3 caças em cima do host ao mesmo tempo (fúria fura a fila) — senão vira massacre
    if hs and (furia or sum(1 for x in AV.values() if x.bot and x.alvo_id in {h.id for h in hs} and x is not b) < 3):
        alvo = min(hs, key=lambda a: math.dist(a.p, b.p))
    else:
        outros = [a for a in inimigos if a.bot]
        alvo = min(outros, key=lambda a: math.dist(a.p, b.p)) if outros else None
    b.alvo_id, b.t_alvo = (alvo.id if alvo else None), agora
    return alvo


async def live_salva(b, n=2):
    """Míssil de presente: sai do avião da pessoa direto no alvo (sem precisar travar)."""
    vivos = [a for a in AV.values() if a.sala == 'live' and a.vivo and a.time != b.time and not a.navio]
    if not vivos or not b.vivo:
        return
    for i in range(n):
        alvo = min(vivos, key=lambda a: math.dist(a.p, b.p) + (0 if not a.bot else 800))
        m = Missil(b, alvo)
        MIS[m.id] = m
        await todos({'t': 'missil', 'id': m.id, 'dono': b.id, 'alvo': alvo.id}, 'live')
        await asyncio.sleep(0.5)


def faixa(moedas):
    return ('pequeno' if moedas < 10 else 'medio' if moedas < 100 else 'navios' if moedas < 1000
            else 'grande' if moedas < 5000 else 'enorme')


# ---- (10/11) navios do chat: metralhadora antiaérea com alcance curto — de cima (> ~900 m) dá p/ bombardear em paz
ALCANCE_NAVIO = 900.0
VIDA_NAVIO = 200
VEL_NAVIO = 4.0                # devagar: dá p/ acertar bomba de 1 km de altura


def ponto_mar(perto, rmin=1500, rmax=3500):
    for _ in range(60):
        a, r = random.random() * math.tau, random.uniform(rmin, rmax)
        x, z = perto[0] + math.cos(a) * r, perto[2] + math.sin(a) * r
        if math.hypot(x, z) < ARENA - 300 and e_mar(x, z, 200):
            return [x, 0.0, z]
    return None


async def live_navios(chave, nome, time_, n=2):
    hs = [h for h in live_hosts() if h.vivo]
    centro = hs[0].p if hs else [0, 0, 0]
    feitos = 0
    for i in range(n):
        p = ponto_mar(centro)
        if not p:
            continue
        b, _ = await live_criar(f'{chave}#navio{random.random()}', '', time_=time_, temp=True, vida=VIDA_NAVIO,
                                rotulo=f'🚢 {nome}'[:20], dono=chave)
        b.navio = True
        b.p = p
        ang = random.random() * math.tau
        b.f = [math.cos(ang), 0, math.sin(ang)]
        b.v = [b.f[0] * VEL_NAVIO, 0, b.f[2] * VEL_NAVIO]
        b.q = quat_de(b.f, 0)
        feitos += 1
    return feitos


async def navegar(b, dt, agora):
    if getattr(b, 'papel', None) == 'radar':   # (19/11) missão 4: radar em terra
        await radar_passo(b, dt, agora)
        return
    if not b.vivo and e_missao(b.sala):        # (19/11) missão: navio afundado fica no fundo
        return
    if not b.vivo:
        await live_renascer(b, agora)
        return
    # anda devagar; vira quando vê terra (ou a borda) 250 m à frente
    fx, fz = b.f[0], b.f[2]
    if not e_mar(b.p[0] + fx * 250, b.p[2] + fz * 250, 80) or math.hypot(b.p[0] + fx * 250, b.p[2] + fz * 250) > ARENA - 200:
        ang = math.atan2(fz, fx) + 0.6 * dt
    else:
        ang = math.atan2(fz, fx) + math.sin(agora * 0.05 + b.id) * 0.03 * dt
    b.f = [math.cos(ang), 0, math.sin(ang)]
    b.v = [b.f[0] * VEL_NAVIO, 0, b.f[2] * VEL_NAVIO]
    nx, nz = b.p[0] + b.v[0] * dt, b.p[2] + b.v[2] * dt
    if e_mar(nx, nz, 40):
        b.p = [nx, 0.0, nz]
    b.q = quat_de(b.f, 0)
    # metralhadora: o inimigo mais perto dentro do alcance (só aviões)
    if agora - b.ult_tiro < 0.12:
        return
    cand = [a for a in AV.values() if a.sala == b.sala and a.vivo and a.time != b.time and not a.navio
            and math.dist(a.p, b.p) < ALCANCE_NAVIO and a.p[1] > 5]
    if not cand:
        return
    alvo = min(cand, key=lambda a: math.dist(a.p, b.p))
    b.ult_tiro = agora
    boca = [b.p[0], 14.0, b.p[2]]
    d = math.dist(alvo.p, boca)
    t = d / 900
    mira = [alvo.p[i] + alvo.v[i] * t + random.gauss(0, 6 + d * 0.02) for i in range(3)]
    await todos({'t': 'tiro', 'id': b.id, 'p': [round(x, 1) for x in boca], 'd': [round(x, 3) for x in norm([mira[i] - boca[i] for i in range(3)])]}, b.sala)
    if random.random() < 0.35 * (1 - d / ALCANCE_NAVIO) ** 1.5:   # longe quase não acerta
        await dano(alvo, 4, b)


async def live_evento(d):
    tipo = d.get('tipo')
    chave = live_nome(d.get('id') or d.get('nome'), 40)
    nome = live_nome(d.get('nome') or chave)
    LIVE['nomes'][chave] = nome
    av = d.get('avatar')
    if isinstance(av, str) and av.startswith('https://') and len(av) < 800 and not any(c in av for c in '"\'<> '):
        LIVE['avatares'][chave] = av
        for x in AV.values():
            if x.sala == 'live' and x.dono_chave == chave:
                x.av = av
    agora = time.monotonic()
    a = live_aviao_de(chave)
    if a:
        a.t_ativo = agora
    if tipo == 'zerar':   # simulador: começa uma live nova
        LIVE.update(vs=[0, 0], curtidas=0, derrubou={}, moedas={})
        await todos(live_rank_msg(), 'live')
        return True
    if tipo == 'comentario':
        txt = str(d.get('texto') or '').strip().lower()
        if txt.startswith('!time') or txt in ('!azul', '!vermelho'):
            t = 'azul' if 'azul' in txt else 'vermelho' if 'vermelho' in txt else None
            if t:
                LIVE['times'][chave] = t
                if a:
                    a.time, a.cor = t, (COR_OURO if a.cor == COR_OURO else live_cor(t))
                await live_alerta(f'{"🟦" if t == "azul" else "🟥"} {nome} agora é do time {"AZUL (ala do host)" if t == "azul" else "VERMELHO (contra o host)"}', 'time')
        b, novo = await live_criar(chave, nome)
        await todos({'t': 'fala', 'id': b.id, 'nome': nome, 'av': LIVE['avatares'].get(chave),
                     'txt': ''.join(c for c in str(d.get('texto') or '') if c.isprintable())[:90]}, 'live')
        if novo:
            await live_alerta(f'✈️ {nome} entrou na briga!', 'entrou')
        else:
            b.furia_ate = agora + 10   # comentou de novo: fica bravo
            if not b.vivo and agora - b.t_morte > 2:
                b.t_morte = agora - 6
    elif tipo == 'curtida':
        antes = LIVE['curtidas'] // LIVE_CURTIDAS
        LIVE['curtidas'] += max(1, min(1000, int(d.get('n') or 1)))
        if LIVE['curtidas'] // LIVE_CURTIDAS > antes:
            for i in range(3):
                await live_criar(f'onda{random.random()}', '', time_='vermelho', temp=True, rotulo='❤️ Onda')
            await live_alerta(f'❤️ {LIVE_CURTIDAS} curtidas! Lá vem uma ONDA de caças!', 'onda')
    elif tipo == 'seguir':
        LIVE.setdefault('ouro', set()).add(chave)
        b, _ = await live_criar(chave, nome)
        b.cor = COR_OURO
        await live_alerta(f'⭐ {nome} seguiu! Avião DOURADO ✨', 'seguir', LIVE['avatares'].get(chave))
    elif tipo == 'compartilhar':
        b, _ = await live_criar(chave, nome)
        b.misseis += 1
        await live_alerta(f'🔁 {nome} compartilhou: +1 míssil 🚀', 'info')
    elif tipo == 'presente':
        moedas = max(1, min(100000, int(d.get('moedas') or 1)))
        pres = live_nome(d.get('presente') or 'presente', 20)
        LIVE['moedas'][chave] = LIVE['moedas'].get(chave, 0) + moedas
        t = LIVE['times'].get(chave, 'vermelho')
        f = faixa(moedas)
        hs = live_hosts()
        b, _ = await live_criar(chave, nome)
        b.t_ativo = agora
        if f == 'pequeno':
            if t == 'azul':
                for h in hs:
                    if h.vivo:
                        h.vida = min(100, h.vida + min(30, 10 * moedas))
                msg = f'🔧 conserto +{min(30, 10 * moedas)}% no host'
            else:
                b.misseis += 1
                b.furia_ate = agora + 10
                msg = '😡 fúria + míssil'
        elif f == 'medio':
            if t == 'azul':
                for h in hs:
                    h.misseis = min(8, h.misseis + 4)
                    h.bombas = min(8, h.bombas + 1)
                    await mandar(h, {'t': 'mun', 'm': h.misseis})
                    await mandar(h, {'t': 'bombas', 'n': h.bombas})
                msg = '🚀 +4 mísseis e 💣 +1 bomba pro host'
            else:
                asyncio.create_task(live_salva(b, 2))
                msg = '🚀🚀 salva de mísseis no host!'
        elif f == 'navios':
            n = await live_navios(chave, nome, t)
            msg = f'🚢🚢 {n} navios {"aliados" if t == "azul" else "inimigos"} com metralhadora!' if n else '🚢 sem mar livre p/ os navios'
        elif f == 'grande':
            await live_criar(chave, nome, time_=t, temp=True, esc=2.2, vida=400, rotulo=f'👑 {nome}', dono=chave)
            msg = f'👑 CHEFÃO {"aliado" if t == "azul" else "inimigo"}!'
        else:
            for i in range(4):
                c, _ = await live_criar(f'{chave}#{i}{random.random()}', '', time_=t, temp=True, rotulo=f'{"🛡️ Ala" if t == "azul" else "☠️ Ataque"} {nome}'[:22], dono=chave)
                c.furia_ate = agora + 30
            if t == 'vermelho':
                for x in AV.values():
                    if x.sala == 'live' and x.bot and x.time == 'vermelho':
                        x.furia_ate = agora + 20
            msg = '🛡️ ESQUADRILHA ALIADA!' if t == 'azul' else '☠️ ATAQUE TOTAL!'
        await live_alerta(f'🎁 {nome} mandou {pres} ({moedas}🪙) → {msg}', 'presente-' + f, LIVE['avatares'].get(chave))
    else:
        return False
    await placar('live')
    await todos(live_rank_msg(), 'live')
    return True


def _rede_de_casa(req):
    try:
        ip = ipaddress.ip_address(req.remote or '')
        return ip.is_loopback or ip.is_private
    except ValueError:
        return False


async def api_live(req):
    if not _rede_de_casa(req):
        raise web.HTTPForbidden()
    try:
        d = await req.json()
    except Exception:
        return web.json_response({'erro': 'json'}, status=400)
    lst = d if isinstance(d, list) else [d]
    ok = 0
    for ev in lst[:50]:
        if isinstance(ev, dict):
            ok += bool(await live_evento(ev))
    return web.json_response({'ok': ok, 'avioes': sum(1 for a in AV.values() if a.sala == 'live' and a.bot)})


# ---------------------------------------------------------------- jogadores
async def ws_jogo(req):
    ws = web.WebSocketResponse(heartbeat=10, receive_timeout=10)   # 10 s calado (app em 2º plano) = saiu
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
                sala = d.get('sala') if d.get('sala') in SALAS + ('missao',) else 'bots'
                conta = contas.por_token(d.get('token'))
                if conta:   # logado: usa o nome da conta e derruba outra conexão da mesma conta
                    nome = conta[1]
                    for x in list(AV.values()):
                        if x.conta == conta[0] and x.ws is not None:
                            await mandar(x, {'t': 'expulso', 'msg': 'Sua conta entrou em outro aparelho.'})
                            await x.ws.close()
                else:       # convidado: nome sempre "Convidado NNN" (não dá p/ usar nome de conta)
                    nome = f'Convidado {random.randint(100, 999)}'
                if sala == 'missao':   # (19/11) modo história: sala particular 'm:<id>'
                    n = d.get('missao') if isinstance(d.get('missao'), int) else 0
                    if n not in MISSOES or (not MIS_TUDO_LIBERADO and conta and n > 1 and (n - 1) not in contas.missoes_de(conta[0])):
                        await ws.send_str(json.dumps({'t': 'expulso', 'msg': 'Essa missão ainda está bloqueada.'}))
                        break
                    a = Aviao(nome, ws=ws, sala='m:?')
                    a.sala = f'm:{a.id}'
                else:
                    a = Aviao(nome, ws=ws, sala=sala)
                if conta:
                    a.conta = conta[0]
                    contas.somar(a.conta, a.sala, partidas=1)
                AV[a.id] = a
                print(f'entrou {a.id} {nome} sala={a.sala} base={a.base}', flush=True)
                extra = {}
                if sala == 'missao':
                    extra = missao_iniciar(a, n)
                else:
                    await ajustar_bots()
                await mandar(a, {'t': 'bemvindo', 'id': a.id, 'cor': a.cor, 'sala': sala, 'base': a.base, 'nome': nome,
                                 'bases': BASES, 'zona': ZONA, 'rsam': R_SAM, **extra})
                sala = a.sala
                await placar(sala)
                if sala in ORDEM_BASES:
                    await mandar(a, sams_msg())
                await mandar(a, {'t': 'mun', 'm': a.misseis, 'g': a.balas if lim(sala) else -1})
                await mandar(a, {'t': 'bombas', 'n': a.bombas})
                if sala == 'live':
                    await mandar(a, live_rank_msg())
            elif a is None:
                continue
            elif t == 'e':
                p, q, v = nums(d.get('p', []), 3), nums(d.get('q', []), 4, 2), nums(d.get('v', []), 3, 1000)
                if p and q and v and a.vivo:
                    a.p, a.q, a.v = p, q, v
                    a.trem = 1 if d.get('tr') else 0
            elif t == 'tiro' and a.vivo:
                p, dd = nums(d.get('p', []), 3), nums(d.get('d', []), 3, 2)
                if lim(a.sala):
                    if a.balas <= 0:
                        continue
                    a.balas -= 1
                if p and dd:
                    await todos({'t': 'tiro', 'id': a.id, 'p': p, 'd': dd}, a.sala, exceto=a)
            elif t == 'acerto' and a.vivo:
                alvo = AV.get(d.get('alvo'))
                agora = time.monotonic()
                a.acertos = [x for x in a.acertos if agora - x < 1]
                if alvo and alvo is not a and alvo.vivo and alvo.sala == a.sala and not (a.time and a.time == alvo.time) and len(a.acertos) < 18 and (a.balas > 0 or not lim(a.sala)) and math.dist(a.p, alvo.p) < 1500:
                    a.acertos.append(agora)
                    await dano(alvo, DANO_TIRO, a)
            elif t == 'missil' and a.vivo:
                await lancar(a, AV.get(d.get('alvo')))
            elif t == 'reabastecer' and a.vivo and a.sala == 'pvp' and a.base is not None:
                # (10/11) parado na pista da própria base: conserta e recarrega tudo
                b = BASES[a.base]
                agora = time.monotonic()
                if (math.hypot(a.p[0] - b[0], a.p[2] - b[2]) < 800 and a.p[1] < b[1] + 6
                        and math.sqrt(dot(a.v, a.v)) < 8 and agora - a.t_reab > 5):
                    a.t_reab = agora
                    a.vida, a.misseis, a.bombas = 100, MISSEIS_MAX, BOMBAS_MAX
                    await mandar(a, {'t': 'mun', 'm': a.misseis})
                    await mandar(a, {'t': 'bombas', 'n': a.bombas})
                    await mandar(a, {'t': 'reabastecido'})
            elif t == 'bomba':
                p, v = nums(d.get('p', []), 3), nums(d.get('v', []), 3, 1000)
                if p and v:
                    await soltar_bomba(a, p, v)
            elif t == 'impacto':
                b = BOMBAS.get(d.get('id'))
                p = nums(d.get('p', []), 3)
                if b and p and b['dono'] is a and math.dist(p, b.get('toque') or b['p']) < 250:   # perto de onde o servidor acha que ela está
                    await explodir_bomba(d.get('id'), p)
            elif t == 'flare':
                await soltar_flare(a)
            elif t == 'caiu':
                await matar(a, None)
            elif t == 'renascer' and e_missao(a.sala):   # (19/11) missão: nasce uma vez só, com a munição da missão
                M = MISSAO.get(a.sala)
                p = nums(d.get('p', []), 3)
                if M and not M['nasceu'] and p:
                    M['nasceu'], M['t0'] = True, time.monotonic()
                    a.p, a.vida, a.vivo = p, 100, True
                    await mandar(a, {'t': 'mun', 'm': a.misseis, 'g': a.balas})
                    await mandar(a, {'t': 'bombas', 'n': a.bombas})
            elif t == 'renascer' and not a.vivo and time.monotonic() - a.t_morte > 2.5:
                p = nums(d.get('p', []), 3)
                if p:
                    a.p = p
                a.vida, a.vivo = 100, True
                a.misseis = MISSEIS_MAX
                a.bombas = BOMBAS_MAX
                a.balas = BALAS_MAX
                await mandar(a, {'t': 'mun', 'm': a.misseis, 'g': a.balas if lim(a.sala) else -1})
                await mandar(a, {'t': 'bombas', 'n': a.bombas})
    except asyncio.TimeoutError:
        pass                     # celular calado (tela apagada / app fechado): tira da sala
    finally:
        if a:
            AV.pop(a.id, None)
            contas.somar(a.conta, a.sala, tempo=round(time.monotonic() - a.t_entrou, 1))
            for m in list(MIS.values()):
                if m.dono is a:
                    MIS.pop(m.id, None)
                elif m.alvo is a:
                    m.alvo = None
            print(f'saiu {a.id} {a.nome}', flush=True)
            if e_missao(a.sala):
                missao_limpar(a.sala)
            await ajustar_bots()
            await placar(a.sala)
    return ws


async def arquivo(req):
    nome = req.match_info.get('arq') or 'index.html'
    alvo = (RAIZ / nome).resolve()
    if RAIZ not in alvo.parents or not alvo.is_file():
        raise web.HTTPNotFound()
    return web.FileResponse(alvo, headers={'Cache-Control': 'no-store'})


# ---------------------------------------------------------------- (10/11) contas e ranking
FALHAS = {}   # ip -> instantes de tentativas erradas (trava chute de senha)


def _ip(req):
    return req.remote or '?'


async def api_conta(req):
    acao = req.match_info['acao']
    try:
        d = await req.json()
    except Exception:
        d = {}
    if acao == 'sair':
        contas.sair(d.get('token'))
        return web.json_response({'ok': True})
    ip, agora = _ip(req), time.monotonic()
    FALHAS[ip] = [x for x in FALHAS.get(ip, []) if agora - x < 300]
    if len(FALHAS[ip]) >= 8:
        return web.json_response({'erro': 'Muitas tentativas. Espere 5 minutos.'}, status=429)
    fn = contas.criar if acao == 'criar' else contas.entrar
    try:
        tok, nome = await asyncio.get_running_loop().run_in_executor(None, fn, d.get('nome'), d.get('senha'))
    except ValueError as e:
        FALHAS[ip].append(agora)
        return web.json_response({'erro': str(e)}, status=400)
    print(f'conta {acao}: {nome}', flush=True)
    return web.json_response({'token': tok, 'nome': nome})


async def api_eu(req):
    c = contas.por_token(req.query.get('token'))
    return web.json_response({'nome': c[1]} if c else {'erro': 'sessão inválida'}, status=200 if c else 401)


async def api_missoes(req):
    c = contas.por_token(req.query.get('token'))
    if not c:
        return web.json_response({'erro': 'sessão inválida'}, status=401)
    return web.json_response({'feitas': contas.missoes_de(c[0])}, headers={'Cache-Control': 'no-store'})


async def api_rank(req):
    sala = req.query.get('sala') if req.query.get('sala') in SALAS else 'pvp'
    return web.json_response({'sala': sala, 'l': contas.ranking(sala)}, headers={'Cache-Control': 'no-store'})


async def iniciar(app):
    app['laco'] = asyncio.create_task(laco(app))


def main():
    app = web.Application()
    app.router.add_get('/ws', ws_jogo)
    app.router.add_post('/api/conta/{acao:criar|entrar|sair}', api_conta)
    app.router.add_get('/api/eu', api_eu)
    app.router.add_get('/api/rank', api_rank)
    app.router.add_get('/api/missoes', api_missoes)
    app.router.add_post('/api/live', api_live)
    app.router.add_get('/', arquivo)
    app.router.add_get('/{arq}', arquivo)
    app.on_startup.append(iniciar)
    asyncio.run(rodar(app))


async def rodar(app):
    """http na PORTA e, se houver certificado em dados/, https na PORTA+2 (câmera do celular só abre em https)."""
    import ssl
    runner = web.AppRunner(app)
    await runner.setup()
    await web.TCPSite(runner, '0.0.0.0', PORTA).start()
    print(f'js-jet em http://0.0.0.0:{PORTA}', flush=True)
    cert, chave = Path(__file__).resolve().parent / 'dados' / 'cert.pem', Path(__file__).resolve().parent / 'dados' / 'key.pem'
    if cert.is_file() and chave.is_file() and not os.environ.get('SEM_HTTPS'):
        ctx = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        ctx.load_cert_chain(cert, chave)
        await web.TCPSite(runner, '0.0.0.0', PORTA + 2, ssl_context=ctx).start()
        print(f'js-jet em https://0.0.0.0:{PORTA + 2} (câmera)', flush=True)
    await asyncio.Event().wait()


if __name__ == '__main__':
    main()
