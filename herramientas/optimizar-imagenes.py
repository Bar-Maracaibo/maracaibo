"""Genera versiones livianas de las fotos para la web, en img/.
Uso, desde la carpeta del proyecto:  python herramientas/optimizar-imagenes.py
Requiere: Python 3 y Pillow 11 o más nuevo (trae AVIF; si no, se puede instalar pillow-avif-plugin).

Para cada .jpg de la raíz crea img/<nombre>-<ancho>.avif, .webp y .jpg en 480, 800 y 1200 px de ancho
(nunca más grande que la original) y escribe img/imagenes.json con los anchos de cada foto, que usan
index.html (a mano) y la carta (carta.js) para armar los <picture>.
También achica logo-maracaibo.png (el logo a color que usa el PDF).
Las .jpg originales se quedan en la raíz: el PDF las usa a resolución completa."""
from pathlib import Path
import json
from PIL import Image, features

try:                                    # Pillow viejo: el plugin agrega AVIF
    import pillow_avif  # noqa: F401
except ImportError:
    pass

root = Path(__file__).resolve().parent.parent
out = root / 'img'; out.mkdir(exist_ok=True)
ANCHOS = (480, 800, 1200)
AVIF = features.check('avif')
if not AVIF:
    print('Aviso: este Pillow no tiene AVIF; se generan solo WebP y JPG.')

mapa = {}
for f in sorted(root.glob('*.jpg')):
    if f.stem.startswith('og-'): continue        # og-maracaibo.jpg es generada (generar-seo.py), no es una foto
    im = Image.open(f).convert('RGB')
    anchos = sorted({min(w, im.width) for w in ANCHOS})
    for w in anchos:
        h = round(im.height * w / im.width)
        r = im.resize((w, h), Image.LANCZOS) if w < im.width else im
        base = out / f'{f.stem}-{w}'
        r.save(base.with_suffix('.jpg'), 'JPEG', quality=78, optimize=True, progressive=True)
        r.save(base.with_suffix('.webp'), 'WEBP', quality=74, method=6)
        if AVIF:
            r.save(base.with_suffix('.avif'), 'AVIF', quality=58, speed=4)
    mapa[f.stem] = {'w': anchos, 'ratio': round(im.width / im.height, 4), 'avif': AVIF}
    print(f'{f.name}: {", ".join(map(str, anchos))} px')

(out / 'imagenes.json').write_text(json.dumps(mapa, indent=1), encoding='utf-8')
(out / 'imagenes.js').write_text('/* Generado por herramientas/optimizar-imagenes.py: anchos disponibles de cada foto. */\n'
                                 'window.IMAGENES = ' + json.dumps(mapa) + ';\n', encoding='utf-8')

# Logo a color: 1206 px y 1 MB → 800 px, paleta optimizada (lo usa el PDF, que lo vuelve transparente)
logo = root / 'logo-maracaibo.png'
im = Image.open(logo).convert('RGB')
if im.width > 800:
    im = im.resize((800, round(im.height * 800 / im.width)), Image.LANCZOS)
    im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(logo, optimize=True)
    print('logo-maracaibo.png optimizado:', logo.stat().st_size // 1024, 'KB')
print('Listo:', len(mapa), 'fotos en img/')
