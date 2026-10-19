"""Genera versiones livianas de las fotos para la web, en img/.
Uso, desde la carpeta del proyecto:  python herramientas/optimizar-imagenes.py
Requiere: Python 3 y Pillow 11 o más nuevo (trae AVIF; si no, se puede instalar pillow-avif-plugin).

Para cada .jpg de la raíz crea img/<nombre>-<ancho>.avif, .webp y .jpg en 480, 800 y 1200 px de ancho
(nunca más grande que la original) y escribe img/imagenes.json con los anchos de cada foto, que usan
index.html (a mano) y la carta (carta.js) para armar los <picture>.
También achica logo-maracaibo.png (el logo a color que usa el PDF).
Las .jpg originales se quedan en la raíz: el PDF las usa a resolución completa.
Logos de cerveza: ver el final del archivo. Solo los logos (rápido):  python herramientas/optimizar-imagenes.py marcas"""
from pathlib import Path
import json, sys
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

SOLO_MARCAS = 'marcas' in sys.argv[1:]
mapa = {}
for f in ([] if SOLO_MARCAS else sorted(root.glob('*.jpg'))):
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

if not SOLO_MARCAS:
    (out / 'imagenes.json').write_text(json.dumps(mapa, indent=1), encoding='utf-8')
    (out / 'imagenes.js').write_text('/* Generado por herramientas/optimizar-imagenes.py: anchos disponibles de cada foto. */\n'
                                     'window.IMAGENES = ' + json.dumps(mapa) + ';\n', encoding='utf-8')
    print('Listo:', len(mapa), 'fotos en img/')

# Logo a color: 1206 px y 1 MB → 800 px, paleta optimizada (lo usa el PDF, que lo vuelve transparente)
logo = root / 'logo-maracaibo.png'
im = Image.open(logo).convert('RGB')
if im.width > 800:
    im = im.resize((800, round(im.height * 800 / im.width)), Image.LANCZOS)
    im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(logo, optimize=True)
    print('logo-maracaibo.png optimizado:', logo.stat().st_size // 1024, 'KB')

# ---------- Logos de cerveza (img/marcas/) ----------
# Cada img/marcas/<marca>.png (fondo transparente) se recorta a lo que se ve y se achica a 240 px de ancho como máximo.
# El logo no se toca: se muestra con sus colores originales y fondo transparente (en oscuro, con un borde claro finito). Se puede correr las veces que sea.
# Escribe <marca>.png y .webp, y img/marcas/marcas.js con el nombre y el tamaño en pantalla de cada logo.
NOMBRES = {'imperial': 'Imperial', 'pilsen': 'Pilsen', 'bavaria': 'Bavaria', 'heineken': 'Heineken',
           'corona': 'Corona', 'sol': 'Sol', 'coors': 'Coors'}
MAX_W = 240
# tamaño en pantalla: misma superficie para todos (que ninguno grite más que otro), máximo 44 px de alto y 130 de ancho
AREA, ALTO, ANCHO = 4400, 44, 130
marcas = {}
mdir = out / 'marcas'
for f in sorted(mdir.glob('*.png')):
    im = Image.open(f).convert('RGBA')
    im = im.crop(im.getchannel('A').getbbox())
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
    im.save(f, 'PNG', optimize=True)
    im.save(f.with_suffix('.webp'), 'WEBP', quality=90, method=6)
    r = im.width / im.height
    h = min(ALTO, (AREA / r) ** .5, ANCHO / r)
    marcas[f.stem] = {'n': NOMBRES.get(f.stem, f.stem.capitalize()), 'w': round(h * r), 'h': round(h)}
    print(f'marcas/{f.name}: {im.width}×{im.height} px, en pantalla {marcas[f.stem]["w"]}×{marcas[f.stem]["h"]}')
if marcas:
    (mdir / 'marcas.js').write_text('/* Generado por herramientas/optimizar-imagenes.py: logos de img/marcas/ (nombre y tamaño en pantalla). */\n'
                                    'window.MARCAS = ' + json.dumps(marcas, ensure_ascii=False) + ';\n', encoding='utf-8')
