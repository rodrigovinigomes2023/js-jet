"""(19/11) KC-390 v2: modelo inteiro (1 peça, ~5,9 mil triângulos) -> fonte/kc390.js. Só numpy.

Modelo: "Aviâo KC390" por neemiasmiranda (Thingiverse 7310242), domínio público (CC0).
Substituiu o de 5 peças (Geraldo1600), que dava frestas na montagem e pesava 135 mil triângulos.
STL: nariz em -x, direita do avião em +y, cima em +z, ~302 mm de comprimento, simétrico em y=100.
Saída no referencial do jogo: frente +x, cima +y, direita +z, metros (33,5 m de comprimento).
Rodar:  python3 scripts/kc390/converter2.py
"""
import base64, struct
from pathlib import Path
import numpy as np

AQUI = Path(__file__).resolve().parent
STL = AQUI / 'zip2' / 'files' / 'kc390bx100k.stl'
SAIDA = AQUI.parent.parent / 'fonte' / 'kc390.js'
ESCALA = 33.5 / 302.0
CX, CY, CZ = 100.0, 100.0, 25.0     # meio do comprimento, plano de simetria, eixo da fuselagem


def main():
    b = STL.read_bytes()
    n = struct.unpack('<I', b[80:84])[0]
    d = np.frombuffer(b[84:84 + n * 50], dtype=np.dtype([('n', '<f4', 3), ('v', '<f4', (3, 3)), ('a', '<u2')]))
    tri = d['v'].reshape(-1, 3).astype(np.float64)
    q = np.round(tri / 1e-4).astype(np.int64)            # solda só pontos idênticos
    uniq, inv = np.unique(q, axis=0, return_inverse=True)
    v = uniq * 1e-4
    f = inv.reshape(-1, 3)
    f = f[(f[:, 0] != f[:, 1]) & (f[:, 1] != f[:, 2]) & (f[:, 0] != f[:, 2])]
    parte = np.where((v[:, 2] > 52) & (v[:, 0] > 175), 2, 0).astype(np.uint8)   # 2 = deriva (pinta com a cor do time)
    jogo = np.stack([-(v[:, 0] - CX), v[:, 2] - CZ, v[:, 1] - CY], axis=1) * ESCALA
    print(f'{n} triângulos -> {len(f)}; {len(v)} vértices; caixa (m): {jogo.min(0).round(1)} {jogo.max(0).round(1)}')
    qq = np.round(jogo * 1000).astype('<i2')
    js = ('// (19/11) KC-390 (Embraer) p/ o Pelicano — gerado por scripts/kc390/converter2.py. NÃO editar à mão.\n'
          '// Modelo 3D: "Aviâo KC390" por neemiasmiranda (Thingiverse 7310242), domínio público (CC0).\n'
          'window.KC390={pos:"' + base64.b64encode(qq.tobytes()).decode() + '",idx:"'
          + base64.b64encode(f.astype('<u4').tobytes()).decode() + '",parte:"' + base64.b64encode(parte.tobytes()).decode() + '"};\n')
    SAIDA.write_text(js)
    print(f'gravado {SAIDA} ({len(js) // 1024} KB)')


if __name__ == '__main__':
    main()
