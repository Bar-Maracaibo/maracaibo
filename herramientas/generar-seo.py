"""Genera lo que leen Google, WhatsApp y el celular al instalar la página:
  - og-maracaibo.jpg: imagen horizontal de 1200×630 para compartir (foto de la surtida + nombre en Instrument Serif)
  - icono-192.png e icono-512.png: íconos de la app (manifest.webmanifest), con margen seguro para Android
  - Datos estructurados JSON-LD (schema.org BarOrPub + la carta completa) dentro de index.html y menu.html,
    entre los comentarios <!-- JSON-LD:inicio --> y <!-- JSON-LD:fin -->.
Uso, desde la carpeta del proyecto:  python herramientas/generar-seo.py
Volver a correrlo cada vez que cambie la carta (menu-datos.js) o config.js."""
from pathlib import Path
from collections import deque
import json, re
from PIL import Image, ImageDraw, ImageFont, ImageFilter

root = Path(__file__).resolve().parent.parent
fdir = Path(__file__).parent / 'fuentes-pdf'
tok = json.loads((Path(__file__).parent / 'tokens.json').read_text(encoding='utf-8'))

def load(file, var):
    src = (root / file).read_text(encoding='utf-8')
    body = re.search(r'window\.' + var + r'\s*=\s*(.*);\s*$', src, re.S).group(1)
    return json.loads('\n'.join(l for l in body.splitlines() if not l.strip().startswith('//')))
MENU = load('menu-datos.js', 'MENU')
CFG = load('config.js', 'CONFIG')
SITE = CFG['sitio'].rstrip('/') + '/'

def hexrgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def cover(im, w, h, fy=.5):
    r = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x = (im.width - w) // 2; y = round((im.height - h) * fy)
    return im.crop((x, y, x + w, y + h))

