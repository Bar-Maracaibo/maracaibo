/* Bar Maracaibo · interacciones de la página principal (sin dependencias) */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const $ = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const MENU = window.MENU || [];
  const WA = 'https://wa.me/50660821465?text=';
  const money = n => '₡' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Abierto / cerrado, en hora de Costa Rica ----------
     Horario: todos los días de 11 a.m. a 12 a.m. Para cambiarlo, editar ABRE y CIERRA (horas de 0 a 24). */
  const ABRE = 11, CIERRA = 24;
  const hora12 = h => { h %= 24; return h === 0 ? '12 a.m.' : h === 12 ? '12 m.d.' : h < 12 ? `${h} a.m.` : `${h - 12} p.m.`; };
  const crNow = () => {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Costa_Rica', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    return +p.find(x => x.type === 'hour').value * 60 + +p.find(x => x.type === 'minute').value;
  };
  function updateStatus() {
    const m = crNow(), open = m >= ABRE * 60 && m < CIERRA * 60;
    const left = open ? CIERRA * 60 - m : (ABRE * 60 - m + 1440) % 1440;
    const main = open ? 'Abierto ahora' : 'Cerrado ahora';
    const detail = left <= 60
      ? (open ? `cierra en ${left} min` : `abre en ${left} min`)
      : (open ? `hasta las ${hora12(CIERRA)}` : `abre ${m < ABRE * 60 ? 'hoy' : 'mañana'} a las ${hora12(ABRE)}`);
    document.querySelectorAll('[data-status]').forEach(el => {
      el.hidden = false;
      el.classList.toggle('open', open);
      el.querySelector('[data-status-text]').innerHTML = `${main} <small>· ${detail}</small>`;
    });
  }
  updateStatus();
  setInterval(updateStatus, 30000);

  /* ---------- Entrada de la portada ---------- */
  const hero = $('inicio');
  const start = () => requestAnimationFrame(() => hero.classList.add('ready'));
  const heroImg = $('heroImg');
  if (heroImg.complete) start(); else { heroImg.addEventListener('load', start, { once: true }); setTimeout(start, 700); }

  /* ---------- Declaración: las palabras se encienden al leer ---------- */
  const statement = $('statement');
  const split = node => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const f = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(t => {
        if (!t) return;
        if (/^\s+$/.test(t)) f.append(t); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = t; f.append(s); }
      });
      n.replaceWith(f);
    } else split(n);
  });
  split(statement);
  const words = [...statement.querySelectorAll('.w')];
  const lightAll = () => words.forEach(w => w.classList.add('on'));

  /* ---------- Desplazamiento: navegación, palabras y barra inferior ---------- */
  const nav = $('nav'), dock = $('dock'), reserve = $('reservar');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  let lastY = scrollY, ticking = false;

  function frame() {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    nav.classList.toggle('scrolled', y > 8);

    if (!reduce.matches) {
      const r = statement.getBoundingClientRect();
      const lit = Math.round(clamp((vh * .85 - r.top) / (r.height + vh * .25)) * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < lit));
    }

    if (dock) {
      const pastHero = hero.getBoundingClientRect().bottom < vh * .5;
      const rr = reserve.getBoundingClientRect();
      const inReserve = rr.top < vh * .8 && rr.bottom > vh * .2;
      const nearEnd = vh + y >= root.scrollHeight - 80;
      if (!pastHero || inReserve) dock.classList.add('away');
      else if (nearEnd || y < lastY - 6) dock.classList.remove('away');
      else if (y > lastY + 8) dock.classList.add('away');
    }
    lastY = y;
  }
  const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reduce.addEventListener?.('change', () => { lightAll(); schedule(); });
  if (reduce.matches) lightAll();
  frame();

  /* ---------- Menú del celular ---------- */
  const menuBtn = $('menuBtn'), sheet = $('sheet');
  const setMenu = open => {
    sheet.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    root.style.overflow = open ? 'hidden' : '';
    nav.classList.toggle('menu-open', open);
    if (open) sheet.querySelector('a').focus();
  };
  menuBtn.addEventListener('click', () => setMenu(sheet.hidden));
  sheet.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) { setMenu(false); menuBtn.focus(); } });
  matchMedia('(min-width: 901px)').addEventListener?.('change', e => { if (e.matches) setMenu(false); });

  /* ---------- Sección activa ---------- */
  if ('IntersectionObserver' in window) {
    const links = [...document.querySelectorAll('.nav-links a')];
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.hash === '#' + e.target.id ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current'));
    }), { rootMargin: '-45% 0px -50% 0px' });
    ['inicio', 'el-bar', 'carta', 'reservar', 'llegar'].forEach(id => $(id) && io.observe($(id)));
  }

  /* ---------- La carta: índice con enlace directo a cada apartado ---------- */
  const index = $('index');
  if (index && MENU.length) {
    index.innerHTML = MENU.map(cat => {
      const n = cat.items.length, min = Math.min(...cat.items.map(x => x.p));
      return `<li><a href="menu.html#${cat.id}">
        <span class="index-name">${esc(cat.label)}</span>
        <span class="index-meta">${n} ${n === 1 ? 'opción' : 'opciones'} · desde ${money(min)}</span>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
      </a></li>`;
    }).join('');
  }

  /* ---------- Reservar: mensaje para WhatsApp ---------- */
  let people = 2, when = 'hoy';
  const out = $('people'), bubble = $('bubble'), send = $('send'), match = $('match');
  function compose() {
    out.textContent = people;
    $('minus').disabled = people <= 1; $('plus').disabled = people >= 40;
    const who = people === 1 ? 'una persona' : `${people} personas`;
    const msg = `Hola, quiero reservar una mesa para ${who} ${when} en Bar Maracaibo.${match.checked ? ' Venimos a ver el partido.' : ''}`;
    bubble.textContent = msg;
    send.href = WA + encodeURIComponent(msg);
  }
  $('minus').addEventListener('click', () => { people = Math.max(1, people - 1); compose(); });
  $('plus').addEventListener('click', () => { people = Math.min(40, people + 1); compose(); });
  match.addEventListener('change', compose);
  $('reserveForm').addEventListener('submit', e => e.preventDefault());

  /* Control segmentado con indicador deslizante */
  const seg = $('when'), opts = [...seg.querySelectorAll('[role=radio]')];
  const thumb = document.createElement('span'); thumb.className = 'seg-thumb'; thumb.setAttribute('aria-hidden', 'true');
  seg.prepend(thumb); seg.classList.add('has-thumb');
  const place = () => {
    const b = opts.find(o => o.getAttribute('aria-checked') === 'true'); if (!b || !b.offsetWidth) return;
    thumb.style.width = b.offsetWidth + 'px'; thumb.style.height = b.offsetHeight + 'px';
    thumb.style.transform = `translate(${b.offsetLeft}px,${b.offsetTop}px)`;
  };
  const pick = (b, focus) => {
    opts.forEach(o => { const on = o === b; o.setAttribute('aria-checked', String(on)); o.tabIndex = on ? 0 : -1; });
    when = b.dataset.when; place(); compose(); if (focus) b.focus();
  };
  opts.forEach((o, i) => { o.tabIndex = i === 0 ? 0 : -1; o.addEventListener('click', () => pick(o)); });
  seg.addEventListener('keydown', e => {
    const i = opts.indexOf(document.activeElement); if (i < 0) return;
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (d) { e.preventDefault(); pick(opts[(i + d + opts.length) % opts.length], true); }
  });
  addEventListener('resize', place);
  document.fonts?.ready.then(place);
  if ('ResizeObserver' in window) new ResizeObserver(place).observe(seg);
  place(); compose();

  /* ---------- Copiar número ---------- */
  const toast = $('toast'); let tt;
  const say = t => { toast.textContent = t; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2600); };
  $('copy')?.addEventListener('click', e => {
    const v = e.currentTarget.dataset.copy, fallback = () => say('Número: 6082-1465');
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(v).then(() => say('Número copiado'), fallback); else fallback();
  });
})();
