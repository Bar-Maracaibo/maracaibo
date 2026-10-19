/* Bar Maracaibo · carta digital. Datos en menu-datos.js; funciones compartidas en comun.js (window.MCB). */
/* Espera la hoja de Google (máx. 2 s) para que los precios sean los últimos */
window.MCB.ready.then(() => {
  const { MENU, SECCIONES, extrasText, money, esc, normalize, reduce, catFrom, priceText, sizesText, cost, wa, say, words, totalItems } = window.MCB;
  const $ = id => document.getElementById(id);
  const count = n => `${n} ${n === 1 ? 'opción' : 'opciones'}`;
  const cap = t => t[0].toUpperCase() + t.slice(1);
  const PLUS = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M7 2v10M2 7h10"/></svg>';
  const MINUS = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7h10"/></svg>';
  if ($('conteo')) $('conteo').textContent = `${cap(words(SECCIONES.length))} apartados y ${words(totalItems)} antojos`;

  /* Resalta la coincidencia conservando las tildes del texto original */
  const highlight = (text, q) => {
    const i = q ? normalize(text).indexOf(q) : -1;
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  };

  /* ---------- Mi pedido: se guarda en este navegador ---------- */
  const KEY = 'maracaibo-pedido';
  const mesa = (new URLSearchParams(location.search).get('mesa') || '').replace(/[^\w-]/g, '').slice(0, 6);
  let order = {};
  try { order = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { order = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(order)); } catch (e) { /* sin almacenamiento: el pedido vive mientras la página esté abierta */ } };
  // clave «apartado|plato|tamaño»
  const resolve = key => {
    const [c, i, s] = String(key).split('|'); const cat = MENU.find(x => x.id === c); const it = cat && cat.items[+i];
    if (!it) return null;
    const size = s !== '' && s != null && it.sizes ? it.sizes[+s] : null;
    if (it.sizes && !size) return null;
    const p = size ? size.p : it.p;
    if (p == null) return null;
    return { key, it, name: size ? `${it.n} (${size.l.toLowerCase()})` : it.n, p, promo: it.promo || null };
  };
  const lines = () => Object.keys(order).map(k => { const r = resolve(k); return r && { ...r, q: order[k] }; }).filter(l => l && l.q > 0);
  const orderTotal = () => lines().reduce((t, l) => t + cost(l.p, l.q, l.promo), 0);
  const orderCount = () => lines().reduce((t, l) => t + l.q, 0);
  Object.keys(order).forEach(k => { if (!resolve(k) || !(order[k] > 0)) delete order[k]; });

  /* ---------- Carta completa y pestañas ---------- */
  const sections = $('sections'), track = $('tabsTrack'), search = $('search');
  const addBtn = (key, label) => `<button type="button" class="add" data-key="${key}" data-label="${esc(label)}" aria-label="Agregar ${esc(label)} a mi pedido">${PLUS}<span class="add-n"></span></button>`;
  const dish = (cat, it, i) => {
    const tags = it.tags || [];
    const badge = tags.includes('popular') ? '<span class="badge">Lo más pedido</span>' : '';
    const sizes = it.sizes ? `<div class="sizes">${it.sizes.map((s, k) => s.p == null
      ? `<span class="size">${esc(s.l)} · Consultar</span>`
      : `<button type="button" class="size add" data-key="${cat.id}|${i}|${k}" data-label="${esc(`${it.n} (${s.l.toLowerCase()})`)}" data-vis="${esc(`${s.l} ${money(s.p)}`)}"><span class="size-text">${esc(s.l)} <b>${money(s.p)}</b></span>${PLUS}<span class="add-n"></span></button>`).join('')}</div>` : '';
    // foto del plato ("img" en menu-datos.js): miniatura que abre la foto grande
    const thumb = it.img ? `<button type="button" class="thumb" data-photo="${cat.id}|${i}" aria-haspopup="dialog" aria-label="Ver foto: ${esc(it.n)}">${window.MCB.pic(it.img, '56px', '', ' width="56" height="56" loading="lazy" decoding="async"')}</button>` : '';
    return `<li class="dish${it.sizes ? ' has-sizes' : ''}${thumb ? ' has-thumb' : ''}" data-i="${i}">
      ${thumb}<span class="dish-name"><span class="dn">${esc(it.n)}</span>${badge}</span>
      ${it.sizes ? '' : `<span class="dish-price">${priceText(it.p)}</span>${it.p != null ? addBtn(`${cat.id}|${i}|`, it.n) : '<span></span>'}`}
      ${it.d ? `<small>${esc(it.d)}</small>` : ''}${sizes}</li>`;
  };
  sections.innerHTML = SECCIONES.map(cat => {
    const min = catFrom(cat);
    return `<section class="cat" id="${cat.id}" aria-labelledby="t-${cat.id}">
      <div class="frame cat-grid${cat.img ? '' : ' no-photo'}">
        ${cat.img ? `<figure class="cat-photo">${window.MCB.pic(cat.img, '(max-width: 900px) 100vw, 480px', '', ' loading="lazy" decoding="async"')}</figure>` : ''}
        <div>
          <header class="cat-head">
            <p class="kicker">${count(cat.items.length)}${min != null ? ` · desde ${money(min)}` : ''}</p>
            <h2 class="display" id="t-${cat.id}">${esc(cat.title)}</h2>
            ${cat.note ? `<p class="cat-note">${esc(cat.note)}</p>` : ''}
          </header>
          <ul class="dishes">${cat.items.map((it, i) => (it.g && it.g !== (cat.items[i - 1] || {}).g ? `<li class="dish-group">${esc(it.g)}</li>` : '') + dish(cat, it, i)).join('')}</ul>
        </div>
      </div>
    </section>`;
  }).join('');
  // Nuestras cervezas (versión compacta, sin titular) justo arriba de Bebidas; CONFIG.cervezas vacío = no aparece
  const beerList = window.MARCAS ? window.MCB.cervezas() : [], bebidas = $('bebidas');
  if (beerList.length && bebidas) bebidas.insertAdjacentHTML('beforebegin', `<section class="cervezas cervezas-compacta" id="cervezas" aria-label="Nuestras cervezas">
      <div class="marcas"><div class="marcas-view"><div class="marcas-track">${window.MCB.marcasTrack(beerList)}</div></div></div></section>`);
  const beers = $('cervezas');
  track.innerHTML = SECCIONES.map(cat => `<a class="tab" href="#${cat.id}" data-tab="${cat.id}">${esc(cat.label)}</a>`).join('');
  const tabs = [...track.querySelectorAll('.tab')];
  const cats = [...sections.querySelectorAll('.cat')];
  const extras = $('extras'), extrasTxt = extrasText();
  if (extrasTxt) extras.innerHTML = `<b>Adicionales</b> ${esc(extrasTxt)}`;

  const setActive = id => tabs.forEach(t => {
    const on = t.dataset.tab === id;
    if (on && t.getAttribute('aria-current') !== 'true') {
      t.setAttribute('aria-current', 'true');
      const r = t.getBoundingClientRect(), tr = track.getBoundingClientRect();
      if (r.left < tr.left + 20 || r.right > tr.right - 20)
        track.scrollTo({ left: t.offsetLeft - track.clientWidth / 2 + t.offsetWidth / 2, behavior: reduce.matches ? 'auto' : 'smooth' });
    } else if (!on) t.removeAttribute('aria-current');
  });

  /* La pestaña sigue al apartado que se está leyendo */
  let ticking = false;
  const spy = () => {
    ticking = false;
    const line = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 140;
    let current = null;
    for (const c of cats) { if (c.hidden) continue; if (c.getBoundingClientRect().top <= line + 40) current = c; }
    setActive(current ? current.id : (cats.find(c => !c.hidden) || {}).id);
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
  addEventListener('resize', spy);

  /* ---------- Búsqueda y filtros rápidos (se combinan) ---------- */
  const FILTERS = {
    popular: { label: 'Lo más pedido', test: it => (it.tags || []).includes('popular') },
    compartir: { label: 'Para compartir', test: it => (it.tags || []).includes('compartir') },
    mariscos: { label: 'Mariscos', test: (it, cat) => cat.id === 'mariscos' },
    bebidas: { label: 'Bebidas', test: (it, cat) => cat.id === 'bebidas' }
  };
  let filter = null;
  const chips = $('filters');
  // solo los filtros que tienen algún plato (p. ej. «Lo más pedido» aparece cuando haya platos con tags "popular")
  chips.innerHTML = Object.entries(FILTERS).filter(([, f]) => SECCIONES.some(cat => cat.items.some(it => f.test(it, cat)))).map(([k, f]) => `<button type="button" class="chip" data-filter="${k}" aria-pressed="false">${f.label}</button>`).join('');
  chips.addEventListener('click', e => {
    const b = e.target.closest('[data-filter]'); if (!b) return;
    filter = filter === b.dataset.filter ? null : b.dataset.filter;
    chips.querySelectorAll('[data-filter]').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === filter)));
    render();
  });

  function render() {
    const q = normalize(search.value), f = filter && FILTERS[filter];
    let total = 0;
    SECCIONES.forEach((cat, k) => {
      const sec = cats[k];
      const whole = q && normalize(cat.label + ' ' + cat.title).includes(q);
      let shown = 0;
      sec.querySelectorAll('.dish').forEach(li => {
        const it = cat.items[li.dataset.i];
        const text = [it.n, it.d, it.g, ...(it.sizes || []).map(s => s.l)].filter(Boolean).join(' ');
        const hit = (!q || whole || normalize(text).includes(q)) && (!f || f.test(it, cat));
        li.hidden = !hit;
        if (hit) { shown++; li.querySelector('.dn').innerHTML = highlight(it.n, whole ? '' : q); }
      });
      sec.querySelectorAll('.dish-group').forEach(g => {
        let n = g.nextElementSibling, any = false;
        while (n && !n.classList.contains('dish-group')) { if (!n.hidden) any = true; n = n.nextElementSibling; }
        g.hidden = !any;
      });
      sec.hidden = shown === 0;
      tabs[k].hidden = shown === 0;
      total += shown;
    });
    const active = q || f;
    extras.hidden = !extrasTxt || !!active;
    if (beers) beers.hidden = !bebidas || bebidas.hidden;
    $('clearSearch').hidden = !q;
    $('empty').hidden = !active || total > 0;
    const what = [q && `«${search.value.trim()}»`, f && f.label.toLowerCase()].filter(Boolean).join(' en ');
    $('status').textContent = active && total ? `${total} resultado${total === 1 ? '' : 's'} para ${what}` : '';
    spy();
  }
  search.addEventListener('input', render);
  const reset = () => { search.value = ''; filter = null; chips.querySelectorAll('[data-filter]').forEach(c => c.setAttribute('aria-pressed', 'false')); render(); search.focus(); };
  $('clearSearch').addEventListener('click', () => { search.value = ''; render(); search.focus(); });
  $('resetAll').addEventListener('click', reset);
  search.addEventListener('keydown', e => { if (e.key === 'Escape' && search.value) { e.preventDefault(); search.value = ''; render(); } });

  /* ---------- Mi pedido: botones +, barra inferior y hoja ---------- */
  const bar = $('orderBar'), dlg = $('orderSheet'), list = $('orderList'), waiter = $('waiter');
  const paintAdds = () => document.querySelectorAll('.add[data-key]').forEach(b => {
    const q = order[b.dataset.key] || 0;
    b.classList.toggle('in', q > 0);
    b.querySelector('.add-n').textContent = q || '';
    // el nombre accesible empieza con el texto visible del botón («Grande ₡3.500»)
    b.setAttribute('aria-label', `${b.dataset.vis ? b.dataset.vis + ': a' : 'A'}gregar ${b.dataset.label} a mi pedido${q ? ` (llevás ${q})` : ''}`);
  });
  const paintBar = () => {
    const n = orderCount();
    bar.hidden = n === 0;
    $('orderCount').textContent = `${n} ${n === 1 ? 'cosa' : 'cosas'}`;
    $('orderTotal').textContent = money(orderTotal());
    document.body.classList.toggle('has-order', n > 0);
  };
  const paintList = () => {
    const ls = lines();
    list.innerHTML = ls.length ? ls.map(l => `<li class="ol" data-key="${l.key}">
        <div class="ol-text"><span class="ol-name">${esc(l.name)}</span><span class="ol-price">${money(cost(l.p, l.q, l.promo))}</span></div>
        <div class="stepper" role="group" aria-label="${esc(l.name)}">
          <button type="button" data-d="-1" aria-label="${l.q === 1 ? 'Quitar' : 'Una menos de'} ${esc(l.name)}">${MINUS}</button>
          <output>${l.q}</output>
          <button type="button" data-d="1" aria-label="Una más de ${esc(l.name)}">${PLUS}</button>
        </div></li>`).join('')
      : '<li class="ol-empty">Tu pedido está vacío. Tocá + en cualquier plato para agregarlo.</li>';
    $('sheetTotal').textContent = money(orderTotal());
    $('sheetActions').hidden = !ls.length;
  };
  const paint = () => { save(); paintAdds(); paintBar(); if (dlg.open) paintList(); };
  const change = (key, d) => { order[key] = Math.max(0, Math.min(99, (order[key] || 0) + d)); if (!order[key]) delete order[key]; paint(); };

  /* ---------- Foto del plato: hoja inferior con nombre y precio ---------- */
  const photo = $('photoSheet');
  sections.addEventListener('click', e => {
    const t = e.target.closest('.thumb[data-photo]'); if (!t) return;
    const [c, i] = t.dataset.photo.split('|'), cat = MENU.find(x => x.id === c), it = cat.items[+i];
    $('photoName').textContent = it.n;
    $('photoPrice').textContent = it.sizes ? sizesText(it) : priceText(it.p);
    $('photoImg').innerHTML = window.MCB.pic(it.img, '(max-width: 560px) 100vw, 560px', it.n, ' width="1024" height="1536" decoding="async"');
    photo.showModal();
  });
  $('photoClose').addEventListener('click', () => photo.close());
  photo.addEventListener('click', e => { if (e.target === photo) photo.close(); });   // tocar fuera de la hoja la cierra; Escape la cierra solo

  sections.addEventListener('click', e => {
    const b = e.target.closest('.add[data-key]'); if (!b) return;
    change(b.dataset.key, 1);
    say(`Agregado: ${b.dataset.label}`);
  });
  list.addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) change(b.closest('.ol').dataset.key, +b.dataset.d); });

  const mesaTxt = mesa ? `Mesa ${mesa}` : '';
  $('sheetMesa').textContent = mesaTxt; $('sheetMesa').hidden = !mesa;
  const openSheet = () => { paintList(); dlg.showModal(); };
  $('orderOpen').addEventListener('click', openSheet);
  $('sheetClose').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });   // tocar fuera de la hoja la cierra
  $('orderClear').addEventListener('click', () => { order = {}; paint(); paintList(); say('Pedido vacío'); });
  $('orderWa').addEventListener('click', () => {
    const ls = lines(); if (!ls.length) return;
    const msg = `Hola, quiero pedir${mesa ? ` (Mesa ${mesa})` : ''}:\n${ls.map(l => `• ${l.q} × ${l.name} — ${money(cost(l.p, l.q, l.promo))}`).join('\n')}\nTotal ${money(orderTotal())}`;
    open(wa(msg), '_blank', 'noopener');
  });
  // Mostrar al salonero: letra grande, una línea por plato
  $('orderShow').addEventListener('click', () => {
    const ls = lines(); if (!ls.length) return;
    $('waiterMesa').textContent = mesaTxt || 'Mi pedido';
    $('waiterList').innerHTML = ls.map(l => `<li><b>${l.q}</b><span>${esc(l.name)}</span></li>`).join('');
    $('waiterTotal').textContent = `Total ${money(orderTotal())}`;
    dlg.close(); waiter.showModal();
  });
  $('waiterClose').addEventListener('click', () => { waiter.close(); openSheet(); });

  render();
  paint();
  /* Llegar desde la página principal a un apartado (menu.html#boquitas) */
  if (location.hash) { const t = document.querySelector(location.hash); if (t) requestAnimationFrame(() => { t.scrollIntoView(); spy(); }); }
});
