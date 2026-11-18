import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { stage } from '../lib/stage';
import { sizes, range, bookUrl } from '../data/pricebook';

gsap.registerPlugin(ScrollTrigger, SplitText);
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
stage.reduced = reduce;

/* ── Hero estimator: one slider drives the price, the booking link and the 3D pile ── */
const slider = document.querySelector<HTMLInputElement>('#haul-size');
const $$ = <T extends HTMLElement = HTMLElement>(sel: string) => [...document.querySelectorAll<T>(sel)];
function setSize(i: number) {
  const s = sizes[i];
  stage.size = i;
  if (slider) slider.value = String(i);
  $$('[data-size-name], [data-live-name]').forEach((el) => { el.textContent = s.name; });
  $$('[data-size-detail]').forEach((el) => { el.textContent = s.detail; });
  $$('[data-size-price], [data-live-price]').forEach((el) => { el.textContent = range(s); });
  $$<HTMLAnchorElement>('[data-size-book]').forEach((a) => { a.href = bookUrl(s.id); });
  slider?.setAttribute('aria-valuetext', `${s.name}, ${range(s)}`);
  $$('[data-tick]').forEach((t) => { t.dataset.on = String(Number(t.dataset.tick) === i); });
}
slider?.addEventListener('input', () => setSize(Number(slider.value)));
$$<HTMLButtonElement>('[data-tick]').forEach((t) => t.addEventListener('click', () => setSize(Number(t.dataset.tick))));
setSize(Number(slider?.value ?? 4));

/* Stop 03: highlight the next open day (Mon–Sat per the canon hours; Sunday rolls to Monday). */
{
  const tomorrow = (new Date().getDay() + 1) % 7; // 0 Sun … 6 Sat
  const idx = tomorrow === 0 ? 0 : tomorrow - 1;
  document.querySelector<HTMLElement>(`.day[data-day="${idx}"]`)?.setAttribute('data-on', 'true');
}

/* Active section → nav underline (desktop) and highlighted item (mobile menu). */
{
  const links = $$<HTMLAnchorElement>('[data-nav]');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) {
      links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === `#${e.target.id}`)));
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['stage', 'rates', 'estates', 'area', 'faq'].forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
}

/* Spotlight hover on hairline cells (pointer devices only). */
if (window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--x', `${e.clientX - r.left}px`);
      el.style.setProperty('--y', `${e.clientY - r.top}px`);
    });
  });
}

type LenisWin = Window & { __lenis?: Lenis };
const scrollToEl = (target: HTMLElement | number) => {
  const l = (window as LenisWin).__lenis;
  if (l) l.scrollTo(target, { duration: 1.4, force: true });
  else typeof target === 'number' ? window.scrollTo({ top: target }) : target.scrollIntoView();
};

/* Mobile menu (native <dialog>): smooth scroll pauses while it's open. */
{
  const menu = document.querySelector<HTMLDialogElement>('#menu');
  const opener = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  opener?.addEventListener('click', () => { menu?.showModal(); (window as LenisWin).__lenis?.stop(); });
  document.querySelector('[data-menu-close]')?.addEventListener('click', () => menu?.close());
  menu?.addEventListener('click', (e) => { if (e.target === menu) menu.close(); }); // backdrop tap
  menu?.addEventListener('close', () => { (window as LenisWin).__lenis?.start(); opener?.focus(); });
  // Resume Lenis *before* closing: Lenis.start() resets any in-flight scroll, so starting it in the
  // async 'close' event would cancel the scroll this link is about to request.
  $$<HTMLAnchorElement>('[data-menu-link]').forEach((a) => a.addEventListener('click', () => { (window as LenisWin).__lenis?.start(); menu?.close(); }));
}

/* Pause snow (parity with the live site): stops the truck scene's snowfall. Off by default under reduced motion. */
{
  const btn = document.querySelector<HTMLButtonElement>('[data-snow-toggle]');
  const label = btn?.querySelector('[data-snow-label]');
  const sync = () => {
    btn?.setAttribute('aria-pressed', String(!stage.snow));
    if (label) label.textContent = stage.snow ? 'Pause snow' : 'Let it snow';
  };
  btn?.addEventListener('click', () => { stage.snow = !stage.snow; sync(); });
  sync();
}

