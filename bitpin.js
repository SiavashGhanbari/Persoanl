(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const phone = $('[data-wproto]');
  if (!phone) return;

  const START = 12 * 60 + 40;       // 12:40
  const ETA = 230;                  // 16:30, minutes after start
  const STEPS = [
    { t: 'Request received', at: 0 },
    { t: 'Security review', at: 15 },
    { t: 'Regulatory check (FATA)', at: 50 },
    { t: 'Sent to bank', at: 80 },
    { t: 'Bank confirmed · arrives by 16:30', at: 100 },
    { t: 'Deposited to your account', at: 210 },
  ];
  const fmt = (m) => { const v = START + m; return `${String(Math.floor(v / 60) % 24).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`; };

  const slider = $('#wtime'); const out = $('[data-wtime-out]'); const delay = $('[data-delay]');
  const hint = $('[data-whint]'); const clock = $('[data-wclock]');
  const list = $('[data-wsteps]'); const late = $('[data-late]'); const eta = $('[data-eta]');
  const snack = $('[data-snack]'); const oldMsg = $('[data-oldmsg]');
  let mode = 'after'; let started = false;

  list.innerHTML = STEPS.map(s => `<li><i aria-hidden="true"></i><div><span>${s.t}</span><small></small></div></li>`).join('');
  const items = $$('li', list);

  const show = (name) => $$('.view', phone).forEach(v => v.classList.toggle('hidden', v.dataset.view !== name));

  const render = () => {
    const m = +slider.value; const time = fmt(m);
    out.textContent = time; clock.textContent = time;
    if (!started) return;
    if (mode === 'after') {
      let current = -1;
      items.forEach((li, i) => {
        const s = STEPS[i]; const blocked = delay.checked && i === STEPS.length - 1;
        const done = m >= s.at && !blocked;
        li.classList.toggle('done', done);
        li.querySelector('small').textContent = done ? fmt(s.at) : '';
        if (done) current = i;
      });
      items.forEach((li, i) => li.classList.toggle('now', i === current + 1 && !(delay.checked && m >= ETA)));
      const deposited = items[items.length - 1].classList.contains('done');
      const isLate = delay.checked && m >= ETA;
      late.hidden = !isLate; eta.hidden = deposited || isLate;
      hint.textContent = deposited ? 'Money arrived before the promised time. No ticket needed.'
        : isLate ? 'The promised time has passed. Only now does the app suggest contacting support.'
        : m >= 100 ? 'The bank confirmed an exact time. The user knows when to expect the money.'
        : 'Each step updates live, so a wait never looks like a failure.';
    } else {
      oldMsg.textContent = m < 60 ? '' : m < 180 ? `${Math.floor(m / 60)}h later: still "Processing". Is my money lost?` : 'Still nothing. The user opens a support ticket.';
      oldMsg.classList.toggle('on', m >= 60);
      hint.textContent = m < 60 ? 'Drag the time forward.' : 'Same screen for hours. Users had no way to tell a delay from a failure.';
    }
  };

  const reset = () => {
    started = false; slider.value = 0; slider.disabled = true; show('form');
    snack.hidden = mode !== 'after'; oldMsg.textContent = ''; oldMsg.classList.remove('on');
    items.forEach(li => li.classList.remove('done', 'now')); late.hidden = true; eta.hidden = false;
    hint.textContent = mode === 'after' ? 'Notice the arrival time before you tap Withdraw.' : 'Tap Withdraw to try the old flow.';
    render();
  };

  phone.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'withdraw') { started = true; slider.disabled = false; show(mode === 'after' ? 'details' : 'old'); render(); hint.textContent = 'Now drag the time slider.'; }
    if (act === 'reset') reset();
  });
  slider.addEventListener('input', render);
  delay.addEventListener('change', render);
  $('[data-wreset]').addEventListener('click', reset);

  // Before / After segmented control
  const seg = $('[data-seg="wproto"]'); const btns = $$('button', seg); const thumb = $('.thumb', seg);
  const place = (b) => { thumb.style.width = b.offsetWidth + 'px'; thumb.style.transform = `translateX(${b.offsetLeft - 4}px)`; };
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.setAttribute('aria-pressed', x === b)); place(b); mode = b.dataset.value;
    $('.delay').hidden = mode !== 'after'; reset();
  }));
  requestAnimationFrame(() => place(btns.find(b => b.getAttribute('aria-pressed') === 'true')));
  addEventListener('resize', () => place(btns.find(b => b.getAttribute('aria-pressed') === 'true')));
  reset();
})();
