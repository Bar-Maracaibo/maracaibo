"""Genera la carta impresa desde menu-datos.js y config.js (las mismas fuentes que usa la web).
Uso, desde la carpeta del proyecto:  python herramientas/generar-menu.py [A|B]
  A (predeterminada): una hoja A4 a doble cara, 3 columnas, platos a 12 pt y descripciones a 9,5 pt.
     Si la carta crece y no entra, baja sola hasta 10,5 pt como mínimo; si ni así entra, usar B.
  B: dos hojas A4 a doble cara (4 caras), 2 columnas, platos a 12 pt y descripciones a 9,5 pt.
Salidas:
  menu-impreso.pdf   para imprimir en casa (A4, sin marcas)
  menu-imprenta.pdf  para la imprenta: 3 mm de sangrado por lado (216 × 303 mm) y marcas de corte
Requiere: Python 3, reportlab y Pillow. Fuentes Archivo e Instrument Serif (OFL) en herramientas/fuentes-pdf/,
colores en herramientas/tokens.json (los mismos de tokens.css).

Diseño propio de Maracaibo: franja negra con el logo a color y el nombre en Instrument Serif, una foto,
títulos de apartado en verde musgo, precios en negrita con cifras tabulares y separadores finos."""
from pathlib import Path
from collections import deque
import io, json, re, sys
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from reportlab.graphics import shapes as _shapes
from PIL import Image, ImageFilter

root = Path(__file__).resolve().parent.parent
sys.stdout.reconfigure(encoding='utf-8')
here = Path(__file__).parent

def load(file, var):
    """Lee window.VAR = {...}; de un .js, ignorando las líneas de comentario //."""
    src = (root / file).read_text(encoding='utf-8')
    body = re.search(r'window\.' + var + r'\s*=\s*(.*);\s*$', src, re.S).group(1)
    return json.loads('\n'.join(l for l in body.splitlines() if not l.strip().startswith('//')))
MENU = load('menu-datos.js', 'MENU')
# «Adicionales» va como nota compacta al final, no como apartado
SECCIONES = [c for c in MENU if c['id'] != 'adicionales']
ADIC = next((c for c in MENU if c['id'] == 'adicionales'), None)
CFG = load('config.js', 'CONFIG')
T = {k: HexColor(v) for k, v in json.loads((here / 'tokens.json').read_text(encoding='utf-8')).items() if k[0] != '_'}

fdir = here / 'fuentes-pdf'
for name in ['Regular', 'SemiBold', 'Bold', 'Italic']:
    pdfmetrics.registerFont(TTFont(name, str(fdir / f'Archivo-{name}.ttf')))
pdfmetrics.registerFont(TTFont('Serif', str(fdir / 'InstrumentSerif-Regular.ttf')))
pdfmetrics.registerFont(TTFont('SerifItalic', str(fdir / 'InstrumentSerif-Italic.ttf')))
# los dibujos de reportlab (el QR) declaran Times-Roman por defecto aunque no escriban texto: se usa Archivo para que todo vaya incrustado
_shapes.STATE_DEFAULTS['fontName'] = 'Regular'

W, H = A4
def money(p): return '₡' + format(p, ',').replace(',', '.')
def price_text(p): return 'Consultar' if p is None else money(p)
def hora12(h):
    h = int(h) % 24; return '12 a.m.' if h == 0 else '12 m.d.' if h == 12 else f'{h} a.m.' if h < 12 else f'{h - 12} p.m.'
HORARIO = f"Todos los días, {hora12(CFG['horario']['abre'])} – {hora12(CFG['horario']['cierra'])}"
def sw(s, font, size, track=0): return pdfmetrics.stringWidth(s, font, size) + track * max(len(s) - 1, 0)

def wrap(text, font, size, width):
    words, lines, cur = text.split(), [], ''
    for w_ in words:
        t = (cur + ' ' + w_).strip()
        if sw(t, font, size) <= width or not cur: cur = t
        else: lines.append(cur); cur = w_
    if cur: lines.append(cur)
    return lines

# ---------- imágenes ----------
def cover_crop(file, w, h, fy=.5):
    im = Image.open(root / file).convert('RGB'); iw, ih = im.size; target = w / h
    if iw / ih > target: cw = round(ih * target); x0 = (iw - cw) // 2; box = (x0, 0, x0 + cw, ih)
    else: ch = round(iw / target); y0 = round((ih - ch) * fy); box = (0, y0, iw, y0 + ch)
    buf = io.BytesIO(); im.crop(box).save(buf, 'JPEG', quality=88); buf.seek(0)
    return ImageReader(buf)

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
    im = im.crop(im.getbbox()); im.thumbnail((600, 600), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'PNG'); buf.seek(0)
    return ImageReader(buf), im.size