/* Rate cards → "See it in 3D": set the pile to that size and fly back up to the stage. */
$$<HTMLButtonElement>('[data-see]').forEach((b) => b.addEventListener('click', () => {
  setSize(Number(b.dataset.see));
  scrollToEl(0);
  slider?.focus({ preventScroll: true });
}));

if (reduce) {
  stage.gone = 0;
  document.documentElement.dataset.stop = '';
} else {
  history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);

  const lenis = new Lenis({ lerp: 0.1 });
  (window as Window & { __lenis?: Lenis }).__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')!;
      const target = id.length > 1 ? document.querySelector<HTMLElement>(id) : null;
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.4, force: true });
      history.replaceState(null, '', id);
    });
  });

  /* Four stops: scroll progress → camera, which card shows, and the carry-out. */
  const steps = [...document.querySelectorAll<HTMLElement>('.stage-step')];
  const STEP_AT = [0.12, 0.33, 0.53, 0.73];
  const heroCopy = document.querySelector<HTMLElement>('.hero-copy');
  const rail = document.querySelector<HTMLElement>('[data-rail-fill]');
  const root = document.documentElement;
  const bar = document.querySelector<HTMLElement>('[data-actionbar]');
  // Past the stage the bar stays up; hide it only while the hero estimator is on screen.
  ScrollTrigger.create({ trigger: '#rates', start: 'top bottom', onEnter: () => bar?.setAttribute('data-show', 'true') });

  /* Stop 04: live "items carried out" counter read from the 3D scene. */
  const carriedEl = document.querySelector<HTMLElement>('[data-carried]');
  const carriedLabel = document.querySelector<HTMLElement>('[data-carried-label]');
  gsap.ticker.add(() => {
    if (root.dataset.stop !== '3' || !carriedEl) return;
    const txt = `${stage.carried} / ${stage.total}`;
    if (carriedEl.textContent !== txt) carriedEl.textContent = txt;
    const done = stage.total > 0 && stage.carried >= stage.total;
    const label = done ? 'carried out. Broom-swept.' : 'items carried out';
    if (carriedLabel && carriedLabel.textContent !== label) carriedLabel.textContent = label;
  });

  /* Where we work: the river draws itself in, then the bridge. */
  const river = document.querySelector<SVGPathElement>('[data-river]');
  if (river) {
    const len = river.getTotalLength();
    gsap.fromTo(river, { strokeDasharray: len, strokeDashoffset: len }, {
      strokeDashoffset: 0, ease: 'none',
      scrollTrigger: { trigger: '.river-map', start: 'top 85%', end: 'bottom 55%', scrub: 0.6 },
    });
    gsap.from('[data-bridge]', { opacity: 0, scaleX: 0, transformOrigin: '50% 50%', duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.river-map', start: 'center 70%', once: true } });
    gsap.from('[data-pin]', { opacity: 0, y: -12, duration: 0.6, stagger: 0.15, ease: 'back.out(2)', scrollTrigger: { trigger: '.river-map', start: 'center 75%', once: true } });
  }

  ScrollTrigger.create({
    trigger: '#stage',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: ({ progress: p }) => {
      stage.progress = p;
      stage.gone = Math.min(1, Math.max(0, (p - 0.76) / 0.2));
      let active = -1;
      STEP_AT.forEach((at, i) => { if (p >= at) active = i; });
      steps.forEach((s, i) => { s.dataset.active = String(i === active); });
      if (root.dataset.stop !== String(active)) root.dataset.stop = String(active);
      bar?.setAttribute('data-show', String(p > 0.1 || window.scrollY > innerHeight));
      if (heroCopy) {
        const h = Math.min(p / 0.08, 1);
        heroCopy.style.opacity = String(1 - h);
        heroCopy.style.transform = `translate3d(0, ${-h * 40}px, 0)`;
        heroCopy.style.visibility = h >= 1 ? 'hidden' : '';
      }
      if (rail) rail.style.transform = `scaleY(${p})`;
    },
  });

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 105, duration: 0.85, stagger: 0.06, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      }),
    });
  });
  document.querySelectorAll<HTMLElement>('[data-fade]').forEach((el) => {
    gsap.from(el, { y: 28, autoAlpha: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
