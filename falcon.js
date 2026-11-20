(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const win = $('[data-falcon]');
  if (!win) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Illustrative data: amounts in million IRR, all due tomorrow
  const DEBTORS = [
    { name: 'Arman Trading Co.', type: 'Company', win: 'Morning', amt: 1200 },
    { name: 'Delta Foods Ltd.', type: 'Company', win: 'Noon', amt: 650 },
    { name: 'Reza Karimi', type: 'Person', win: 'Afternoon', amt: 400 },
  ];
  const CREDITORS = [
    { name: 'Sara Rahimi', type: 'Person', win: 'Morning', amt: 700, acct: 'IR12 0560 •••• 4821' },
    { name: 'Pars Import Ltd.', type: 'Company', win: 'Morning', amt: 500, acct: 'IR55 0170 •••• 1093' },
    { name: 'Kaveh Steel Co.', type: 'Company', win: 'Noon', amt: 650, acct: 'IR33 0610 •••• 2208' },
    { name: 'Ali Nouri', type: 'Person', win: 'Afternoon', amt: 400, acct: 'IR90 0120 •••• 7765' },
  ];
  const WINDOWS = ['Morning', 'Noon', 'Afternoon'];
  const fmt = (m) => `${m.toLocaleString('en-US')}M`;

  // Pair debtors with creditors inside each settlement window
  const match = () => {
    const out = [];
    WINDOWS.forEach((w) => {
      const ds = DEBTORS.map((d, i) => ({ ...d, i, left: d.amt })).filter(d => d.win === w);
      const cs = CREDITORS.map((c, i) => ({ ...c, i, left: c.amt })).filter(c => c.win === w);
      let di = 0, ci = 0;
      while (di < ds.length && ci < cs.length) {
        const pay = Math.min(ds[di].left, cs[ci].left);
        out.push({ from: ds[di], to: cs[ci], amt: pay, win: w });
        ds[di].left -= pay; cs[ci].left -= pay;
        if (!ds[di].left) di++;
        if (!cs[ci].left) ci++;
      }
    });
    return out;
  };

  const chip = (t) => `<span class="fchip">${t}</span>`;
  $('[data-debtors]').innerHTML = DEBTORS.map((d, i) => `<li data-d="${i}"><div><b>${d.name}</b><span>${chip(d.type)}${chip(d.win)}</span></div><em>${fmt(d.amt)}</em></li>`).join('');
  $('[data-creditors]').innerHTML = CREDITORS.map((c, i) => `<li data-c="${i}"><div><b>${c.name}</b><span>${chip(c.type)}${chip(c.win)}</span></div><em>${fmt(c.amt)}</em></li>`).join('');

  const plan = $('[data-plan]'); const balance = $('[data-balance]'); const hint = $('[data-fhint]');
  const genBtn = $('[data-generate]');
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, reduce ? 0 : ms));
  const clear = () => { timers.forEach(clearTimeout); timers = []; };

  genBtn.addEventListener('click', () => {
    clear(); plan.innerHTML = ''; balance.hidden = true;
    genBtn.disabled = true; genBtn.textContent = 'Matching…';
    const pairs = match();
    pairs.forEach((p, k) => later(() => {
      const msg = `Hello ${p.from.name}, please transfer ${(p.amt * 1e6).toLocaleString('en-US')} IRR to ${p.to.name} (${p.to.acct}) tomorrow ${p.win.toLowerCase()}. Thank you.`;
      const li = document.createElement('li');
      li.innerHTML = `<div class="pl-route"><b>${p.from.name}</b><span aria-hidden="true">→</span><b>${p.to.name}</b></div>
        <div class="pl-meta">${fmt(p.amt)} IRR · ${p.win} · ${p.to.acct}</div>
        <button type="button" class="copy">Copy WhatsApp message</button>`;
      li.querySelector('.copy').addEventListener('click', (e) => {
        try { navigator.clipboard?.writeText(msg); } catch (err) {}
        e.currentTarget.textContent = 'Copied ✓'; e.currentTarget.classList.add('done');
      });
      plan.appendChild(li);
      $$(`[data-d="${p.from.i}"], [data-c="${p.to.i}"]`, win).forEach(el => el.classList.add('matched'));
      if (k === pairs.length - 1) {
        balance.hidden = false; genBtn.textContent = 'List ready';
        hint.textContent = `${pairs.length} instructions in about a second. The trader reviews each one, then sends it.`;
      }
    }, 350 + k * 380));
    hint.textContent = 'Finding tomorrow’s settlements and pairing them by window…';
  });

  // Before: the paper list
  const LINES = [
    { t: 'Arman → Sara · 700 · morning · IR12…4821' },
    { t: 'Arman → Pars · 500 · morning · IR55…1093' },
    { t: 'Delta → Kaveh · 650 · noon · IR33…2280', err: 'wrong account' },
    { t: 'Karimi → Nouri · 400 · afternoon · IR90…7765' },
  ];
  const paperLines = $('[data-paper-lines]'); const paperClock = $('[data-paper-clock]'); const startBtn = $('[data-paper-start]');
  startBtn.addEventListener('click', () => {
    clear(); paperLines.innerHTML = ''; startBtn.disabled = true;
    const total = 167; // minutes: 2h 47m
    const steps = 24;
    for (let s = 0; s <= steps; s++) later(() => {
      const m = Math.round(total * s / steps);
      paperClock.textContent = `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
    }, s * 110);
    LINES.forEach((l, i) => later(() => {
      const li = document.createElement('li'); li.textContent = l.t;
      if (l.err) { li.classList.add('err'); li.insertAdjacentHTML('beforeend', `<small>${l.err}</small>`); }
      paperLines.appendChild(li);
    }, 300 + i * 620));
    later(() => { hint.textContent = '2 h 47 min after work, and one account number is wrong. Tomorrow that is a real loss.'; startBtn.textContent = 'Done (eventually)'; }, 2800);
    hint.textContent = 'Writing out every settlement due tomorrow, by hand…';
  });

  const views = $$('[data-fview]', win);
  let mode = 'after';
  const reset = () => {
    clear();
    views.forEach(v => { v.hidden = v.dataset.fview !== mode; });
    plan.innerHTML = ''; balance.hidden = true; genBtn.disabled = false; genBtn.textContent = 'Generate settlement list';
    $$('.matched', win).forEach(el => el.classList.remove('matched'));
    paperLines.innerHTML = ''; paperClock.textContent = '0:00'; startBtn.disabled = false; startBtn.textContent = 'Start the evening';
    hint.textContent = mode === 'after' ? 'Press “Generate settlement list”.' : 'Press “Start the evening”.';
  };
  $('[data-freset]').addEventListener('click', reset);

  const seg = $('[data-seg="fproto"]'); const btns = $$('button', seg); const thumb = $('.thumb', seg);
  const place = (b) => { thumb.style.width = b.offsetWidth + 'px'; thumb.style.transform = `translateX(${b.offsetLeft - 4}px)`; };
  btns.forEach(b => b.addEventListener('click', () => { btns.forEach(x => x.setAttribute('aria-pressed', x === b)); place(b); mode = b.dataset.value; reset(); }));
  requestAnimationFrame(() => place(btns.find(b => b.getAttribute('aria-pressed') === 'true')));
  addEventListener('resize', () => place(btns.find(b => b.getAttribute('aria-pressed') === 'true')));
  reset();
})();