LOGO, (LW, LH) = logo_transparente()

# ---------- opciones de diseño ----------
OPCIONES = {
    'A': dict(faces=2, cols=3, name=12, desc=9.5, size=10, title=20, margin=10 * mm, gap=7 * mm, pad=2 * mm, space=4 * mm,
              band=34 * mm, photo=40 * mm, strip=40 * mm),
    'B': dict(faces=4, cols=2, name=12, desc=9.5, size=10, title=24, margin=14 * mm, gap=10 * mm, pad=2.2 * mm, space=4.5 * mm,
              band=52 * mm, photo=58 * mm, strip=52 * mm),
}

class Doc:
    def __init__(self, path, opt, bleed):
        self.o = opt; self.b = 3 * mm if bleed else 0
        self.c = canvas.Canvas(str(path), pagesize=(W + 2 * self.b, H + 2 * self.b), initialFontName='Regular')
        self.c.setTitle('Bar Maracaibo · La carta'); self.c.setAuthor('Bar Maracaibo')
        self.c.setSubject('Carta para la imprenta (sangrado de 3 mm y marcas de corte)' if bleed else 'Carta para imprimir en casa, A4')
        self.page_open = False

    # coordenadas de la página final (sin sangrado); el sangrado se suma aquí
    def txt(self, s, x, y, font, size, color, align='l', track=0):
        c = self.c; c.setFont(font, size); c.setFillColor(color); x += self.b; y += self.b
        if align == 'l': c.drawString(x, y, s, charSpace=track)
        elif align == 'r': c.drawRightString(x, y, s, charSpace=track)
        else: c.drawCentredString(x, y, s, charSpace=track)
    def rect(self, x, y, w, h, color, r=0, bleed_edges=False):
        c = self.c; c.setFillColor(color)
        if bleed_edges:   # la franja toca el borde: se estira hasta el sangrado
            x0 = x - self.b if x <= 0 else x; x1 = x + w + self.b if x + w >= W else x + w
            y0 = y - self.b if y <= 0 else y; y1 = y + h + self.b if y + h >= H else y + h
            c.rect(x0 + self.b, y0 + self.b, x1 - x0, y1 - y0, fill=1, stroke=0)
        elif r: c.roundRect(x + self.b, y + self.b, w, h, r, fill=1, stroke=0)
        else: c.rect(x + self.b, y + self.b, w, h, fill=1, stroke=0)
    def line(self, x1, y1, x2, y2, color, wdt=.5):
        self.c.setStrokeColor(color); self.c.setLineWidth(wdt); self.c.line(x1 + self.b, y1 + self.b, x2 + self.b, y2 + self.b)
    def photo(self, file, x, y, w, h, r, fy=.5):
        c = self.c; c.saveState(); p = c.beginPath(); p.roundRect(x + self.b, y + self.b, w, h, r); c.clipPath(p, stroke=0, fill=0)
        c.drawImage(cover_crop(file, w, h, fy), x + self.b, y + self.b, width=w, height=h); c.restoreState()
    def logo(self, x, y, w):
        self.c.drawImage(LOGO, x + self.b, y + self.b, width=w, height=w * LH / LW, mask='auto')
    def qr(self, value, x, y, size):
        q = QrCodeWidget(value); q.barLevel = 'M'; q.barFillColor = T['noche']
        bb = q.getBounds(); bw, bh = bb[2] - bb[0], bb[3] - bb[1]
        d = Drawing(size, size, transform=[size / bw, 0, 0, size / bh, 0, 0]); d.add(q)
        renderPDF.draw(d, self.c, x + self.b, y + self.b)
    def crop_marks(self):
        """Marcas de corte en las esquinas, dentro del sangrado (blanco debajo para que se vean sobre el negro)."""
        if not self.b: return
        c = self.c; b = self.b; L = b - .6 * mm
        for cx, cy, sx, sy in ((b, b, -1, -1), (b + W, b, 1, -1), (b, b + H, -1, 1), (b + W, b + H, 1, 1)):
            for col, wd in ((white, 1.2), (HexColor('#000000'), .3)):
                c.setStrokeColor(col); c.setLineWidth(wd)
                c.line(cx + sx * .6 * mm, cy, cx + sx * (.6 * mm + L), cy)
                c.line(cx, cy + sy * .6 * mm, cx, cy + sy * (.6 * mm + L))
    def new_page(self):
        if self.page_open: self.crop_marks(); self.c.showPage()
        self.page_open = True
        self.rect(0, 0, W, H, T['papel'], bleed_edges=True)
    def save(self):
        self.crop_marks(); self.c.save()

