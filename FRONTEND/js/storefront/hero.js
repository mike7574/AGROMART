import { getSettings, subscribeStore } from '../shared/store.js';

export function initHero(root) {
  if (!root) return () => {};

  const slides = Array.from(root.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(root.querySelectorAll('[data-hero-dot]'));
  let idx = 0;
  let timer;

  const applySettings = () => {
    const s = getSettings();
    const headline = root.querySelector('[data-hero-headline]');
    const sub = root.querySelector('[data-hero-subcopy]');
    const cta = root.querySelector('[data-hero-cta]');
    if (headline) headline.textContent = s.heroHeadline;
    if (sub) sub.textContent = s.heroSubcopy;
    if (cta) {
      cta.textContent = s.heroCtaLabel;
      cta.setAttribute('href', s.heroCtaHref);
    }
    const imgs = (s.heroImages || []).filter(Boolean);
    slides.forEach((slide, i) => {
      const img = slide.querySelector('img');
      const src = imgs[i];
      if (img && src) img.src = src;
    });
  };

  const setActive = (next) => {
    idx = (next + slides.length) % slides.length;
    slides.forEach((el, i) => el.classList.toggle('is-active', i === idx));
    dots.forEach((el, i) => {
      el.classList.toggle('is-active', i === idx);
      el.setAttribute('aria-selected', i === idx ? 'true' : 'false');
    });
  };

  const tick = () => setActive(idx + 1);
  const start = () => {
    clearInterval(timer);
    timer = setInterval(tick, 6500);
  };

  applySettings();
  setActive(0);
  start();

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      setActive(i);
      start();
    });
  });

  const off = subscribeStore(() => {
    applySettings();
  });

  return () => {
    off();
    clearInterval(timer);
  };
}
