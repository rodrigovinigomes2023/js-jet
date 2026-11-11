# Gripen STL -> modelo do js-jet: tira a base (peças 9,10,11), deita (nariz +x, topo +y, asa direita +z), 14,1 m, simplifica
# uso: python scripts/gripen_stl.py 14000 0.05   (precisa de trimesh + fast-simplification; lê ~/Downloads/Saab+JAS+39+Gripen-display+model.stl)
import sys, json, trimesh, numpy as np, fast_simplification as fs
ALVO = int(sys.argv[1]) if len(sys.argv) > 1 else 14000
m = trimesh.load('/home/gomes/Downloads/Saab+JAS+39+Gripen-display+model.stl')
parts = sorted(m.split(only_watertight=False), key=lambda p: -len(p.faces))
aviao = parts[:9]                       # 9,10 = base; 11 = pino
fus, deriva = parts[0], parts[4]
c = fus.vertices.mean(0)
_, _, vt = np.linalg.svd(fus.vertices - c, full_matrices=False)
X = vt[0]
if X[2] < 0: X = -X                     # nariz é a ponta de cima (pose de exposição subindo)
dc = deriva.vertices.mean(0) - c
Y0 = dc - X * dc.dot(X); Y0 /= np.linalg.norm(Y0)   # deriva p/ cima (só o sentido)
# eixo das asas: da ponta de uma asa à outra (as asas são simétricas; a deriva no STL não fica exatamente no centro)
wa, wb = aviao[2].vertices, aviao[3].vertices
def ponta(w):
    q = w - c; q = q - np.outer(q @ X, X)
    return w[np.argmax(np.linalg.norm(q, axis=1))]
Zw = ponta(wa) - ponta(wb); Zw = Zw - X * Zw.dot(X); Zw /= np.linalg.norm(Zw)
Y = np.cross(Zw, X)
if Y.dot(Y0) < 0: Y = -Y
Z = np.cross(X, Y)
R = np.stack([X, Y, Z])
todos = np.vstack([p.vertices for p in aviao])
t = (todos - c) @ R.T
esc = 14.1 / (t[:, 0].max() - t[:, 0].min())
cx = (t[:, 0].max() + t[:, 0].min()) / 2
cz = (t[:, 2].max() + t[:, 2].min()) / 2
grupos = {'corpo': [0, 1, 5, 6], 'asas': [2, 3], 'canards': [7, 8], 'deriva': [4]}
total = sum(len(p.faces) for p in aviao)
saida = {}
for nome, ids in grupos.items():
    vs, fs_ = [], []
    off = 0
    for i in ids:
        p = aviao[i]
        v = ((p.vertices - c) @ R.T - [cx, 0, cz]) * esc
        f = p.faces
        alvo = max(200, int(ALVO * len(f) / total))
        CEL = float(sys.argv[2]) if len(sys.argv) > 2 else 0.05   # junta vértices numa grade de CEL metros
        q = np.round(v / CEL).astype(np.int64)
        _, ini, inv = np.unique(q, axis=0, return_index=True, return_inverse=True)
        inv = inv.ravel()
        vq = np.zeros((len(ini), 3)); np.add.at(vq, inv, v); vq /= np.bincount(inv, minlength=len(ini))[:, None]
        fq = inv[f]
        fq = fq[(fq[:, 0] != fq[:, 1]) & (fq[:, 1] != fq[:, 2]) & (fq[:, 0] != fq[:, 2])]
        fq = np.unique(np.sort(fq, 1), axis=0, return_index=True)[1]
        fq = inv[f][(lambda a: a)(np.ones(len(f), bool))] if False else inv[f]
        ok = (fq[:, 0] != fq[:, 1]) & (fq[:, 1] != fq[:, 2]) & (fq[:, 0] != fq[:, 2])
        fq = fq[ok]
        _, u = np.unique(np.sort(fq, 1), axis=0, return_index=True); fq = fq[np.sort(u)]
        v2, f2 = fs.simplify(vq.astype(np.float32), fq.astype(np.int32), target_reduction=max(0.0, 1 - alvo / max(1, len(fq))))
        vs.append(v2); fs_.append(f2 + off); off += len(v2)
    V = np.vstack(vs); F = np.vstack(fs_)
    saida[nome] = {'v': np.round(V * 1000).astype(int).ravel().tolist(), 'f': F.ravel().tolist()}
    print(nome, len(V), 'vértices', len(F), 'triângulos')
T = np.vstack([np.array(s['v']).reshape(-1, 3) / 1000 for s in saida.values()])
print('caixa min', T.min(0).round(2), 'max', T.max(0).round(2))
TA = (np.array(saida['asas']['v']).reshape(-1, 3) / 1000)[np.array(saida['asas']['f']).reshape(-1, 3)]
def topo(x, z):   # altura da superfície de cima da asa no ponto (x, z): triângulos que cobrem o ponto visto de cima
    a, b, c = TA[:, 0], TA[:, 1], TA[:, 2]
    d = (b[:, 2] - c[:, 2]) * (a[:, 0] - c[:, 0]) + (c[:, 0] - b[:, 0]) * (a[:, 2] - c[:, 2])
    ok = abs(d) > 1e-9; d = np.where(ok, d, 1)
    l1 = ((b[:, 2] - c[:, 2]) * (x - c[:, 0]) + (c[:, 0] - b[:, 0]) * (z - c[:, 2])) / d
    l2 = ((c[:, 2] - a[:, 2]) * (x - c[:, 0]) + (a[:, 0] - c[:, 0]) * (z - c[:, 2])) / d
    l3 = 1 - l1 - l2
    dentro = ok & (l1 >= 0) & (l2 >= 0) & (l3 >= 0)
    y = (l1 * a[:, 1] + l2 * b[:, 1] + l3 * c[:, 1])[dentro]
    return float(y.max()) if len(y) else None
for z in (3.0, -3.0):
    print('asa z', z, 'topo em x=-3.4:', topo(-3.4, z))
saida['cocar'] = [[-3.4, round(topo(-3.4, z) + 0.02, 3), z] for z in (3.0, -3.0)]
json.dump(saida, open('/home/gomes/js-jet/fonte/gripen.json', 'w'), separators=(',', ':'))