# ---------- medida y dibujo de cada plato (una lista de operaciones con y relativa) ----------
def layout_item(it, w, o):
    ops, y = [], 0
    has_price = not it.get('sizes')
    price = price_text(it.get('p')) if has_price else ''
    pw = sw(price, 'Bold', o['name']) if has_price else 0
    name_w = w - (pw + 3 * mm if has_price else 0)
    lines = wrap(it['n'], 'Regular', o['name'], name_w)
    lh = o['name'] * 1.18
    for i, l in enumerate(lines):
        y += lh if i else o['name'] * .95
        ops.append(('t', l, 0, y, 'Regular', o['name'], 'tinta', 'l'))
        if i == 0 and has_price:
            ops.append(('t', price, w, y, 'Bold', o['name'], 'tinta' if it.get('p') is not None else 'gris', 'r'))
    if 'popular' in (it.get('tags') or []):        # etiqueta sobria «Lo más pedido»
        label = 'LO MÁS PEDIDO'; bs = o['desc'] * .72; bw = sw(label, 'SemiBold', bs, .35) + 2.4 * mm
        last_w = sw(lines[-1], 'Regular', o['name'])
        if last_w + 2 * mm + bw <= name_w: bx, by = last_w + 2 * mm, y
        else: y += bs * 1.9; bx, by = 0, y
        ops.append(('pill', label, bx, by, bw, bs))
    if it.get('d'):
        for l in wrap(it['d'], 'Regular', o['desc'], w - (0 if not has_price else 2 * mm)):
            y += o['desc'] * 1.28; ops.append(('t', l, 0, y, 'Regular', o['desc'], 'gris', 'l'))
    if it.get('sizes'):
        parts = [f"{s['l']} {price_text(s['p'])}" for s in it['sizes']]
        fs, sep = o['size'], '  ·  '               # los tamaños van en una sola línea: hasta 1 pt menos y separador más corto
        while sw(sep.join(parts), 'SemiBold', fs) > w and fs > o['size'] - 1: fs -= .5
        if sw(sep.join(parts), 'SemiBold', fs) > w: sep = ' · '
        if sw(sep.join(parts), 'SemiBold', fs) > w: fs, sep = o['size'], '  ·  '   # ni así entra (Surtido a 3 columnas): una línea por tamaño
        row, rows = '', []
        for ptxt in parts:
            t = (row + sep + ptxt) if row else ptxt
            if sw(t, 'SemiBold', fs) <= w or not row: row = t
            else: rows.append(row); row = ptxt
        rows.append(row)
        for r_ in rows:
            y += o['size'] * 1.42; ops.append(('t', r_, 0, y, 'SemiBold', fs, 'tinta', 'l'))
    y += o['desc'] * .75
    return ops, y

def draw_ops(d, ops, x, top):
    for op in ops:
        if op[0] == 't':
            _, s, dx, dy, font, size, col, al = op
            d.txt(s, x + dx, top - dy, font, size, T[col], al)
        else:
            _, s, dx, dy, bw, bs = op
            cy = top - dy
            d.c.setStrokeColor(T['musgo']); d.c.setLineWidth(.55)
            d.c.roundRect(x + dx + d.b, cy - bs * .45 + d.b, bw, bs * 1.75, bs * .875, fill=0, stroke=1)
            d.txt(s, x + dx + 1.2 * mm, cy, 'SemiBold', bs, T['musgo'], track=.35)

# ---------- bloques que se reparten en columnas ----------
def blocks(o, w):
    """Cada apartado se vuelve una lista de bloques: título, subgrupo o plato, con su alto."""
    out = []
    for cat in SECCIONES:
        out.append(('title', cat, o['title'] * 1.05 + 3.4 * mm))
        prev_g = None
        for it in cat['items']:
            if it.get('g') and it['g'] != prev_g:
                out.append(('group', it['g'], o['desc'] * 2.2)); prev_g = it['g']
            ops, h = layout_item(it, w, o)
            out.append(('item', (ops, cat), h + o['pad']))
        out.append(('space', None, o['space']))
    if ADIC:                                       # nota de adicionales: «Adicional para cualquier plato ₡500 · …»
        lines = [l for it in ADIC['items'] for l in wrap(f"{it['n']}{' ' + it['d'][0].lower() + it['d'][1:] if it.get('d') else ''} {price_text(it.get('p'))}", 'Regular', o['desc'], w)]
        out.append(('extras', lines, o['desc'] * 2.1 + len(lines) * o['desc'] * 1.3 + 1.5 * mm))
    return out

