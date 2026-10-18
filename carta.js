/* Bar Maracaibo · carta digital. Datos en menu-datos.js (fuente única compartida con la página principal y el PDF). */
(() => {
  const { MENU, money, esc, normalize, reduce, catFrom, priceText, sizesText } = window.MCB;
  const $ = id => document.getElementById(id);
  const count = n => `${n} ${n === 1 ? 'opción' : 'opciones'}`;

  /* Resalta la coincidencia conservando las tildes del texto original */
  const highlight = (text, q) => {
    const i = q ? normalize(text).indexOf(q) : -1;
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  };

  const cap = t => t[0].toUpperCase() + t.slice(1);
  if ($('conteo')) $('conteo').textContent = `${cap(window.MCB.words(MENU.length))} apartados y ${window.MCB.words(window.MCB.totalItems)} antojos`;

  /* ---------- Carta completa y pestañas ---------- */
  const sections = $('sections'), track = $('tabsTrack'), search = $('search');
  sections.innerHTML = MENU.map(cat => {
    const min = catFrom(cat);
    return `<section class="cat" id="${cat.id}" aria-labelledby="t-${cat.id}">
      <div class="frame cat-grid">
        ${cat.img ? `<figure class="cat-photo"><img src="${cat.img}" alt="" loading="lazy"></figure>` : '<div class="cat-photo cat-nophoto" aria-hidden="true"></div>'}
        <div>
          <header class="cat-head">
            <p class="kicker">${count(cat.items.length)}${min != null ? ` · desde ${money(min)}` : ''}</p>
            <h2 class="display" id="t-${cat.id}">${esc(cat.title)}</h2>
            ${cat.note ? `<p class="cat-note">${esc(cat.note)}</p>` : ''}
          </header>
          <ul class="dishes">${cat.items.map((it, i) => (it.g && it.g !== (cat.items[i - 1] || {}).g ? `<li class="dish-group" data-g="${esc(it.g)}">${esc(it.g)}</li>` : '') + `<li class="dish" data-i="${i}"><span class="dish-name">${esc(it.n)}</span>${it.sizes ? '' : `<span class="dish-price">${priceText(it.p)}</span>`}${it.d ? `<small>${esc(it.d)}</small>` : ''}${it.sizes ? `<span class="dish-sizes">${sizesText(it)}</span>` : ''}</li>`).join('')}</ul>
        </div>
      </div>
    </section>`;
  }).join('');
  track.innerHTML = MENU.map(cat => `<a class="tab" href="#${cat.id}" data-tab="${cat.id}">${esc(cat.label)}</a>`).join('');
  const tabs = [...track.querySelectorAll('.tab')];
  const cats = [...sections.querySelectorAll('.cat')];

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

  /* ---------- Búsqueda ---------- */
  function render() {
    const q = normalize(search.value);
    let total = 0;
    MENU.forEach((cat, k) => {
      const sec = cats[k];
      const whole = q && normalize(cat.label + ' ' + cat.title).includes(q);
      let shown = 0;
      sec.querySelectorAll('.dish').forEach(li => {
        const it = cat.items[li.dataset.i];
        const hit = !q || whole || normalize(it.n + ' ' + (it.d || '')).includes(q);
        li.hidden = !hit;
        if (hit) { shown++; li.querySelector('.dish-name').innerHTML = highlight(it.n, whole ? '' : q); }
      });
      sec.hidden = shown === 0;
      tabs[k].hidden = shown === 0;
      total += q ? shown : 0;
    });
    $('clearSearch').hidden = !q;
    $('empty').hidden = !q || total > 0;
    $('status').textContent = q && total ? `${total} resultado${total === 1 ? '' : 's'} para «${search.value.trim()}»` : '';
    spy();
  }
  search.addEventListener('input', render);
  const reset = () => { search.value = ''; render(); search.focus(); };
  $('clearSearch').addEventListener('click', reset);
  $('resetAll').addEventListener('click', reset);
  search.addEventListener('keydown', e => { if (e.key === 'Escape' && search.value) { e.preventDefault(); reset(); } });

  render();
  /* Llegar desde la página principal a un apartado (menu.html#boquitas) */
  if (location.hash) { const t = document.querySelector(location.hash); if (t) requestAnimationFrame(() => { t.scrollIntoView(); spy(); }); }
})();
