/* Bar Maracaibo · funciones compartidas por index.html y menu.html (sin dependencias).
   Lee window.CONFIG (config.js) y window.MENU (menu-datos.js) y expone window.MCB. */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const CONFIG = window.CONFIG || {};
  const MENU = window.MENU || [];
  // «Adicionales» no es un apartado con foto: va como nota al final de la carta
  const EXTRA = 'adicionales';
  const SECCIONES = MENU.filter(c => c.id !== EXTRA);
  const ADICIONALES = MENU.find(c => c.id === EXTRA) || null;
  const H = CONFIG.horario || { abre: 11, cierra: 24 };

  const money = n => '₡' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const normalize = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Horas ---------- */
  // 11 → «11 a.m.», 24 → «12 a.m.», 19.5 → «7:30 p.m.»
  const hora12 = h => {
    const m = Math.round((h % 1) * 60); h = Math.floor(h) % 24;
    const t = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const suf = h === 12 && !m ? 'm.d.' : h < 12 ? 'a.m.' : 'p.m.';
    return `${t}${m ? ':' + String(m).padStart(2, '0') : ''} ${suf}`;
  };
  const horarioTexto = `Todos los días, ${hora12(H.abre)} – ${hora12(H.cierra)}`;
  // Fecha y minutos actuales en Costa Rica
  const crParts = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Costa_Rica', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).map(x => [x.type, x.value]));
    return { date: `${p.year}-${p.month}-${p.day}`, min: +p.hour * 60 + +p.minute };
  };

  /* ---------- Precios ---------- */
  // p: null = precio por confirmar → «Consultar»
  const priceList = it => (it.sizes ? it.sizes.map(s => s.p) : [it.p]).filter(p => p != null);
  const fromPrice = it => { const l = priceList(it); return l.length ? Math.min(...l) : null; };
  const catFrom = cat => { const l = cat.items.map(fromPrice).filter(p => p != null); return l.length ? Math.min(...l) : null; };
  const priceText = p => p == null ? 'Consultar' : money(p);
  const sizesText = it => it.sizes.map(s => `${s.l} ${priceText(s.p)}`).join(' · ');
  // «Adicional para cualquier plato ₡500 · Adicional de guacamole ₡1.000»
  const extrasText = () => ADICIONALES ? ADICIONALES.items.map(it => `${it.n}${it.d ? ' ' + it.d[0].toLowerCase() + it.d.slice(1) : ''} ${priceText(it.p)}`).join(' · ') : '';
  // Costo de q unidades de un precio, aplicando la promo («2 por ₡1.500»)
  const cost = (p, q, promo) => promo ? Math.floor(q / promo.n) * promo.p + (q % promo.n) * p : p * q;
  // Busca por nombre, con o sin un tamaño concreto: «Ceviche (grande)», «Alitas (6 unid.)» o «Ceviche grande»
  const key = s => normalize(s).replace(/[().]/g, ' ').replace(/\s+/g, ' ').trim();
  const index = {};
  SECCIONES.forEach(cat => cat.items.forEach(it => {
    index[key(it.n)] = { it, cat, size: null };
    (it.sizes || []).forEach(s => { index[key(`${it.n} ${s.l}`)] = { it, cat, size: s }; });
  }));
  const find = name => {
    const r = index[key(name)]; if (!r) return null;
    return { ...r, name: r.size ? `${r.it.n} (${r.size.l.toLowerCase()})` : r.it.n, p: r.size ? r.size.p : r.it.p, promo: r.it.promo || null };
  };

  /* ---------- Números en palabras (1 a 99), para «ocho apartados» ---------- */
  const U = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
    'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
  const D = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  // delante de un sustantivo masculino: «veintiún antojos», «treinta y un antojos»
  const words = n => (n < 30 ? U[n] : D[Math.floor(n / 10)] + (n % 10 ? ' y ' + U[n % 10] : '')).replace(/uno$/, 'un').replace(/veintiun$/, 'veintiún');
  const totalItems = SECCIONES.reduce((t, c) => t + c.items.length, 0);

  /* ---------- Datos de config en la página ----------
     data-cfg="telefono|horario|direccion|notaPrecios|codigoUbicacion" pone el texto;
     data-wa="mensaje" arma el enlace de WhatsApp; data-tel el de llamada; data-cfg-href="facebook" etc.
     Los elementos con data-cfg-href se ocultan si ese dato está vacío. */
  const wa = (text = '') => `https://wa.me/${CONFIG.whatsapp}${text ? '?text=' + encodeURIComponent(text) : ''}`;
  const fill = (scope = document) => {
    const txt = { facebookNombre: CONFIG.facebook && CONFIG.facebookNombre, telefono: CONFIG.telefono, horario: horarioTexto, direccion: CONFIG.direccion, notaPrecios: CONFIG.notaPrecios, codigoUbicacion: CONFIG.codigoUbicacion };
    scope.querySelectorAll('[data-cfg]').forEach(el => { const v = txt[el.dataset.cfg]; if (v) el.textContent = v; else el.hidden = true; });
    scope.querySelectorAll('[data-wa]').forEach(el => { el.href = wa(el.dataset.wa); });
    scope.querySelectorAll('[data-tel]').forEach(el => { el.href = 'tel:+' + CONFIG.whatsapp; });
    scope.querySelectorAll('[data-cfg-href]').forEach(el => { const v = CONFIG[el.dataset.cfgHref]; if (v) el.href = v; else el.remove(); });
    const g = CONFIG.googleRating;
    scope.querySelectorAll('[data-rating]').forEach(el => {
      if (!g || !g.valor) { el.remove(); return; }
      el.hidden = false;
      el.innerHTML = `<span aria-hidden="true">★</span> ${String(g.valor).replace('.', ',')} en Google${g.resenas ? ` <small>· ${g.resenas} reseñas</small>` : ''}`;
      if (el.tagName === 'A' && g.url) el.href = g.url;
    });
  };

  /* ---------- Abierto / cerrado, en hora de Costa Rica ---------- */
  const updateStatus = () => {
    const { min: m } = crParts(), A = H.abre * 60, C = H.cierra * 60;
    const open = m >= A && m < C;
    const left = open ? C - m : (A - m + 1440) % 1440;
    const main = open ? 'Abierto ahora' : 'Cerrado ahora';
    const detail = left <= 60
      ? (open ? `cierra en ${left} min` : `abre en ${left} min`)
      : (open ? `hasta las ${hora12(H.cierra)}` : `abre ${m < A ? 'hoy' : 'mañana'} a las ${hora12(H.abre)}`);
    document.querySelectorAll('[data-status]').forEach(el => {
      el.hidden = false;
      el.classList.toggle('open', open);
      el.querySelector('[data-status-text]').innerHTML = `${main} <small>· ${detail}</small>`;
    });
  };

  /* ---------- Apariencia: automática, clara u oscura ----------
     El bombillo (#bulb) cambia entre clara y oscura; #look (pie de la portada) permite volver a «Automática». */
  const KEY = 'maracaibo-apariencia';
  const sysDark = matchMedia('(prefers-color-scheme: dark)');
  const current = () => root.dataset.theme || (sysDark.matches ? 'dark' : 'light');
  const initTheme = () => {
    const metas = [...document.querySelectorAll('meta[name="theme-color"]')];
    const base = metas.map(m => m.content);
    const bulb = document.getElementById('bulb'), look = document.getElementById('look');
    const looks = look ? [...look.querySelectorAll('[role=radio]')] : [];
    const paint = () => {
      if (!bulb) return;
      const lit = current() === 'light';
      bulb.classList.toggle('on', lit);
      bulb.setAttribute('aria-label', lit ? 'Apagar la luz: cambiar a apariencia oscura' : 'Encender la luz: cambiar a apariencia clara');
      bulb.title = lit ? 'Apariencia oscura' : 'Apariencia clara';
    };
    const apply = (v, save) => {
      if (v === 'auto') delete root.dataset.theme; else root.dataset.theme = v;
      metas.forEach((m, i) => { m.content = v === 'auto' ? base[i] : (v === 'dark' ? '#0c0d0a' : '#f3f1e9'); });
      looks.forEach(o => { const on = o.dataset.look === v; o.setAttribute('aria-checked', String(on)); o.tabIndex = on ? 0 : -1; });
      paint();
      if (save) { try { v === 'auto' ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, v); } catch (e) { /* sin almacenamiento */ } }
    };
    apply(root.dataset.theme || 'auto', false);
    sysDark.addEventListener?.('change', paint);
    bulb?.addEventListener('click', () => apply(current() === 'light' ? 'dark' : 'light', true));
    looks.forEach(o => o.addEventListener('click', () => apply(o.dataset.look, true)));
    look?.addEventListener('keydown', e => {
      const i = looks.indexOf(document.activeElement); if (i < 0) return;
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (d) { e.preventDefault(); const o = looks[(i + d + looks.length) % looks.length]; apply(o.dataset.look, true); o.focus(); }
    });
  };

  /* ---------- Aviso breve ---------- */
  let tt;
  const say = t => {
    const toast = document.getElementById('toast'); if (!toast) return;
    toast.textContent = t; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2600);
  };

  /* ---------- Hoja de Google (CMS liviano) ----------
     CONFIG.sheetUrl = el enlace normal de la hoja (compartida como «cualquier persona con el enlace»).
     Pestaña «carta»: plato | tamaño | precio   → actualiza precios de platos que ya existen.
     Pestaña «partidos»: fecha (AAAA-MM-DD) | hora (HH:MM) | equipos | torneo.
     Si falla o tarda más de 2 s se usan menu-datos.js y config.js. */
  const parseCSV = text => {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    const head = (rows.shift() || []).map(h => normalize(h));
    return rows.filter(r => r.some(x => x.trim())).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])));
  };
  const sheetCsv = (url, tab) => {
    const id = (url.match(/\/spreadsheets\/d\/([\w-]{20,})/) || [])[1];
    return id ? `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}` : null;
  };
  const applySheet = ({ carta, partidos }) => {
    (carta || []).forEach(r => {
      const p = parseInt(String(r.precio).replace(/[^\d]/g, ''), 10);
      const f = find(`${r.plato} ${r.tamano || ''}`) || find(r.plato);
      if (!f || !Number.isFinite(p)) return;
      if (f.size) f.size.p = p; else f.it.p = p;
    });
    const ps = (partidos || []).filter(r => /^\d{4}-\d{2}-\d{2}$/.test(r.fecha) && r.equipos)
      .map(r => ({ fecha: r.fecha, hora: r.hora, equipos: r.equipos, torneo: r.torneo }));
    if (ps.length) CONFIG.partidos = ps;
  };
  const ready = (() => {
    const url = CONFIG.sheetUrl;
    if (!url || !window.fetch) return Promise.resolve(false);
    const get = tab => { const u = sheetCsv(url, tab); return u ? fetch(u).then(r => r.ok ? r.text() : Promise.reject(r.status)).then(parseCSV) : Promise.reject('enlace'); };
    const load = Promise.allSettled([get('carta'), get('partidos')]).then(([c, m]) => {
      applySheet({ carta: c.value, partidos: m.value });
      return c.status === 'fulfilled' || m.status === 'fulfilled';
    });
    const timeout = new Promise(r => setTimeout(() => r(false), 2000));
    return Promise.race([load, timeout]).catch(() => false);
  })();

  /* ---------- Fotos optimizadas: <picture> con AVIF, WebP y JPG (img/, ver herramientas/optimizar-imagenes.py) ---------- */
  const pic = (file, sizes, alt = '', extra = '') => {
    const stem = String(file).replace(/\.jpg$/, ''), m = (window.IMAGENES || {})[stem];
    if (!m) return `<img src="${esc(file)}" alt="${esc(alt)}"${extra}>`;
    const set = ext => m.w.map(w => `img/${stem}-${w}.${ext} ${w}w`).join(', ');
    const fb = `img/${stem}-${m.w[Math.min(1, m.w.length - 1)]}.jpg`;
    return `<picture>${m.avif ? `<source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">` : ''}<source type="image/webp" srcset="${set('webp')}" sizes="${sizes}"><img src="${fb}" srcset="${set('jpg')}" sizes="${sizes}" alt="${esc(alt)}"${extra}></picture>`;
  };

  window.MCB = { pic, ready, parseCSV, CONFIG, MENU, SECCIONES, ADICIONALES, extrasText, words, totalItems, money, priceText, catFrom, esc, normalize, reduce, hora12, horarioTexto, crParts, priceList, fromPrice, sizesText, cost, find, wa, fill, updateStatus, initTheme, say };

  /* ---------- Sin señal: service worker (sw.js) ---------- */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)))
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

  fill();
  initTheme();
  updateStatus();
  setInterval(updateStatus, 30000);
})();
