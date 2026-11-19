"""(19/11) leitor mínimo de GLB (só numpy): devolve json + função p/ ler accessors (com ou sem byteStride)."""
import json, struct
import numpy as np

def abre(caminho):
    b = open(caminho, 'rb').read()
    ln = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + ln])
    bin0 = 20 + ln + 8
    def acc(i):
        a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]
        n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
        dt = np.dtype({5126: '<f4', 5125: '<u4', 5123: '<u2', 5121: 'u1'}[a['componentType']])
        o = bin0 + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        st = bv.get('byteStride', 0) or n * dt.itemsize
        raw = np.frombuffer(b, dtype='u1', count=st * (a['count'] - 1) + n * dt.itemsize, offset=o)
        out = np.lib.stride_tricks.as_strided(raw, shape=(a['count'], n * dt.itemsize), strides=(st, 1)).copy().view(dt)
        return out.reshape(-1, n) if n > 1 else out.ravel()
    def img(i):
        bv = j['bufferViews'][j['images'][i]['bufferView']]
        o = bin0 + bv.get('byteOffset', 0)
        return b[o:o + bv['byteLength']]
    return j, acc, img