def flow(o, areas):
    """Reparte los bloques en las áreas (cara, x, y_arriba, y_abajo). Devuelve las ubicaciones o None si no entra."""
    w = (W - 2 * o['margin'] - (o['cols'] - 1) * o['gap']) / o['cols']
    bl = blocks(o, w); placed = []; ai = 0
    face, x, top, bottom = areas[0]; y = top
    i = 0
    while i < len(bl):
        kind, data, h = bl[i]
        need = h
        if kind == 'title':                       # un título nunca queda solo al pie: con al menos dos platos
            nxt = [b for b in bl[i + 1:i + 4] if b[0] != 'group'][:2]
            need = h + sum(b[2] for b in nxt) + (bl[i + 1][2] if bl[i + 1][0] == 'group' else 0)
        if kind == 'group': need = h + bl[i + 1][2]
        if kind == 'space' and y - h < bottom: i += 1; continue
        if y - need < bottom:
            ai += 1
            if ai >= len(areas): return None, w
            face, x, top, bottom = areas[ai]; y = top
            if kind == 'item':                    # el apartado sigue en otra columna: se repite el título
                cat = data[1]
                th = o['title'] * 1.05 + 3.4 * mm
                placed.append((face, 'title', (cat, True), x, y, th)); y -= th
            continue
        if kind == 'space' and y == top: i += 1; continue
        placed.append((face, kind, data, x, y, h)); y -= h; i += 1
    return placed, w

def areas_for(o, top_reserved, bottom_reserved):
    """Columnas de cada cara: reserva arriba (franja y foto) y abajo (QR y datos)."""
    m = o['margin']; w = (W - 2 * m - (o['cols'] - 1) * o['gap']) / o['cols']
    out = []
    for f in range(o['faces']):
        top = H - top_reserved.get(f, m + 8 * mm); bottom = bottom_reserved.get(f, m + 6 * mm)
        for k in range(o['cols']):
            out.append((f, m + k * (w + o['gap']), top, bottom))
    return out

