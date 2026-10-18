"""Genera menu-impreso.pdf (4 páginas A4) desde ../menu-datos.js, la misma fuente que usa la web.
Uso, desde la carpeta del proyecto:  python herramientas/generar-menu.py
Requiere: Python 3, reportlab y Pillow. Las fuentes Archivo e Instrument Serif (OFL) están en herramientas/fuentes-pdf/.

Diseño propio de Maracaibo (distinto al de La Gallera): portada con foto y el nombre en Instrument Serif
sobre negro cálido; páginas en papel blanco con títulos en verde, precios en negro con cifras tabulares,
separadores finos sin guías de puntos y una foto panorámica por página."""
from pathlib import Path
from collections import deque
import io, json, re
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
from PIL import Image, ImageFilter

root = Path(__file__).resolve().parent.parent
src = (root / 'menu-datos.js').read_text(encoding='utf-8')
data = json.loads(re.search(r'window\.MENU\s*=\s*(\[.*\]);', src, re.S).group(1))
by = {x['id']: x for x in data}
assert sum(len(c['items']) for c in data) == 43, 'La carta debe tener 43 opciones'

fdir = Path(__file__).parent / 'fuentes-pdf'
for name in ['Light', 'Regular', 'SemiBold', 'Bold', 'Italic']:
    pdfmetrics.registerFont(TTFont(name, str(fdir / f'Archivo-{name}.ttf')))
pdfmetrics.registerFont(TTFont('Serif', str(fdir / 'InstrumentSerif-Regular.ttf')))
pdfmetrics.registerFont(TTFont('SerifItalic', str(fdir / 'InstrumentSerif-Italic.ttf')))

negro = HexColor('#0c0b09'); hueso = HexColor('#f3efe6'); gris_noche = HexColor('#a39e93')
verde = HexColor('#127a35')
tinta = HexColor('#1d1d1f'); gris = HexColor('#6e6e73'); gris_claro = HexColor('#a1a1a6')
linea = HexColor('#e5e5ea'); linea_fuerte = HexColor('#1d1d1f')
W, H = A4
M = 15 * mm                     # margen
c = canvas.Canvas(str(root / 'menu-impreso.pdf'), pagesize=A4)
c.setTitle('Bar Maracaibo · La carta'); c.setAuthor('Bar Maracaibo'); c.setSubject('Carta para imprimir, 4 páginas A4')

def money(p): return '₡' + format(p, ',').replace(',', '.')

def txt(s, x, y, font, size, color, align='l', track=0):
    c.setFont(font, size); c.setFillColor(color)
    if align == 'l': c.drawString(x, y, s, charSpace=track)
    elif align == 'r': c.drawRightString(x, y, s, charSpace=track)
    else: c.drawCentredString(x, y, s, charSpace=track)

def width(s, font, size, track=0): return pdfmetrics.stringWidth(s, font, size) + track * max(len(s) - 1, 0)

def cover_crop(file, w, h, fy=.5):
    """Recorta la foto al formato del recuadro (como object-fit: cover), centrada en la altura fy."""
    im = Image.open(root / file).convert('RGB'); iw, ih = im.size
    target = w / h
    if iw / ih > target:
        cw = round(ih * target); x0 = (iw - cw) // 2; box = (x0, 0, x0 + cw, ih)
    else:
        ch = round(iw / target); y0 = round((ih - ch) * fy); box = (0, y0, iw, y0 + ch)
    buf = io.BytesIO(); im.crop(box).save(buf, 'JPEG', quality=90); buf.seek(0)
    return ImageReader(buf)

def rounded_photo(file, x, y, w, h, r, fy=.5):
    c.saveState(); p = c.beginPath(); p.roundRect(x, y, w, h, r); c.clipPath(p, stroke=0, fill=0)
    c.drawImage(cover_crop(file, w, h, fy), x, y, width=w, height=h); c.restoreState()

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
    im = im.crop(im.getbbox()); im.thumbnail((700, 700), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'PNG'); buf.seek(0)
    return ImageReader(buf), im.size

LOGO, (LW, LH) = logo_transparente()
def logo(x, y, w):
    c.drawImage(LOGO, x, y, width=w, height=w * LH / LW, mask='auto')

def qr(value, x, y, size):
    w = QrCodeWidget(value); w.barLevel = 'M'
    b = w.getBounds(); bw, bh = b[2] - b[0], b[3] - b[1]
    d = Drawing(size, size, transform=[size / bw, 0, 0, size / bh, 0, 0]); d.add(w)
    renderPDF.draw(d, c, x, y)

NAME, PRICE, DESC = 12.5, 12.5, 10      # 12,5 pt: lectura cómoda en la mesa
ROW = 8.4 * mm

def section(cid, x, y, w):
    cat = by[cid]; n = len(cat['items'])
    meta = f"{n} {'opción' if n == 1 else 'opciones'}"
    ts = 20
    while width(cat['title'], 'SemiBold', ts) > w - width(meta, 'Regular', 9.5) - 5 * mm: ts -= .5
    txt(cat['title'], x, y - 20, 'SemiBold', ts, verde)
    txt(meta, x + w, y - 20, 'Regular', 9.5, gris, 'r')
    y -= 27
    c.setStrokeColor(linea_fuerte); c.setLineWidth(.7); c.line(x, y, x + w, y)
    for i, it in enumerate(cat['items']):
        price = money(it['p']); pw = width(price, 'SemiBold', PRICE)
        size = NAME
        while width(it['n'], 'Regular', size) > w - pw - 4 * mm and size > 10.5: size -= .25
        y -= ROW - 2.6 * mm
        y -= size * .72
        txt(it['n'], x, y, 'Regular', size, tinta)
        txt(price, x + w, y, 'SemiBold', PRICE, tinta, 'r')
        if it.get('d'):
            y -= DESC + 3.5; txt(it['d'], x, y, 'Regular', DESC, gris)
        y -= 3.2 * mm
        if i < n - 1:
            c.setStrokeColor(linea); c.setLineWidth(.6); c.line(x, y, x + w, y)
    return y - 12 * mm

