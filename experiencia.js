/* Bar Maracaibo · interacciones de la página principal (sin dependencias) */
(() => {
  const root = document.documentElement;
  const $ = id => document.getElementById(id);
  const { CONFIG, MENU, money, esc, reduce, wa, find, fromPrice, say } = window.MCB;

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
    ['inicio', 'el-bar', 'ronda', 'carta', 'reservar', 'llegar'].forEach(id => $(id) && io.observe($(id)));
  }

  /* ---------- La carta: índice con enlace directo a cada apartado ---------- */
  const index = $('index');
  if (MENU.length) {
    const cap = t => t[0].toUpperCase() + t.slice(1);
    $('carta-title').innerHTML = `${cap(window.MCB.words(MENU.length))} apartados,<br><em>${window.MCB.words(window.MCB.totalItems)} antojos.</em>`;
  }
  if (index && MENU.length) {
    index.innerHTML = MENU.map(cat => {
      const n = cat.items.length, min = window.MCB.catFrom(cat);
      return `<li><a href="menu.html#${cat.id}">
        <span class="index-name">${esc(cat.label)}</span>
        <span class="index-meta">${n} ${n === 1 ? 'opción' : 'opciones'}${min != null ? ` · desde ${money(min)}` : ''}</span>
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
    send.href = wa(msg);
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

  /* ---------- Lo que más se pide: precio en cada tarjeta y flechas ---------- */
  document.querySelectorAll('.fav[data-item]').forEach(a => {
    const it = find(a.dataset.item), meta = a.querySelector('.fav-meta');
    if (!it) { console.warn('El carrusel menciona un plato que no está en la carta:', a.dataset.item); return; }
    a.href = `menu.html#${it.cat.id}`;
    const from = fromPrice(it.it);
    if (meta) meta.innerHTML = `${esc(it.cat.label)}${from != null ? ` · <b>${it.it.sizes ? 'desde ' : ''}${money(from)}</b>` : ''}`;
  });
  const rail = $('rail'), prev = $('railPrev'), next = $('railNext');
  if (rail && prev && next) {
    const step = () => (rail.querySelector('li')?.offsetWidth || 300) + 20;
    const ends = () => {
      prev.disabled = rail.scrollLeft < 8;
      next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8;
    };
    const go = d => rail.scrollBy({ left: d * step(), behavior: reduce.matches ? 'auto' : 'smooth' });
    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    rail.addEventListener('scroll', ends, { passive: true });
    addEventListener('resize', ends); ends();
  }

  /* ---------- La ronda: total y cuánto pone cada uno ---------- */
  const RONDA = [
    ['Para tomar', ['Imperial', 'Pilsen', 'Baldazo para compartir']],
    ['Para picar', ['Alitas 6 unidades', 'Chicharrones', 'Nachos mixtos', 'Ceviche grande', 'Papas a la francesa', 'Canasta de patacones']],
    ['Para compartir', ['Surtido 2 personas', 'Surtido 4 personas']]
  ];
  // el precio y la promo («2 por ₡1.500») salen de la carta
  const cost = (name, q) => { const f = find(name); return window.MCB.cost(f.p, q, f.promo); };
  const list = $('rondaList');
  if (list && MENU.length) {
    const qty = {}; let split = 4;
    const minus = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7h10"/></svg>';
    const plus = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M7 2v10M2 7h10"/></svg>';
    list.innerHTML = RONDA.map(([group, names]) => `<p class="ronda-group">${group}</p>` + names.filter(n => find(n)).map(n => {
      qty[n] = 0;
      const f = find(n);
      const price = f.promo ? `${money(f.p)} · ${f.promo.n} por ${money(f.promo.p)}` : money(f.p);
      return `<div class="item" data-n="${esc(n)}">
        <div class="item-text"><span class="item-name">${esc(f.name)}</span><span class="item-price">${price}</span></div>
        <div class="stepper" role="group" aria-label="${esc(n)}">
          <button type="button" data-d="-1" aria-label="Una menos de ${esc(n)}" disabled>${minus}</button>
          <output class="zero">0</output>
          <button type="button" data-d="1" aria-label="Una más de ${esc(n)}">${plus}</button>
        </div></div>`;
    }).join('')).join('');

    const total = () => Object.keys(qty).reduce((t, n) => t + cost(n, qty[n]), 0);
    const each = () => Math.ceil(total() / split / 100) * 100;
    // el monto que cambia se asienta con un leve desenfoque (180 ms), así se nota que se actualizó
    const setNum = (el, v) => {
      if (el.textContent === v) return;
      el.textContent = v;
      if (!reduce.matches && el.animate) el.animate([{ opacity: .35, filter: 'blur(3px)', transform: 'translateY(3px)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }], { duration: 180, easing: 'cubic-bezier(.23,1,.32,1)' });
    };
    const tally = () => {
      const t = total();
      setNum($('total'), money(t));
      setNum($('each'), money(each()));
      $('split').textContent = split;
      $('splitMinus').disabled = split <= 1; $('splitPlus').disabled = split >= 30;
      $('shareRonda').disabled = $('resetRonda').disabled = t === 0;
    };
    const setRow = (row, q) => {
      const out = row.querySelector('output');
      out.textContent = q; out.classList.toggle('zero', !q);
      row.classList.toggle('on', q > 0);
      row.querySelector('[data-d="-1"]').disabled = !q;
    };
    list.addEventListener('click', e => {
      const b = e.target.closest('button[data-d]'); if (!b) return;
      const row = b.closest('.item'), n = row.dataset.n;
      qty[n] = Math.min(99, Math.max(0, qty[n] + +b.dataset.d));
      setRow(row, qty[n]); tally();
    });
    $('splitMinus').addEventListener('click', () => { split = Math.max(1, split - 1); tally(); });
    $('splitPlus').addEventListener('click', () => { split = Math.min(30, split + 1); tally(); });
    $('resetRonda').addEventListener('click', () => {
      Object.keys(qty).forEach(n => { qty[n] = 0; });
      list.querySelectorAll('.item').forEach(row => setRow(row, 0));
      tally(); list.querySelector('[data-d="1"]').focus();
    });
    $('shareRonda').addEventListener('click', async () => {
      const lines = Object.keys(qty).filter(n => qty[n]).map(n => `• ${qty[n]} × ${find(n).name}`);
      const who = split === 1 ? '' : ` · ${money(each())} cada uno (entre ${split})`;
      const text = `¿Vamos a Maracaibo?\n\nLa ronda:\n${lines.join('\n')}\n\nTotal ${money(total())}${who}\nBar Maracaibo, San Lorenzo`;
      const url = CONFIG.sitio;
      if (navigator.share) {
        try { await navigator.share({ text, url }); } catch (err) { /* cancelado */ }
      } else {
        open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + url), '_blank', 'noopener');
        say('Abriendo WhatsApp');
      }
    });
    tally();
  }

})();