def build(path, key, bleed):
    o = dict(OPCIONES[key])
    band, photo_h, strip = o['band'], o['photo'], o['strip']
    last = o['faces'] - 1
    # si no entra: media letra menos (nunca menos de 10,5 pt), menos aire entre platos y foto más baja
    tries = [(o['name'], o['pad'], photo_h)] + ([(o['name'], o['pad'], 28 * mm), (11, 1.6 * mm, 28 * mm), (11, 1.3 * mm, 20 * mm),
                                                  (10.5, 1.0 * mm, 16 * mm), (10.5, .8 * mm, 12 * mm)] if key == 'A' else [])
    for size, pad, ph in tries:
        o['name'], o['pad'], photo_h = size, pad, ph
        areas = areas_for(o, {0: band + photo_h + 6 * mm + o['margin']}, {last: strip + 8 * mm})
        placed, cw = flow(o, areas)
        if placed: break
    if not placed: raise SystemExit(f'La carta no entra en la opción {key}')
    d = Doc(path, o, bleed)
    m = o['margin']
    for f in range(o['faces']):
        d.new_page()
        if f == 0:                                 # franja negra con el logo a color y el nombre
            d.rect(0, H - band, W, band, T['noche'], bleed_edges=True)
            lg = band * .62
            d.logo(m, H - band / 2 - lg * LH / LW / 2, lg)
            info = ('San Lorenzo, San José', HORARIO, f"WhatsApp {CFG['telefono']}")
            isz = 8.5 if key == 'A' else 9.5
            room = W - 2 * m - lg - 6 * mm - max(sw(t, 'Regular', isz) for t in info) - 8 * mm
            ns = band * .58                        # el nombre se achica hasta que entre junto a «La carta»
            while sw('Maracaibo', 'Serif', ns) + 3 * mm + sw('La carta', 'SerifItalic', ns * .5) > room: ns -= 1
            base = H - band / 2 - ns * .28
            d.txt('Maracaibo', m + lg + 6 * mm, base, 'Serif', ns, T['hueso'])
            d.txt('La carta', m + lg + 6 * mm + sw('Maracaibo', 'Serif', ns) + 3 * mm, base, 'SerifItalic', ns * .5, T['musgo_claro'])
            for k, t in enumerate(info):
                d.txt(t, W - m, H - band / 2 + 3.6 * mm - k * 4.4 * mm, 'Regular', isz, T['gris_noche'], 'r')
            d.photo('portada_surtida.jpg', m, H - band - 4 * mm - photo_h, W - 2 * m, photo_h, 3 * mm, .48)
        else:
            d.txt('Maracaibo', m, H - m - 2 * mm, 'Serif', 16, T['tinta'])
            d.txt('La carta', W - m, H - m - 2 * mm, 'Regular', 8.5, T['gris'], 'r')
            d.line(m, H - m - 5 * mm, W - m, H - m - 5 * mm, T['linea'])
        for (face, kind, data, x, y, h) in placed:
            if face != f: continue
            if kind == 'title':
                cat, cont = data if isinstance(data, tuple) else (data, False)
                t = cat['title'] + (' (sigue)' if cont else '')
                d.txt(t, x, y - o['title'] * .82, 'Serif', o['title'], T['musgo'])
                d.line(x, y - o['title'] * 1.05, x + cw, y - o['title'] * 1.05, T['musgo'], .6)
            elif kind == 'group':
                d.txt(data.upper(), x, y - o['desc'] * 1.45, 'SemiBold', o['desc'] * .82, T['gris'], track=.5)
            elif kind == 'extras':
                d.line(x, y, x + cw, y, T['linea'], .4)
                d.txt('ADICIONALES', x, y - o['desc'] * 1.5, 'SemiBold', o['desc'] * .82, T['musgo'], track=.5)
                for j, l in enumerate(data):
                    d.txt(l, x, y - o['desc'] * 1.5 - (j + 1) * o['desc'] * 1.3, 'Regular', o['desc'], T['tinta'])
            elif kind == 'item':
                draw_ops(d, data[0], x, y - 1.2 * mm)
                d.line(x, y - h + .6 * mm, x + cw, y - h + .6 * mm, T['linea'], .4)
        if f == last:                              # franja con QR, horario, teléfono y nota de precios
            d.rect(0, 0, W, strip, T['noche'], bleed_edges=True)
            q = min(strip - 16 * mm, 32 * mm); y0 = (strip - q) / 2 + 1 * mm; lw = 28 * mm
            for k, (label, url) in enumerate((('La carta en tu celular', CFG['sitio'] + 'menu.html'),
                                              ('Reservá por WhatsApp', f"https://wa.me/{CFG['whatsapp']}?text=Hola%2C%20quiero%20reservar%20una%20mesa%20en%20Bar%20Maracaibo."))):
                qx = m + k * (q + 4 * mm + lw + 6 * mm)
                d.rect(qx - 1.6 * mm, y0 - 1.6 * mm, q + 3.2 * mm, q + 3.2 * mm, white, r=2 * mm)
                d.qr(url, qx, y0, q)
                d.txt(label, qx + q + 4 * mm, y0 + q - 3.5 * mm, 'SemiBold', 9, T['hueso'])
                for j, l in enumerate(wrap('Escaneá el código con la cámara del celular.', 'Regular', 8, lw)):
                    d.txt(l, qx + q + 4 * mm, y0 + q - 8.5 * mm - j * 3.6 * mm, 'Regular', 8, T['gris_noche'])
            rx = W - m
            d.txt('Bar Maracaibo', rx, strip - 13 * mm, 'Serif', 20, T['hueso'], 'r')
            for k, t in enumerate((HORARIO, f"WhatsApp {CFG['telefono']}", CFG['notaPrecios'])):
                d.txt(t, rx, strip - 20 * mm - k * 4.6 * mm, 'Regular', 8.5, T['gris_noche'], 'r')
        d.txt(f'{f + 1} / {o["faces"]}', W - m, 4.5 * mm if f == last else 6 * mm, 'Regular', 7.5, T['gris_noche'] if f == last else T['gris'], 'r')
    d.save()
    print(f'Opción {key}, {path.name}: {o["faces"]} caras, {o["cols"]} columnas, nombres a {o["name"]} pt, descripciones a {o["desc"]} pt, '
          f'aire entre platos {o["pad"] / mm:.1f} mm, foto de {photo_h / mm:.0f} mm')
    return o

if __name__ == '__main__':
    # A es la predeterminada: con la carta real (75 platos) entra en una sola hoja a 12 pt, igual de legible que B y con la mitad de papel
    key = (sys.argv[1] if len(sys.argv) > 1 else 'A').upper()
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else root
    build(out / 'menu-impreso.pdf', key, bleed=False)
    build(out / 'menu-imprenta.pdf', key, bleed=True)
