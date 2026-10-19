"""Genera la carta impresa (4 páginas A4) desde herramientas/plantilla-impreso.html, con Edge o Chrome sin ventana.
Uso, desde la carpeta del proyecto:  python herramientas/generar-impreso.py
Salidas:
  menu-impreso.pdf      4 páginas A4 (imprimir en casa, a doble cara)
  menu-imprenta.pdf     4 páginas de 216 × 303 mm: A4 + 3 mm de sangrado por lado y marcas de corte
  menu-folleto-a3.pdf   2 pliegos A3 horizontales (426 × 303 mm con sangrado) para doblar por la mitad:
                        cara exterior página 4 | página 1, cara interior página 2 | página 3
Antes de imprimir revisa que haya exactamente 4 páginas y que nada se salga del marco; si algo falla, no escribe el PDF.
Requiere: Python 3, reportlab (para el QR), Pillow (textura) y Microsoft Edge o Google Chrome instalado
(o la ruta del navegador en la variable NAVEGADOR). Lee menu-datos.js, config.js e img/."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import html, json, os, re, shutil, subprocess, sys, tempfile, threading
from urllib.parse import quote

root = Path(__file__).resolve().parent.parent
here = Path(__file__).parent
sys.stdout.reconfigure(encoding='utf-8')

def load(file, var):
    """Lee window.VAR = {...}; de un .js, ignorando las líneas de comentario //."""
    src = (root / file).read_text(encoding='utf-8')
    body = re.search(r'window\.' + var + r'\s*=\s*(.*);\s*$', src, re.S).group(1)
    return json.loads('\n'.join(l for l in body.splitlines() if not l.strip().startswith('//')))
CFG = load('config.js', 'CONFIG')

def navegador():
    if os.environ.get('NAVEGADOR'): return os.environ['NAVEGADOR']
    for p in (r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe', r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
              r'C:\Program Files\Google\Chrome\Application\chrome.exe', r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
              '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'):
        if Path(p).exists(): return p
    for n in ('msedge', 'google-chrome', 'chromium', 'chromium-browser', 'chrome'):
        if shutil.which(n): return shutil.which(n)
    raise SystemExit('No encontré Edge ni Chrome: instalá uno o poné su ruta en la variable NAVEGADOR.')

def qr_svg():
    """QR de reservas por WhatsApp (el mismo mensaje que el botón de la web)."""
    from reportlab.graphics.barcode.qr import QrCodeWidget
    from reportlab.graphics.shapes import Drawing
    from reportlab.graphics import renderSVG
    from reportlab.lib.colors import HexColor
    url = f"https://wa.me/{CFG['whatsapp']}?text=" + quote('Hola, quiero reservar una mesa en Bar Maracaibo.')
    q = QrCodeWidget(url); q.barLevel = 'M'; q.barFillColor = HexColor('#0e0f0c'); q.barBorder = 0
    b = q.getBounds(); s = 200
    d = Drawing(s, s, transform=[s / (b[2] - b[0]), 0, 0, s / (b[3] - b[1]), 0, 0]); d.add(q)
    (here / 'qr-reservas.svg').write_text(renderSVG.drawToString(d), encoding='utf-8')

def textura():
    """Baldosa de ruido para la textura de pizarra: blanco con transparencia muy baja (como el filtro SVG que había,
    pero Chrome la incrusta una vez en vez de volver imagen cada página entera)."""
    import random
    from PIL import Image
    random.seed(7); n = 300
    a = Image.new('L', (n, n)); a.putdata([int(random.random() * 18) for _ in range(n * n)])
    im = Image.new('LA', (n, n), 255); im.putalpha(a)
    im.save(here / 'textura-pizarra.png', optimize=True)

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

def main():
    exe = navegador(); qr_svg(); textura()
    srv = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(root)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{srv.server_address[1]}/herramientas/plantilla-impreso.html'
    prof = tempfile.mkdtemp(prefix='maracaibo-pdf-')
    flags = [exe, '--headless=new', '--disable-gpu', f'--user-data-dir={prof}', '--no-first-run',
             '--hide-scrollbars', '--virtual-time-budget=20000']
    salidas = (('a4', 'menu-impreso.pdf', 4, (210, 297)), ('imprenta', 'menu-imprenta.pdf', 4, (216, 303)),
               ('a3', 'menu-folleto-a3.pdf', 2, (426, 303)))
    ok = True
    try:
        for modo, out, hojas, (w, h) in salidas:
            url = f'{base}?modo={modo}'
            # 1 · validar: la plantilla deja el resultado en <html data-check="...">
            dom = subprocess.run(flags + ['--dump-dom', url], capture_output=True, text=True, encoding='utf-8', timeout=120).stdout
            m = re.search(r'<html[^>]*data-check="([^"]*)"', dom)
            if not m: print(f'{out}: la plantilla no terminó de validar'); ok = False; continue
            chk = json.loads(html.unescape(m.group(1)))
            if chk['paginas'] != 4 or chk['hojas'] != hojas or chk['problemas']:
                print(f'{out}: NO se generó. {chk["paginas"]} páginas, {chk["hojas"]} hojas (deben ser 4 y {hojas}).')
                for p in chk['problemas'][:12]: print('   ', p)
                if len(chk['problemas']) > 12: print(f"    … y {len(chk['problemas']) - 12} más")
                ok = False; continue
            # 2 · imprimir a PDF
            dest = root / out
            subprocess.run(flags + ['--no-pdf-header-footer', '--print-to-pdf-no-header', f'--print-to-pdf={dest}', url],
                           capture_output=True, timeout=180)
            # 3 · comprobar el PDF: número de hojas y tamaño
            data = dest.read_bytes()
            n = len(re.findall(rb'/Type\s*/Page\b', data))
            box = re.search(rb'/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)', data)
            mm = (round(float(box.group(1)) / 72 * 25.4), round(float(box.group(2)) / 72 * 25.4)) if box else None
            bien = n == hojas and mm == (w, h)
            ok &= bien
            print(f'{out}: {n} {"hojas" if modo == "a3" else "páginas"} de {mm[0]} × {mm[1]} mm, nada fuera del marco'
                  + ('' if bien else f'  ← ERROR: se esperaban {hojas} de {w} × {h} mm'))
    finally:
        srv.shutdown(); shutil.rmtree(prof, ignore_errors=True)
    if not ok: raise SystemExit(1)

if __name__ == '__main__':
    main()
