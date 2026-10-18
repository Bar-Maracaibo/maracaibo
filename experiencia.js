/* Bar Maracaibo · interacciones de la página principal (sin dependencias).
   Usa window.MCB (comun.js): carta, config, precios, horario y apariencia. */
(() => {
  const root = document.documentElement;
  const $ = id => document.getElementById(id);
  const { CONFIG, MENU, money, esc, reduce, wa, find, fromPrice, catFrom, say, hora12, crParts, words, totalItems } = window.MCB;
  const H = CONFIG.horario || { abre: 11, cierra: 24 };

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
  const lit = [...statement.querySelectorAll('.w')];
  const lightAll = () => lit.forEach(w => w.classList.add('on'));

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
      const on = Math.round(clamp((vh * .85 - r.top) / (r.height + vh * .25)) * lit.length);
      lit.forEach((w, i) => w.classList.toggle('on', i < on));
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
    ['inicio', 'el-bar', 'partidos', 'ronda', 'carta', 'reservar', 'llegar'].forEach(id => $(id) && io.observe($(id)));
  }

  /* ---------- Fechas (hora de Costa Rica) ---------- */
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
  const toDate = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const toIso = dt => dt.toISOString().slice(0, 10);
  const addDays = (iso, n) => { const d = toDate(iso); d.setUTCDate(d.getUTCDate() + n); return toIso(d); };
  const dayDiff = (a, b) => Math.round((toDate(b) - toDate(a)) / 864e5);
  const longDate = iso => { const d = toDate(iso); return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`; };
  const toMin = hhmm => { const [h, m] = String(hhmm || '').split(':').map(Number); return Number.isFinite(h) ? h * 60 + (m || 0) : null; };

  /* ---------- Todo lo que depende de precios o partidos espera la hoja de Google (máx. 2 s) ---------- */
  window.MCB.ready.then(() => {
    renderCartaIndex();
    renderFavs();
    initRonda();
    renderMatches();
  });

  /* ---------- La carta: título e índice con enlace directo a cada apartado ---------- */
  function renderCartaIndex() {
    if (!MENU.length) return;
    const cap = t => t[0].toUpperCase() + t.slice(1);
    $('carta-title').innerHTML = `${cap(words(MENU.length))} apartados,<br><em>${words(totalItems)} antojos.</em>`;
    $('index').innerHTML = MENU.map(cat => {
      const n = cat.items.length, min = catFrom(cat);
      return `<li><a href="menu.html#${cat.id}">
        <span class="index-name">${esc(cat.label)}</span>
        <span class="index-meta">${n} ${n === 1 ? 'opción' : 'opciones'}${min != null ? ` · desde ${money(min)}` : ''}</span>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
      </a></li>`;
    }).join('');
  }

  /* ---------- Lo que más se pide: precio y apartado desde la carta, y flechas ---------- */
  function renderFavs() {
    document.querySelectorAll('.fav[data-item]').forEach(a => {
      const it = find(a.dataset.item), meta = a.querySelector('.fav-meta');
      if (!it) { console.warn('El carrusel menciona un plato que no está en la carta:', a.dataset.item); return; }
      a.href = `menu.html#${it.cat.id}`;
      const from = fromPrice(it.it);
      if (meta) meta.innerHTML = `${esc(it.cat.label)}${from != null ? ` · <b>${it.it.sizes ? 'desde ' : ''}${money(from)}</b>` : ''}`;
    });
  }
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

  /* ---------- La ronda: total y cuánto pone cada uno ----------
     Los nombres tienen que existir en menu-datos.js (con tamaño si lo tiene: «Ceviche grande»). */
  const RONDA = [
    ['Para tomar', ['Imperial', 'Pilsen', 'Baldazo para compartir']],
    ['Para picar', ['Alitas 6 unidades', 'Chicharrones', 'Nachos mixtos', 'Ceviche grande', 'Papas a la francesa', 'Canasta de patacones']],
    ['Para compartir', ['Surtido 2 personas', 'Surtido 4 personas']]
  ];
  // Atajos: cantidades sugeridas (no son promociones del bar)
  const PRESETS = {
    dos: { split: 2, items: { 'Imperial': 4, 'Chicharrones': 1 } },
    cuatro: { split: 4, items: { 'Imperial': 8, 'Nachos mixtos': 1, 'Alitas 6 unidades': 1 } },
    partido: { split: 6, items: { 'Baldazo para compartir': 2, 'Alitas 6 unidades': 2, 'Nachos mixtos': 1, 'Surtido 4 personas': 1 } }
  };
  function initRonda() {
    const list = $('rondaList');
    if (!list || !MENU.length) return;
    const qty = {}; let split = 4;
    const minus = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7h10"/></svg>';
    const plus = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M7 2v10M2 7h10"/></svg>';
    const priced = n => { const f = find(n); return f && f.p != null; };
    list.innerHTML = RONDA.map(([group, names]) => `<p class="ronda-group">${group}</p>` + names.filter(priced).map(n => {
      qty[n] = 0;
      const f = find(n);
      const price = f.promo ? `${money(f.p)} · ${f.promo.n} por ${money(f.promo.p)}` : money(f.p);
      return `<div class="item" data-n="${esc(n)}">
        <div class="item-text"><span class="item-name">${esc(f.name)}</span><span class="item-price">${price}</span></div>
        <div class="stepper" role="group" aria-label="${esc(f.name)}">
          <button type="button" data-d="-1" aria-label="Una menos de ${esc(f.name)}" disabled>${minus}</button>
          <output class="zero">0</output>
          <button type="button" data-d="1" aria-label="Una más de ${esc(f.name)}">${plus}</button>
        </div></div>`;
    }).join('')).join('');
    RONDA.flatMap(g => g[1]).filter(n => !priced(n)).forEach(n => console.warn('La ronda menciona un plato sin precio o que no está en la carta:', n));

    const cost = n => { const f = find(n); return window.MCB.cost(f.p, qty[n], f.promo); };
    const total = () => Object.keys(qty).reduce((t, n) => t + cost(n), 0);
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
    const rows = () => [...list.querySelectorAll('.item')];
    list.addEventListener('click', e => {
      const b = e.target.closest('button[data-d]'); if (!b) return;
      const row = b.closest('.item'), n = row.dataset.n;
      qty[n] = Math.min(99, Math.max(0, qty[n] + +b.dataset.d));
      setRow(row, qty[n]); tally();
    });
    $('splitMinus').addEventListener('click', () => { split = Math.max(1, split - 1); tally(); });
    $('splitPlus').addEventListener('click', () => { split = Math.min(30, split + 1); tally(); });
    const clear = () => { Object.keys(qty).forEach(n => { qty[n] = 0; }); rows().forEach(r => setRow(r, 0)); };
    $('resetRonda').addEventListener('click', () => { clear(); tally(); list.querySelector('[data-d="1"]').focus(); });
    document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => {
      const pr = PRESETS[b.dataset.preset]; if (!pr) return;
      clear();
      Object.entries(pr.items).forEach(([n, q]) => { if (n in qty) qty[n] = q; });
      rows().forEach(r => setRow(r, qty[r.dataset.n]));
      split = pr.split; tally();
      say(`Listo: ${b.textContent.toLowerCase()}`);
    }));
    $('shareRonda').addEventListener('click', async () => {
      const lines = Object.keys(qty).filter(n => qty[n]).map(n => `• ${qty[n]} × ${find(n).name}`);
      const who = split === 1 ? '' : ` · ${money(each())} cada uno (entre ${split})`;
      const text = `¿Vamos a Maracaibo?\n\nLa ronda:\n${lines.join('\n')}\n\nTotal ${money(total())}${who}\nBar Maracaibo, San Lorenzo`;
      if (navigator.share) {
        try { await navigator.share({ text, url: CONFIG.sitio }); } catch (err) { /* cancelado */ }
      } else {
        open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + CONFIG.sitio), '_blank', 'noopener');
        say('Abriendo WhatsApp');
      }
    });
    tally();
  }

  /* ---------- Reservas: personas, día concreto, hora, nombre y partido ---------- */
  const R = { people: 2, date: null, time: null, match: null };
  const out = $('people'), bubble = $('bubble'), send = $('send'), matchBox = $('match'), seg = $('when'), hora = $('hora'), nombre = $('nombre');
  const slotsFor = iso => {
    const { date: today, min } = crParts();
    const all = []; for (let m = H.abre * 60; m <= (H.cierra - 1) * 60; m += 30) all.push(m);
    return iso === today ? all.filter(m => m >= min + 30) : all;
  };
  const days = () => {
    const today = crParts().date, list = [];
    for (let i = 0; list.length < 5 && i < 7; i++) {
      const iso = addDays(today, i);
      if (slotsFor(iso).length) list.push(iso);
    }
    if (R.date && !list.includes(R.date)) list.push(R.date);   // día de un partido más adelante
    return list;
  };
  const dayLabel = iso => { const n = dayDiff(crParts().date, iso); return n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : CORTO[toDate(iso).getUTCDay()]; };
  const dayText = iso => { const n = dayDiff(crParts().date, iso); return n === 0 ? 'hoy' : n === 1 ? 'mañana' : `el ${longDate(iso)}`; };
  const minText = m => hora12(m / 60);

  const thumb = document.createElement('span'); thumb.className = 'seg-thumb'; thumb.setAttribute('aria-hidden', 'true');
  const opts = () => [...seg.querySelectorAll('[role=radio]')];
  const place = () => {
    const b = opts().find(o => o.getAttribute('aria-checked') === 'true'); if (!b || !b.offsetWidth) return;
    thumb.style.width = b.offsetWidth + 'px'; thumb.style.height = b.offsetHeight + 'px';
    thumb.style.transform = `translate(${b.offsetLeft}px,${b.offsetTop}px)`;
  };
  function renderDays() {
    const list = days();
    if (!R.date || !list.includes(R.date)) R.date = list[0];
    seg.innerHTML = list.map(iso => `<button type="button" role="radio" aria-checked="${iso === R.date}" tabindex="${iso === R.date ? 0 : -1}" data-date="${iso}" aria-label="${dayLabel(iso)}, ${longDate(iso)}">${dayLabel(iso)}</button>`).join('');
    seg.prepend(thumb); seg.classList.add('has-thumb');
    renderTimes(); place();
  }
  function renderTimes() {
    const slots = slotsFor(R.date);
    if (R.time == null || !slots.includes(R.time)) R.time = slots.find(m => m >= 19 * 60) ?? slots[0];
    hora.innerHTML = slots.map(m => `<option value="${m}"${m === R.time ? ' selected' : ''}>${minText(m)}</option>`).join('');
  }
  const pickDay = (b, focus) => { R.date = b.dataset.date; opts().forEach(o => { const on = o === b; o.setAttribute('aria-checked', String(on)); o.tabIndex = on ? 0 : -1; }); renderTimes(); place(); compose(); if (focus) b.focus(); };
  seg.addEventListener('click', e => { const b = e.target.closest('[role=radio]'); if (b) pickDay(b); });
  seg.addEventListener('keydown', e => {
    const list = opts(), i = list.indexOf(document.activeElement); if (i < 0) return;
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (d) { e.preventDefault(); pickDay(list[(i + d + list.length) % list.length], true); }
  });
  hora.addEventListener('change', () => { R.time = +hora.value; compose(); });
  nombre.addEventListener('input', compose);
  matchBox.addEventListener('change', () => { if (!matchBox.checked) R.match = null; compose(); });

  function compose() {
    out.textContent = R.people;
    $('minus').disabled = R.people <= 1; $('plus').disabled = R.people >= 40;
    const who = R.people === 1 ? 'una persona' : `${R.people} personas`;
    const name = nombre.value.trim();
    const when = R.date ? ` ${dayText(R.date)}${R.time != null ? ` a las ${minText(R.time)}` : ''}` : '';
    const partido = matchBox.checked ? (R.match ? ` Venimos a ver ${R.match}.` : ' Venimos a ver el partido.') : '';
    const msg = `Hola${name ? `, soy ${name}` : ''}. Quiero reservar una mesa para ${who}${when} en Bar Maracaibo.${partido}`;
    bubble.textContent = msg;
    send.href = wa(msg);
  }
  $('minus').addEventListener('click', () => { R.people = Math.max(1, R.people - 1); compose(); });
  $('plus').addEventListener('click', () => { R.people = Math.min(40, R.people + 1); compose(); });
  $('reserveForm').addEventListener('submit', e => e.preventDefault());
  addEventListener('resize', place);
  document.fonts?.ready.then(place);
  if ('ResizeObserver' in window) new ResizeObserver(place).observe(seg);
  renderDays(); compose();

  /* ---------- Partidos de la semana ---------- */
  function renderMatches() {
    const sec = $('partidos'), ul = $('matchList');
    if (!sec) return;
    const { date: today, min } = crParts();
    const list = (CONFIG.partidos || [])
      .filter(p => p && p.fecha && p.equipos)
      .filter(p => { const d = dayDiff(today, p.fecha); return d >= 0 && d < 7 && !(d === 0 && toMin(p.hora) != null && toMin(p.hora) + 120 < min); })
      .sort((a, b) => (a.fecha + (a.hora || '')).localeCompare(b.fecha + (b.hora || '')));
    sec.hidden = !list.length;
    if (!list.length) return;
    ul.innerHTML = list.map((p, i) => {
      const d = toDate(p.fecha), m = toMin(p.hora);
      return `<li class="match">
        <p class="match-date" aria-hidden="true"><span>${dayLabel(p.fecha)}</span><strong>${d.getUTCDate()}</strong><span>${MESES[d.getUTCMonth()].slice(0, 3)}</span></p>
        <div class="match-info">
          <h3 class="display match-teams">${esc(p.equipos)}</h3>
          <p class="caption">${esc(longDate(p.fecha))}${m != null ? ` · ${minText(m)}` : ''}${p.torneo ? ` · ${esc(p.torneo)}` : ''}</p>
        </div>
        <button type="button" class="btn btn-line" data-match="${i}">Reservar para este partido</button>
      </li>`;
    }).join('');
    ul.addEventListener('click', e => {
      const b = e.target.closest('[data-match]'); if (!b) return;
      const p = list[+b.dataset.match], m = toMin(p.hora);
      R.date = p.fecha; R.match = p.equipos; matchBox.checked = true;
      // media hora antes del partido, dentro del horario
      if (m != null) { const want = Math.max(H.abre * 60, Math.floor((m - 30) / 30) * 30); R.time = want; }
      renderDays(); compose();
      reserve.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
      $('send').focus({ preventScroll: true });
      say(`Reserva para ${p.equipos}`);
    });
  }

  /* ---------- Mapa: se carga solo al tocar «Ver mapa» ---------- */
  const map = $('map'), mapBtn = $('mapBtn');
  mapBtn?.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.title = 'Mapa con la ubicación de Bar Maracaibo';
    f.src = map.dataset.src; f.referrerPolicy = 'no-referrer-when-downgrade'; f.allowFullscreen = true;
    map.classList.add('live'); map.append(f);
    mapBtn.remove(); map.querySelector('.map-note')?.remove();
    f.focus();
  });
})();
