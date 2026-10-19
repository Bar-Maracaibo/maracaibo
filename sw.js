/* Bar Maracaibo · service worker: la carta funciona sin señal.
   - Páginas (HTML): primero la red (siempre lo último) y, sin señal, la copia guardada.
   - CSS, JS, fuentes e imágenes: stale-while-revalidate (sale al instante de la copia y se actualiza por detrás).
   - Sin señal, si falta una foto grande, se usa su versión de 480 px.
   Al publicar cambios grandes, subir VERSION para que los celulares descarten la copia vieja. */
const VERSION = 'maracaibo-v3';
self.window = self;                       // img/imagenes.js escribe en window.IMAGENES
importScripts('img/imagenes.js');

const BASE = ['./', 'index.html', 'menu.html', 'tokens.css', 'experiencia.css', 'carta.css',
  'config.js', 'menu-datos.js', 'comun.js', 'experiencia.js', 'carta.js', 'img/imagenes.js',
  'fuentes/instrument-serif-latin.woff2', 'fuentes/instrument-serif-latin-ext.woff2',
  'fuentes/instrument-serif-italic-latin.woff2', 'fuentes/instrument-serif-italic-latin-ext.woff2',
  'logo-mono.png', 'favicon.png', 'icono-192.png', 'manifest.webmanifest'];
// la versión más chica de cada foto, en AVIF y WebP (el navegador usa la que soporte); incluye las fotos de platos
// ("img" en menu-datos.js, p. ej. tacos): la miniatura de la carta usa esa misma versión
const FOTOS = Object.entries(self.IMAGENES || {}).flatMap(([stem, m]) =>
  [m.avif && `img/${stem}-${m.w[0]}.avif`, `img/${stem}-${m.w[0]}.webp`].filter(Boolean))
  // la portada (el rótulo) y la foto del bar lleno también en el tamaño que bajan los celulares
  .concat(['portada-rotulo', 'bar-ambiente-ancho'].flatMap(stem => {
    const m = (self.IMAGENES || {})[stem]; const w = m && m.w[Math.min(1, m.w.length - 1)];
    return m ? [m.avif && `img/${stem}-${w}.avif`, `img/${stem}-${w}.webp`].filter(Boolean) : [];
  }));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE).then(() => Promise.allSettled(FOTOS.map(f => c.add(f))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const smallest = url => {
  const m = url.pathname.match(/img\/([\w-]+?)-\d+\.(avif|webp|jpg)$/);
  const info = m && (self.IMAGENES || {})[m[1]];
  return info ? new URL(`img/${m[1]}-${info.w[0]}.${m[2] === 'jpg' ? 'webp' : m[2]}`, self.registration.scope).href : null;
};

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;   // WhatsApp, Google Maps, hoja de Google: siempre en línea
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req);
    const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    try { return await net; } catch (err) {
      const alt = smallest(url);
      const r = alt && await c.match(alt);
      if (r) return r;
      throw err;
    }
  }));
});
