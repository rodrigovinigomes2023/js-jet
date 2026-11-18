# (11/11) prepara a pele do avião a partir da MetalPlates001 (ambientCG, CC0): cor vira tom de cinza com média ~0,92
# (multiplica a cor de cada time) e a rugosidade vai p/ 512. Saída em fonte/ (o servidor só serve arquivos soltos de fonte/).
from PIL import Image, ImageStat
from pathlib import Path
A = Path(__file__).resolve().parent.parent / 'assets/texturas/ambientcg'
S = Path(__file__).resolve().parent.parent / 'fonte'
c = Image.open(A / 'MetalPlates001_1K-JPG_Color.jpg').convert('L')
m = ImageStat.Stat(c).mean[0]
c = c.point(lambda v: max(0, min(255, round(v * 235 / m))))
c.save(S / 'pele_cor.jpg', quality=88)
Image.open(A / 'MetalPlates001_1K-JPG_NormalGL.jpg').convert('RGB').save(S / 'pele_normal.jpg', quality=90)
Image.open(A / 'MetalPlates001_1K-JPG_Roughness.jpg').convert('L').resize((512, 512), Image.LANCZOS).save(S / 'pele_rug.jpg', quality=88)
print('ok', round(m, 1))
