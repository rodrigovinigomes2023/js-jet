"""(19/11) KC-390: monta as 5 peças STL (impressão 3D) num avião só, reduz triângulos e grava fonte/kc390.js.

Modelo: "embraer kc390 multpart" por Geraldo1600 (Thingiverse 4807167), licença CC BY-SA.
Rodar:  <venv com numpy+pyfqmr>/bin/python scripts/kc390/converter.py [triângulos=14000]
As peças vêm deitadas na mesa: nariz em -x, direita do avião em +y, cima em +z, unidades ~mm.
Encaixe medido em 19/11 (ver números abaixo). Saída no referencial do jogo: frente +x, cima +y, direita +z, metros.
"""
import base64, struct, sys
from pathlib import Path
import numpy as np
import pyfqmr

AQUI = Path(__file__).resolve().parent
PECAS = AQUI / 'zip' / 'files'
SAIDA = AQUI.parent.parent / 'fonte' / 'kc390.js'
ALVO = int(sys.argv[1]) if len(sys.argv) > 1 else 0   # 0 = sem reduzir (a redução amassou nariz e motores)
ANEDRO_TIRA = 5.0        # graus: levanta a ponta da asa (o real tem anedro pequeno)
RAIZ_Z = 2450 + 2840.0   # altura da raiz da asa já montada
EIXO_Y = 6441.0           # linha de centro da fuselagem (y das peças)
ESCALA = 1.08 / 1000      # 31 m de fuselagem -> ~33,5 m (o real tem 35,2 m)

SOBRA = 260.0            # (19/11) traseira entra um pouco na frente: fecha a fenda da emenda
RAIZ_LADO = 2200.0       # (19/11) raiz na lateral da carenagem, não no centro (referência do Gomes: 3 vistas)
# (arquivo, deslocamento x/y/z p/ o referencial da fuselagem, id da parte: 0 corpo, 1 asa, 2 cauda)
MONTAGEM = [
    ('kc3909_frente.stl', (0, 0, 0), 0),
    ('kc390_traseira.stl', (-12105 - SOBRA, 0, 0), 0),  # emenda da traseira encosta na frente (x -1821), com sobra p/ não abrir fenda
    ('kc_direita.stl', (-4838, 6441 + RAIZ_LADO - 11434, 2450), 1),  # raiz da asa na lateral da carenagem (motor longe da fuselagem)
    ('kc_esquerda.stl', (-7048, 6441 - RAIZ_LADO - 17789, 2450), 1),
    ('kc_tail.stl', (11048, 6441 - 12446, 4700), 2),     # deriva em cima da traseira levantada
]


def le_stl(f):
    b = f.read_bytes()
    n = struct.unpack('<I', b[80:84])[0]
    d = np.frombuffer(b[84:84 + n * 50], dtype=np.dtype([('n', '<f4', 3), ('v', '<f4', (3, 3)), ('a', '<u2')]))
    return d['v'].reshape(-1, 3).astype(np.float64)


def solda(tri):
    """Triângulos soltos -> vértices únicos + índices (só pontos idênticos: soldar de longe abria trincas)."""
    q = np.round(tri / 0.01).astype(np.int64)
    uniq, inv = np.unique(q, axis=0, return_inverse=True)
    pos = np.zeros((len(uniq), 3))
    np.add.at(pos, inv, tri)
    pos /= np.bincount(inv)[:, None]
    f = inv.reshape(-1, 3)
    f = f[(f[:, 0] != f[:, 1]) & (f[:, 1] != f[:, 2]) & (f[:, 0] != f[:, 2])]
    return pos, f


def main():
    todos_v, todos_f, todas_p = [], [], []
    base = 0
    total_ori = 0
    for nome, (dx, dy, dz), parte in MONTAGEM:
        tri = le_stl(PECAS / nome)
        total_ori += len(tri) // 3
        tri += (dx, dy, dz)
        if parte == 1:   # asa impressa deitada sobre o motor: gira em torno da raiz p/ tirar o anedro exagerado
            raiz_y = 6441.0 + np.sign(tri[:, 1].mean() - 6441.0) * RAIZ_LADO
            lado = np.sign(tri[:, 1].mean() - raiz_y)
            ang = lado * np.radians(ANEDRO_TIRA)
            yy, zz = tri[:, 1] - raiz_y, tri[:, 2] - RAIZ_Z
            tri[:, 1] = raiz_y + yy * np.cos(ang) - zz * np.sin(ang)
            tri[:, 2] = RAIZ_Z + yy * np.sin(ang) + zz * np.cos(ang)
        v, f = solda(tri)
        if ALVO:
            alvo = max(300, int(ALVO * len(f) / 135000))
            s = pyfqmr.Simplify()
            s.setMesh(v, f)
            s.simplify_mesh(target_count=alvo, aggressiveness=5, preserve_border=True, max_iterations=200, verbose=0)
            v, f, _ = s.getMesh()
        print(f'{nome}: {len(tri) // 3} -> {len(f)} triângulos')
        todos_v.append(v); todos_f.append(f + base); todas_p.append(np.full(len(v), parte, np.uint8))
        base += len(v)
    v = np.vstack(todos_v); f = np.vstack(todos_f); parte = np.concatenate(todas_p)
    # referencial do jogo: frente +x (nariz estava em -x), cima +y, direita +z; centraliza
    jogo = np.stack([-v[:, 0], v[:, 2], v[:, 1] - EIXO_Y], axis=1) * ESCALA
    jogo[:, 0] -= (jogo[:, 0].max() + jogo[:, 0].min()) / 2
    jogo[:, 1] -= 3.3 * 1.08                     # eixo da fuselagem na altura 0
    print('total', total_ori, '->', len(f), 'triângulos;', len(v), 'vértices; caixa (m):', jogo.min(0).round(1), jogo.max(0).round(1))
    q = np.round(jogo * 1000).astype('<i2')   # milímetros em int16 (±32 m)
    js = ('// (19/11) KC-390 (Embraer) p/ o Pelicano — gerado por scripts/kc390/converter.py. NÃO editar à mão.\n'
          '// Modelo 3D: "embraer kc390 multpart" por Geraldo1600 (Thingiverse 4807167), licença CC BY-SA.\n'
          'window.KC390={pos:"' + base64.b64encode(q.tobytes()).decode() + '",idx:"'
          + base64.b64encode(f.astype('<u4').tobytes()).decode() + '",parte:"' + base64.b64encode(parte.tobytes()).decode() + '"};\n')
    SAIDA.write_text(js)
    print(f'gravado {SAIDA} ({len(js) // 1024} KB)')


if __name__ == '__main__':
    main()
