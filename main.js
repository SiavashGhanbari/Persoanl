(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const Z = window.ZARPIN;

  /* Theme */
  /* The chosen theme is stored and carried on internal links, so it never flips between pages */
  const root = document.documentElement;
  const internal = $$('a[href]').filter(a => { const h = a.getAttribute('href'); return /^(\.\/|[a-z0-9-]+\.html)/i.test(h); });
  const syncLinks = () => internal.forEach(a => {
    const u = new URL(a.getAttribute('href'), location.href); u.searchParams.set('theme', root.dataset.theme);
    a.href = u.href;
  });
  const setTheme = (t) => {
    root.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) {}
    try { const u = new URL(location.href); u.searchParams.set('theme', t); history.replaceState(null, '', u); } catch (e) {}
    syncLinks();
  };
  setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
  $$('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark')));

  /* Year + Tehran clock */
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  const clock = $('[data-clock]');
  const tick = () => { if (clock) clock.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' }).format(new Date()); };
  tick(); setInterval(tick, 30000);

  /* Nav border on scroll + reading progress */
  const nav = $('.nav'); const bar = $('.progress');
  const onScroll = () => {
    nav?.classList.toggle('scrolled', scrollY > 8);
    if (bar) { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`; }
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* Reveal on scroll (staggered) */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const sibs = [...e.target.parentElement.children].filter(c => c.classList.contains('reveal'));
      e.target.style.transitionDelay = `${Math.min(sibs.indexOf(e.target), 4) * 60}ms`;
      e.target.classList.add('in'); io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* Cursor pill on cards / links */
  const pill = $('.cursor-pill');
  if (pill && matchMedia('(hover: hover)').matches) {
    let x = 0, y = 0, px = 0, py = 0;
    addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    const loop = () => { px += (x - px) * (reduce ? 1 : 0.2); py += (y - py) * (reduce ? 1 : 0.2); pill.style.left = px + 'px'; pill.style.top = py + 'px'; requestAnimationFrame(loop); };
    loop();
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => { pill.textContent = el.dataset.cursor; pill.classList.add('on'); });
      el.addEventListener('mouseleave', () => pill.classList.remove('on'));
    });
  }

  /* Dock magnification */
  const dock = $('.dock');
  if (dock && !reduce && matchMedia('(hover: hover)').matches) {
    const items = $$('.dock-item', dock);
    dock.addEventListener('mousemove', (e) => {
      items.forEach(it => {
        const r = it.getBoundingClientRect(); const d = Math.abs(e.clientX - (r.left + r.width / 2));
        it.style.setProperty('--s', (1 + 0.45 * Math.max(0, 1 - d / 110)).toFixed(3));
      });
    });
    dock.addEventListener('mouseleave', () => items.forEach(it => it.style.setProperty('--s', 1)));
  }

  /* Folder card shapes (tab + smooth notch), sized to each card */
  const frontPath = (w, h) => {
    const r = Math.min(22, w * .05), t = 30, tw = Math.max(120, w * .4), s = 40;
    return `M0 ${r} Q0 0 ${r} 0 L${tw - 6} 0 C${tw + s * .5} 0 ${tw + s * .5} ${t} ${tw + s} ${t} L${w - r} ${t} Q${w} ${t} ${w} ${t + r} L${w} ${h - r} Q${w} ${h} ${w - r} ${h} L${r} ${h} Q0 ${h} 0 ${h - r} Z`;
  };
  const backPath = (w, h) => {
    const r = Math.min(22, w * .05), t = 22, tw = Math.max(110, w * .34), s = 36, x = w - tw;
    return `M0 ${t + r} Q0 ${t} ${r} ${t} L${x - s} ${t} C${x - s * .5} ${t} ${x - s * .5} 0 ${x + 6} 0 L${w - r} 0 Q${w} 0 ${w} ${r} L${w} ${h} L0 ${h} Z`;
  };
  const shapeFolders = () => {
    $$('[data-folder-front]').forEach(el => {
      const w = el.offsetWidth, h = el.offsetHeight, d = frontPath(w, h);
      el.style.clipPath = `path('${d}')`;
      let svg = el.querySelector('.edge');
      if (!svg) { el.insertAdjacentHTML('afterbegin', '<svg class="edge" aria-hidden="true"><path/></svg>'); svg = el.querySelector('.edge'); }
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`); svg.querySelector('path').setAttribute('d', d);
    });
    $$('[data-folder-back]').forEach(el => { el.style.borderRadius = '0'; el.style.clipPath = `path('${backPath(el.offsetWidth, el.offsetHeight)}')`; });
  };
  shapeFolders();
  let rs; addEventListener('resize', () => { cancelAnimationFrame(rs); rs = requestAnimationFrame(shapeFolders); });
  /* On touch screens, open the folder while it is fully in view */
  if (matchMedia('(hover: none)').matches) {
    const pio = new IntersectionObserver(es => es.forEach(e => { e.target.classList.toggle('peek', e.isIntersecting && e.intersectionRatio > .7); }), { threshold: [0, .7, 1] });
    $$('.folder-card:not(.soon)').forEach(el => pio.observe(el));
  }

  /* Metrics */
  const fmt = {
    successLift: () => `+${Z.liftPts.toFixed(0)} pts`,
    successBefore: () => `${(Z.successBefore * 100).toFixed(0)}%`,
    successAfter: () => `${(Z.successAfter * 100).toFixed(0)}%`,
    liftRel: () => `+${Z.liftRel.toFixed(0)}%`,
    paidNotBoughtBefore: () => `${Z.paidNotBoughtBefore.toFixed(0)}%`,
    paidNotBoughtAfter: () => `${Z.paidNotBoughtAfter.toFixed(1)}%`,
  };
  $$('[data-metric]').forEach(el => { const f = fmt[el.dataset.metric]; if (f) el.textContent = f(); });
  if (Z && !Z.placeholder) $$('[data-placeholder-note]').forEach(el => el.remove());

  /* Count-up for KPI blocks */
  const countUp = (el) => {
    const final = el.textContent; const m = final.match(/^([+]?)([\d.]+)(.*)$/);
    if (!m || reduce) return;
    const target = parseFloat(m[2]); const dec = (m[2].split('.')[1] || '').length; const t0 = performance.now();
    const step = (t) => { const p = Math.min((t - t0) / 1100, 1); const v = target * (1 - Math.pow(1 - p, 3)); el.textContent = m[1] + v.toFixed(dec) + m[3]; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const kio = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { countUp(e.target); kio.unobserve(e.target); } }), { threshold: 0.6 });
  $$('.kpi b').forEach(el => kio.observe(el));

  /* Segmented toggles */
  const setupSeg = (seg, onChange) => {
    const btns = $$('button', seg); const thumb = $('.thumb', seg);
    const place = (b) => { thumb.style.width = b.offsetWidth + 'px'; thumb.style.transform = `translateX(${b.offsetLeft - 4}px)`; };
    btns.forEach(b => b.addEventListener('click', () => { btns.forEach(x => x.setAttribute('aria-pressed', x === b)); place(b); onChange(b.dataset.value); }));
    const cur = btns.find(b => b.getAttribute('aria-pressed') === 'true') || btns[0];
    requestAnimationFrame(() => place(cur)); addEventListener('resize', () => place(btns.find(b => b.getAttribute('aria-pressed') === 'true')));
  };

  /* Flow diagram */
  const FLOWS = {
    before: [
      { t: 'Buy gold', d: 'User enters an amount.', icon: 'coin' },
      { t: 'Full-page pre-invoice', d: 'Looked like a final receipt.', icon: 'doc', drop: 'Drop-off 1: “Am I done?”' },
      { t: 'Payment gateway', d: 'Bank payment.', icon: 'card' },
      { t: '“Deposit successful”', d: 'Rial lands in wallet. A “Complete purchase” button waits.', icon: 'tap', drop: 'Drop-off 2: users leave here' },
      { t: 'Gold purchased', d: 'Only if the user tapped again.', icon: 'check' },
    ],
    after: [
      { t: 'Buy gold', d: 'User enters an amount.', icon: 'coin' },
      { t: 'Pre-invoice bottom sheet', d: 'Clearly labelled “not final”. Reusable in every buy flow.', icon: 'sheet', fixed: 'Clear next step' },
      { t: 'Payment gateway', d: 'Bank payment.', icon: 'card' },
      { t: 'Success: “Buying your gold…”', d: 'Purchase runs automatically. No extra tap.', icon: 'check', fixed: 'No manual step' },
    ],
  };
  const ICONS = {
    coin: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>',
    doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
    sheet: '<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M5 13h14M10 16h4"/>',
    card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>',
    tap: '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0 0V8.5a1.5 1.5 0 0 1 3 0V11m0 0a1.5 1.5 0 0 1 3 0v3a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-2.5-3.5a1.5 1.5 0 0 1 2.3-1.9L9 14"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    shield: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
    bank: '<path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    hourglass: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9"/>',
  };
  const flowEl = $('[data-flow]');
  const renderFlow = (key) => {
    if (!flowEl) return;
    flowEl.innerHTML = (window.PAGE_FLOWS || FLOWS)[key].map(s => `
      <li class="step ${s.drop ? 'drop' : ''} ${s.fixed ? 'fixed' : ''} gone">
        <span class="node" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[s.icon]}</svg></span>
        <div><h4>${s.t}</h4><p>${s.d}</p>${s.drop ? `<span class="flag">● ${s.drop}</span>` : ''}${s.fixed ? `<span class="flag">✓ ${s.fixed}</span>` : ''}</div>
      </li>`).join('');
    $$('.step', flowEl).forEach((s, i) => setTimeout(() => s.classList.remove('gone'), reduce ? 0 : 60 * i + 20));
  };
  const flowSeg = $('[data-seg="flow"]');
  if (flowSeg) { setupSeg(flowSeg, renderFlow); renderFlow('before'); }

  /* Funnel */
  const funnelEl = $('[data-funnel]');
  if (funnelEl && Z) {
    funnelEl.innerHTML = Z.steps.map((s, i) => {
      const b = Z.before[i] / Z.before[0], a = Z.after[i] / Z.after[0];
      return `<div class="frow"><span class="label">${s}</span>
        <div><div class="bar" style="margin-bottom:6px" role="img" aria-label="Before: ${(b*100).toFixed(0)}%"><i class="before" data-w="${b}"></i></div>
        <div class="bar" role="img" aria-label="After: ${(a*100).toFixed(0)}%"><i class="after" data-w="${a}"></i></div></div>
        <span class="val"><span style="color:var(--muted);font-weight:500">${(b*100).toFixed(0)}</span><br>${(a*100).toFixed(0)}%</span></div>`;
    }).join('');
    const fio = new IntersectionObserver((es) => es.forEach(e => {
      if (!e.isIntersecting) return;
      $$('.bar i', funnelEl).forEach((el, i) => setTimeout(() => el.style.transform = `scaleX(${el.dataset.w})`, reduce ? 0 : i * 70));
      fio.disconnect();
    }), { threshold: 0.3 });
    fio.observe(funnelEl);
  }

  /* Interactive prototype */
  const phone = $('[data-proto]');
  if (phone) {
    let mode = 'after'; let timers = [];
    const views = $$('.view', phone); const sheet = $('.sheet', phone); const scrim = $('.scrim', phone);
    const hint = $('[data-proto-hint]');
    const show = (name) => { views.forEach(v => v.classList.toggle('hidden', v.dataset.view !== name)); };
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const later = (fn, ms) => timers.push(setTimeout(fn, reduce ? Math.min(ms, 300) : ms));
    const closeSheet = () => { sheet.classList.remove('on'); scrim.classList.remove('on'); };
    const reset = () => {
      clear(); closeSheet(); show('buy');
      $$('.buying .ln', phone).forEach(l => l.classList.remove('done'));
      hint.textContent = mode === 'after' ? 'Tap “Buy gold” to try the new flow.' : 'Tap “Buy gold” to try the old flow.';
    };
    const gateway = (next) => { closeSheet(); show('gateway'); later(next, 1400); };

    phone.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act; if (!act) return;
      if (act === 'buy') {
        if (mode === 'after') { sheet.classList.add('on'); scrim.classList.add('on'); hint.textContent = 'The pre-invoice is now a sheet, labelled “not final”.'; }
        else { show('invoice'); hint.textContent = 'Old: a full-page invoice that looked like a receipt.'; }
      }
      if (act === 'close') closeSheet();
      if (act === 'pay-new') gateway(() => {
        show('success-new'); hint.textContent = 'Paid. Gold is bought automatically, and the user sees it happening.';
        $$('.buying .ln', phone).forEach((l, i) => later(() => l.classList.add('done'), 500 + i * 700));
      });
      if (act === 'pay-old') gateway(() => { show('deposit-old'); hint.textContent = 'Old: money arrived, but no gold yet. Many users left here.'; });
      if (act === 'complete-old') { show('done-old'); hint.textContent = 'Only users who found this extra tap actually got gold.'; }
      if (act === 'reset') reset();
    });
    scrim.addEventListener('click', closeSheet);
    const protoSeg = $('[data-seg="proto"]');
    if (protoSeg) setupSeg(protoSeg, (v) => { mode = v; reset(); });
    reset();
  }
})();
