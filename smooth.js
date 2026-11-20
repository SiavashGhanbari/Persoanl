/*
 * Smooth scrolling for mouse wheels and trackpads, plus eased anchor jumps.
 * No dependencies. Turns itself off for touch screens and reduced motion,
 * where native scrolling already feels right.
 */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;

  const NAV_OFFSET = 88; // keeps headings clear of the floating pill nav
  const maxY = () => root.scrollHeight - innerHeight;
  const clamp = (v) => Math.max(0, Math.min(maxY(), v));

  let target = scrollY, current = scrollY, raf = 0, ours = false;

  const step = () => {
    current += (target - current) * 0.12;
    if (Math.abs(target - current) < 0.5) current = target;
    ours = true; scrollTo(0, current);
    raf = current === target ? 0 : requestAnimationFrame(step);
  };
  const go = (y) => { target = clamp(y); if (!raf) { current = scrollY; raf = requestAnimationFrame(step); } };

  // Eased jump for in-page links, on every device (native if reduced motion)
  const jumpTo = (el) => {
    const y = el.getBoundingClientRect().top + scrollY - NAV_OFFSET;
    if (reduce) { scrollTo(0, y); return; }
    if (finePointer) { go(y); return; }
    scrollTo({ top: y, behavior: 'smooth' });
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    e.preventDefault(); jumpTo(el);
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  });
  // Arriving from another page with a hash
  if (location.hash) addEventListener('load', () => { const el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(() => jumpTo(el), 60); });

  if (reduce || !finePointer) return;
  root.classList.add('smooth-js');

  addEventListener('wheel', (e) => {
    if (e.ctrlKey) return; // pinch zoom
    if (e.target.closest('input, textarea, select, [data-native-scroll]')) return;
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16; else if (e.deltaMode === 2) dy *= innerHeight;
    if (!dy || Math.abs(e.deltaX) > Math.abs(dy)) return;
    e.preventDefault();
    go((raf ? target : scrollY) + dy);
  }, { passive: false });

  // Keyboard, scrollbar drags and find-in-page keep us in sync
  addEventListener('scroll', () => {
    if (ours) { ours = false; return; }
    if (!raf) { target = current = scrollY; }
  }, { passive: true });
  addEventListener('keydown', () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } target = current = scrollY; });
  addEventListener('mousedown', () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } target = current = scrollY; });
  addEventListener('resize', () => { target = clamp(target); });
})();
