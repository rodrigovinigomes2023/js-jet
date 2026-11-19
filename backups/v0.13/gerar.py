#!/usr/bin/env python3
"""(18/11) Gera o relevo das ilhas no estilo "D · Montanha" (cordilheira com cânions e neve) -> fonte/terreno.js

Um arquivo só serve o cliente (desenho + colisão) e o servidor (bots, mísseis, linha de visada).
Mesmas ilhas (posição/tamanho) do gerador antigo rnd(20251109). Cada ilha vira uma grade de alturas
(passo PASSO m, int16 em quartos de metro), recortada onde é terra/raso. Perto das bases fica mar.
    python3 scripts/terreno/gerar.py
"""
import base64, json, math
from pathlib import Path
import numpy as np

PASSO = 20.0
FUNDO = -22.0
RAIZ = Path(__file__).resolve().parents[2]
BASE_R, BASE_R_BOTS, BASE_ILHA = 18600, 5800, 1050
BASES = [(math.cos(math.radians(g)) * BASE_R, math.sin(math.radians(g)) * BASE_R) for g in (45, 135, 225, 315)] + \
        [(math.cos(math.radians(g)) * BASE_R_BOTS, math.sin(math.radians(g)) * BASE_R_BOTS) for g in (75, 165, 255, 345)]


def ilhas():
    """Igual ao jogo.js antigo: rnd(20251109) (Park-Miller)."""
    s = [20251109]

    def r():
        s[0] = (s[0] * 16807) % 2147483647
        return s[0] / 2147483647
    il = [(300, -200, 1100)]          # a 1ª é fixa (não gasta sorteio)
    for _ in range(16):
        a = r() * math.tau; d = 900 + r() * 4200; raio = 220 + r() * 700; r()
        il.append((math.cos(a) * d, math.sin(a) * d, raio))
    b0 = BASES[:4]
    for _ in range(40):
        a = r() * math.tau; d = 5600 + r() * 10200; x, z = math.cos(a) * d, math.sin(a) * d
        if any(math.hypot(x - bx, z - bz) < 3200 for bx, bz in b0):
            continue
        raio = 220 + r() * 700; r()
        il.append((x, z, raio))
    return il


# ---------- ruído (mesmo da prévia) ----------
def _hash(i, j, s):
    i = i.astype(np.int64); j = j.astype(np.int64)
    h = (i * 374761393 + j * 668265263 + s * 1442695041) & 0xffffffff
    h = ((h ^ (h >> 13)) * 1274126177) & 0xffffffff
    return (h ^ (h >> 16)) / 4294967295.0


def vnoise(x, y, s):
    i = np.floor(x); j = np.floor(y); fx = x - i; fy = y - j
    u = fx * fx * (3 - 2 * fx); v = fy * fy * (3 - 2 * fy)
    a = _hash(i, j, s); b = _hash(i + 1, j, s); c = _hash(i, j + 1, s); d = _hash(i + 1, j + 1, s)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v


def fbm(x, y, s, o=5):
    t = 0; a = 0.5; f = 1; n = 0
    for k in range(o):
        t = t + a * vnoise(x * f, y * f, s + k * 17); n += a; a *= 0.5; f *= 2.03
    return t / n


def ridged(x, y, s, o=5):
    t = 0; a = 0.5; f = 1; n = 0
    for k in range(o):
        v = 1 - np.abs(2 * vnoise(x * f, y * f, s + k * 31) - 1); t = t + a * v * v; n += a; a *= 0.5; f *= 2.1
    return t / n


def sm(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def montanha(x, z, sd):
    """Altura (m) no espaço local de uma ilha de 'raio' ~860 e picos até ~760 m."""
    wx = x + 260 * (fbm(x * 0.0015, z * 0.0015, sd + 41) - 0.5)
    wz = z + 260 * (fbm(x * 0.0015 + 9, z * 0.0015, sd + 43) - 0.5)
    d = np.hypot(wx * 0.7, wz)
    rr = 860 * (0.75 + 0.5 * fbm(x * 0.0012 + 2, z * 0.0012, sd + 47))
    m = sm(1, 0.3, d / rr)
    r1 = ridged(wx * 0.0022, wz * 0.0022, sd + 51, 6)
    h = 760 * np.power(m, 1.2) * (0.18 + 0.82 * np.minimum(1, r1 * r1 * 1.6))
    h = h + ridged(wx * 0.009, wz * 0.009, sd + 57, 4) * 55 * m
    return np.where(m > 0, FUNDO + (h - FUNDO) * sm(0, 0.05, m), FUNDO)


def main():
    lista, blocos, total = [], [], 0
    for n, (cx, cz, raio) in enumerate(ilhas()):
        k = (raio * 1.25) / 860            # ilhas ~25% maiores que os "pudins" antigos
        hs = min(1.0, 0.35 + raio / 1400)  # ilha pequena = morro mais baixo
        ang = (n * 2.399) % math.tau       # direção da cordilheira
        ext = 1700 * k
        nx = int(math.ceil(2 * ext / PASSO)) + 1
        xs = cx - ext + np.arange(nx) * PASSO
        X, Z = np.meshgrid(xs, cz - ext + np.arange(nx) * PASSO)   # Z: linhas, X: colunas
        lx, lz = (X - cx) / k, (Z - cz) / k
        ca, sa = math.cos(ang), math.sin(ang)
        rx, rz = lx * ca - lz * sa, lx * sa + lz * ca
        H = montanha(rx, rz, 1000 + n * 97)
        H = np.where(H > 0, H * hs, H)
        for bx, bz in BASES:               # perto das bases: mar
            dd = np.hypot(X - bx, Z - bz)
            H = np.where(dd < BASE_ILHA + 500, np.minimum(H, FUNDO + (H - FUNDO) * sm(BASE_ILHA + 150, BASE_ILHA + 500, dd)), H)
        terra = H > -16
        if not terra.any():
            continue
        lin = np.where(terra.any(1))[0]; col = np.where(terra.any(0))[0]
        l0, l1 = max(0, lin[0] - 2), min(nx - 1, lin[-1] + 2); c0, c1 = max(0, col[0] - 2), min(nx - 1, col[-1] + 2)
        H = H[l0:l1 + 1, c0:c1 + 1]
        q = np.round(H * 4).astype('<i2')
        lista.append({'x0': float(xs[c0]), 'z0': float(cz - ext + l0 * PASSO), 'nx': int(H.shape[1]), 'nz': int(H.shape[0]),
                      'of': total, 'hmax': round(float(H.max()), 1)})
        blocos.append(q.tobytes()); total += q.size
    dados = base64.b64encode(b''.join(blocos)).decode()
    meta = {'passo': PASSO, 'fundo': FUNDO, 'ilhas': lista}
    js = ('// (18/11) gerado por scripts/terreno/gerar.py — NÃO editar à mão. Relevo das ilhas (estilo D · Montanha).\n'
          f'window.TERRENO={json.dumps(meta, separators=(",", ":"))};\nwindow.TERRENO.dados="{dados}";\n')
    (RAIZ / 'fonte' / 'terreno.js').write_text(js)
    print(f'{len(lista)} ilhas, {total} amostras, {len(js) / 1e6:.2f} MB, pico {max(i["hmax"] for i in lista):.0f} m')


if __name__ == '__main__':
    main()