# ---------- Portada ----------
c.setFillColor(negro); c.rect(0, 0, W, H, fill=1, stroke=0)
photo_h = 172 * mm
c.drawImage(cover_crop('portada_surtida.jpg', W, photo_h, .45), 0, H - photo_h, width=W, height=photo_h)
c.setFillColor(white); c.circle(M + 13 * mm, H - M - 13 * mm, 14.2 * mm, fill=1, stroke=0)
logo(M + .5 * mm, H - M - 25.5 * mm, 25 * mm)
txt('Maracaibo', W / 2, 74 * mm, 'Serif', 78, hueso, 'c')
txt('La carta', W / 2, 54 * mm, 'SerifItalic', 30, gris_noche, 'c')
c.setStrokeColor(HexColor('#3b3933')); c.setLineWidth(.6); c.line(W / 2 - 12 * mm, 42 * mm, W / 2 + 12 * mm, 42 * mm)
txt('Bar de pueblo en San Lorenzo, San José  ·  Cerramos a medianoche  ·  WhatsApp 6082-1465',
    W / 2, 22 * mm, 'Regular', 9.5, gris_noche, 'c', track=.2)

# ---------- Páginas interiores ----------
COL = 85 * mm; X1 = M; X2 = W - M - COL
pages = [
    ([['fuertes'], ['arroces', 'sopas']], 'impreso_fajitas.jpg', 'Fajitas de pollo', .5),
    ([['boquitas'], ['acompanamientos']], 'chicharrones_reales.jpg', 'Chicharrones', .5),
    ([['mariscos', 'compartir'], ['bebidas']], 'impreso_ceviche.jpg', 'Ceviche', .45),
]
for n, (cols, file, label, fy) in enumerate(pages, 2):
    c.showPage(); c.setFillColor(white); c.rect(0, 0, W, H, fill=1, stroke=0)
    logo(M, H - M - 9 * mm, 9 * mm)
    txt('Maracaibo', M + 12 * mm, H - M - 6.2 * mm, 'SemiBold', 13, tinta)
    txt('La carta', W - M, H - M - 6.2 * mm, 'Regular', 10, gris, 'r')
    ph_y, ph_h = 198 * mm, 70 * mm
    rounded_photo(file, M, ph_y, W - 2 * M, ph_h, 5 * mm, fy)
    lw = width(label, 'SemiBold', 10) + 8 * mm                      # etiqueta del plato sobre la foto
    c.setFillColor(white); c.roundRect(M + 5 * mm, ph_y + 5 * mm, lw, 7.5 * mm, 3.75 * mm, fill=1, stroke=0)
    txt(label, M + 9 * mm, ph_y + 7.6 * mm, 'SemiBold', 10, tinta)
    bottom = H
    for x, ids in ((X1, cols[0]), (X2, cols[1])):
        y = ph_y - 6 * mm
        for cid in ids: y = section(cid, x, y, COL)
        bottom = min(bottom, y)
        assert y > 22 * mm, (n, cid, round(y / mm, 1))
    if n == 4:                                                       # cierre: reservar por WhatsApp
        bx, bw_, bh_ = M, W - 2 * M, 46 * mm; by0 = 20 * mm
        assert bottom > by0 + bh_ + 4 * mm, 'la tarjeta de reservas tapa la carta'
        c.setFillColor(negro); c.roundRect(bx, by0, bw_, bh_, 5 * mm, fill=1, stroke=0)
        txt('Reservá tu mesa.', bx + 10 * mm, by0 + bh_ - 16 * mm, 'SemiBold', 24, white)
        txt('Escaneá el código con la cámara del celular:', bx + 10 * mm, by0 + bh_ - 26 * mm, 'Regular', 11.5, gris_claro)
        txt('el mensaje de WhatsApp queda listo para enviar.', bx + 10 * mm, by0 + bh_ - 31.5 * mm, 'Regular', 11.5, gris_claro)
        txt('WhatsApp 6082-1465', bx + 10 * mm, by0 + 8 * mm, 'SemiBold', 12, hueso)
        q = 36 * mm
        c.setFillColor(white); c.roundRect(bx + bw_ - q - 12 * mm, by0 + (bh_ - q - 4 * mm) / 2, q + 4 * mm, q + 4 * mm, 3 * mm, fill=1, stroke=0)
        qr('https://wa.me/50660821465?text=' + 'Hola%2C%20quiero%20reservar%20una%20mesa%20en%20Bar%20Maracaibo.',
           bx + bw_ - q - 10 * mm, by0 + (bh_ - q) / 2, q)
    print('Página', n, 'el contenido termina a', round(bottom / mm, 1), 'mm del borde inferior')
    txt('Bar Maracaibo · Precios en colones', M, 10 * mm, 'Regular', 8.5, gris)
    txt(f'{n} / 4', W - M, 10 * mm, 'Regular', 8.5, gris, 'r')
c.save()
print('menu-impreso.pdf generado')