# ---------- og-maracaibo.jpg (1200×630) ----------
W, H = 1200, 630
og = Image.new('RGB', (W, H), hexrgb(tok['noche']))
photo = cover(Image.open(root / 'portada_surtida.jpg').convert('RGB'), 700, H, .45)
og.paste(photo, (W - 700, 0))
# fundido de la foto hacia el panel oscuro
fade = Image.new('L', (220, H)); fd = ImageDraw.Draw(fade)
for x in range(220): fd.line([(x, 0), (x, H)], fill=round(255 * (1 - x / 219) ** 1.6))
og.paste(Image.new('RGB', (220, H), hexrgb(tok['noche'])), (W - 700, 0), fade)
d = ImageDraw.Draw(og)
serif = ImageFont.truetype(str(fdir / 'InstrumentSerif-Regular.ttf'), 132)
serif_i = ImageFont.truetype(str(fdir / 'InstrumentSerif-Italic.ttf'), 46)
sans = ImageFont.truetype(str(fdir / 'Archivo-SemiBold.ttf'), 24)
d.line([(72, 196), (112, 196)], fill=hexrgb(tok['musgo_claro']), width=2)
d.text((128, 182), 'BAR DE PUEBLO · SAN LORENZO', font=sans, fill=hexrgb(tok['gris_noche']))
d.text((64, 222), 'Maracaibo', font=serif, fill=hexrgb(tok['hueso']))
d.text((72, 380), 'Nos vemos en Maracaibo.', font=serif_i, fill=hexrgb(tok['musgo_claro']))
d.text((72, 520), f"Todos los días · WhatsApp {CFG['telefono']}", font=sans, fill=hexrgb(tok['gris_noche']))
og.save(root / 'og-maracaibo.jpg', 'JPEG', quality=86, optimize=True, progressive=True)
print('og-maracaibo.jpg', og.size, (root / 'og-maracaibo.jpg').stat().st_size // 1024, 'KB')

# ---------- Íconos de la app ----------
def logo_transparente():
    """El logo original tiene fondo blanco: se vuelve transparente el blanco que toca los bordes."""
    im = Image.open(root / 'logo-maracaibo.png').convert('RGBA'); w, h = im.size
    px = im.load(); mask = Image.new('L', (w, h), 0); mp = mask.load()
    q = deque([(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]); seen = set(q)
    while q:
        x, y = q.popleft()
        if min(px[x, y][:3]) < 228: continue
        mp[x, y] = 255
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= n[0] < w and 0 <= n[1] < h and n not in seen: seen.add(n); q.append(n)
    im.putalpha(Image.eval(mask.filter(ImageFilter.GaussianBlur(1.2)), lambda v: 255 - v))
    return im.crop(im.getbbox())
logo = logo_transparente()
for size in (192, 512):
    ic = Image.new('RGBA', (size, size), hexrgb(tok['noche']) + (255,))
    s = round(size * .72)                  # zona segura de los íconos «maskable»: 80 % del centro
    l = logo.copy(); l.thumbnail((s, s), Image.LANCZOS)
    ic.alpha_composite(l, ((size - l.width) // 2, (size - l.height) // 2))
    ic.convert('RGB').save(root / f'icono-{size}.png', optimize=True)
print('icono-192.png e icono-512.png')

# ---------- JSON-LD ----------
def offers(it):
    if it.get('sizes'):
        return [{'@type': 'Offer', 'name': s['l'], 'price': s['p'], 'priceCurrency': 'CRC'} for s in it['sizes'] if s['p'] is not None]
    return [{'@type': 'Offer', 'price': it['p'], 'priceCurrency': 'CRC'}] if it.get('p') is not None else []

menu = {
    '@type': 'Menu', 'name': 'La carta', 'url': SITE + 'menu.html', 'inLanguage': 'es-CR',
    'hasMenuSection': [{
        '@type': 'MenuSection', 'name': c['title'],
        'hasMenuItem': [dict({'@type': 'MenuItem', 'name': it['n']},
                             **({'description': it['d']} if it.get('d') else {}),
                             **({'offers': o if len(o) > 1 else o[0]} if (o := offers(it)) else {}))
                        for it in c['items']]
    } for c in MENU]
}
H_ = CFG['horario']
bar = {
    '@context': 'https://schema.org', '@type': 'BarOrPub', '@id': SITE + '#bar',
    'name': CFG['nombre'], 'url': SITE, 'image': SITE + 'og-maracaibo.jpg', 'logo': SITE + 'icono-512.png',
    'telephone': '+' + CFG['whatsapp'],
    'address': {'@type': 'PostalAddress', 'addressLocality': 'San Lorenzo', 'addressRegion': 'San José', 'addressCountry': 'CR'},
    'geo': {'@type': 'GeoCoordinates', 'latitude': CFG['geo']['lat'], 'longitude': CFG['geo']['lng']},
    'hasMap': CFG['mapa'],
    'openingHoursSpecification': [{
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        'opens': f"{H_['abre']:02d}:00", 'closes': '23:59' if H_['cierra'] >= 24 else f"{H_['cierra']:02d}:00"}],
    'priceRange': '₡', 'servesCuisine': 'Costarricense', 'acceptsReservations': True,
    'menu': SITE + 'menu.html',
    'sameAs': [u for u in (CFG.get('facebook'), CFG.get('instagram')) if u],
}
if CFG.get('googleRating') and CFG['googleRating'].get('valor'):
    g = CFG['googleRating']
    bar['aggregateRating'] = {'@type': 'AggregateRating', 'ratingValue': g['valor'], 'reviewCount': g.get('resenas') or 1, 'bestRating': 5}

paginas = {
    'index.html': dict(bar, hasMenu=menu),
    'menu.html': dict({'@context': 'https://schema.org'}, **menu, isPartOf={'@id': SITE + '#bar'}),
}
for page, data in paginas.items():
    f = root / page; html = f.read_text(encoding='utf-8')
    block = ('<!-- JSON-LD:inicio (lo genera herramientas/generar-seo.py; no editar a mano) -->\n'
             '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '</script>\n'
             '<!-- JSON-LD:fin -->')
    if '<!-- JSON-LD:inicio' in html:
        html = re.sub(r'<!-- JSON-LD:inicio.*?<!-- JSON-LD:fin -->', lambda m: block, html, flags=re.S)
    else:
        html = html.replace('</head>', block + '\n</head>', 1)
    f.write_text(html, encoding='utf-8')
    print(page, 'JSON-LD:', len(json.dumps(data, ensure_ascii=False)) // 1024, 'KB')
