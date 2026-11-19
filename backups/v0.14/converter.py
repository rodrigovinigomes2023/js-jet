"""(19/11) Mi-35M (AH-2 Sabre) -> fonte/mi35.js p/ o modo helicóptero. Só numpy.

Modelo 3D: "Russian Mil Mi-35M" por 42manako (Sketchfab), licença CC-BY-4.0 (crédito obrigatório).
https://sketchfab.com/3d-models/russian-mil-mi-35m-cf353814ef14488599336f752b85d5d4
Tira as texturas russas (pintamos FAB no jogo) e a malha 'aco' (37 mil triângulos de detalhe que não aparece de cima).
GLB: x = direita, y = frente, z = cima, metros. Saída: frente +x, cima +y, direita +z; chão (rodas) em y=0, rotor em x=0,z=0.
Partes: 0 fuselagem (camuflagem) 1 vidro 2 armas/metal escuro 3 interior 4 rotor principal 5 rotor de cauda 6 rodas (pneu preto)
Rodar:  python3 scripts/mi35/converter.py
"""
import base64, sys
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parent))
from glb import abre

AQUI = Path(__file__).resolve().parent
GLB = Path.home() / 'Downloads' / 'russian_mil_mi-35m (1).glb'
SAIDA = AQUI.parent.parent / 'fonte' / 'mi35.js'
PARTE = {'chassis.0': 0, 'chassis.2': 0, 'decal.0': 0, 'Glass4.0': 1, 'kokon.0': 2, 's8.0': 2, 'BKO.0': 2, 'chassis.1': 3, 'salon.1': 3, 'static_rotor.0': 4}
CAUDA_Y = -9.2      # rotor: tudo atrás disso é o rotor de cauda
# (19/11) rodas (caixas medidas nas peças soltas perto do chão, coordenadas do GLB): 2 principais + par do nariz
RODAS = [((-1.75, -1.1, -0.7), (-1.23, -0.08, 0.32)), ((1.41, -1.11, -0.71), (1.94, -0.09, 0.3)), ((-0.28, 4.13, -1.04), (0.38, 4.76, -0.41))]


def main():
    j, acc, _ = abre(GLB)
    V, N, F, P = [], [], [], []
    base = 0
    for m in j['meshes']:
        for pr in m['primitives']:
            nome = j['materials'][pr['material']]['name']
            if nome not in PARTE:
                print('fora:', nome, acc(pr['indices']).size // 3); continue
            v = acc(pr['attributes']['POSITION']).astype(np.float64)
            n = acc(pr['attributes']['NORMAL']).astype(np.float64)
            f = acc(pr['indices']).reshape(-1, 3).astype(np.int64)
            p = np.full(len(v), PARTE[nome], np.uint8)
            if nome == 'static_rotor.0': p[v[:, 1] < CAUDA_Y] = 5
            if nome == 'chassis.0':
                for a, b in RODAS: p[np.all((v >= a) & (v <= b), axis=1)] = 6
            V.append(v); N.append(n); F.append(f + base); P.append(p); base += len(v)
    v = np.vstack(V); n = np.vstack(N); f = np.vstack(F); p = np.concatenate(P)
    # solda vértices idênticos (posição+normal+parte) p/ diminuir o arquivo
    chave = np.hstack([np.round(v / 1e-3), np.round(n * 100), p[:, None]]).astype(np.int64)
    u, idx, inv = np.unique(chave, axis=0, return_index=True, return_inverse=True)
    v, n, p, f = v[idx], n[idx], p[idx], inv.ravel()[f]
    rot = v[p == 4]; cauda = v[p == 5]
    cx, cz = rot[:, 1].mean(), rot[:, 0].mean()            # cubo do rotor principal (frente, lado)
    chao = v[p != 4][:, 2].min()
    jogo = np.stack([v[:, 1] - cx, v[:, 2] - chao, v[:, 0] - cz], axis=1)
    nj = np.stack([n[:, 1], n[:, 2], n[:, 0]], axis=1)
    hub = [0.0, float(rot[:, 2].mean() - chao), 0.0]
    hubC = [float(cauda[:, 1].mean() - cx), float(cauda[:, 2].mean() - chao), float(cauda[:, 0].mean() - cz)]
    print(f'{len(f)} triângulos, {len(v)} vértices; caixa {jogo.min(0).round(2)} {jogo.max(0).round(2)}; rotor {np.round(hub,2)} cauda {np.round(hubC,2)}')
    print('triângulos por parte:', {k: int((p[f[:, 0]] == k).sum()) for k in range(7)})
    q = np.round(jogo * 1000).astype('<i2')
    nq = np.round(nj * 127).astype('i1')
    ind = f.astype('<u2' if len(v) < 65536 else '<u4')
    b64 = lambda a: base64.b64encode(a.tobytes()).decode()
    js = ('// (19/11) AH-2 Sabre (Mi-35M) p/ o modo helicóptero — gerado por scripts/mi35/converter.py. NÃO editar à mão.\n'
          '// Modelo 3D: "Russian Mil Mi-35M" por 42manako (Sketchfab), CC-BY-4.0: https://sketchfab.com/3d-models/russian-mil-mi-35m-cf353814ef14488599336f752b85d5d4\n'
          f'window.MI35={{pos:"{b64(q)}",nor:"{b64(nq)}",idx:"{b64(ind)}",i32:{1 if ind.dtype.itemsize == 4 else 0},parte:"{b64(p)}",'
          f'rotor:{[round(x, 3) for x in hub]},cauda:{[round(x, 3) for x in hubC]}}};\n')
    SAIDA.write_text(js)
    print(f'gravado {SAIDA} ({len(js) // 1024} KB)')


if __name__ == '__main__':
    main()
