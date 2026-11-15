// Menu mobile
const btn = document.querySelector('.menu-btn'), nav = document.querySelector('nav');
btn?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  btn.setAttribute('aria-expanded', open);
  btn.textContent = open ? '×' : '≡';
});

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Compteur : <b data-count="375" data-suffix=" €">
function countUp(el) {
  const end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1400;
  const step = t => {
    const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(end * e) + suf;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Apparition au défilement
const io = new IntersectionObserver(entries => {
  for (const en of entries) if (en.isIntersecting) {
    en.target.classList.add('in');
    if (en.target.dataset.count && !reduce) countUp(en.target);
    io.unobserve(en.target);
  }
}, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal,.lines,[data-count]').forEach(el => io.observe(el));

// Carrousel ←→ 1/4
document.querySelectorAll('.carousel').forEach(c => {
  const track = c.querySelector('.track'), n = track.children.length, out = c.querySelector('.count');
  const idx = () => Math.round(track.scrollLeft / track.clientWidth);
  const go = d => track.scrollTo({ left: (Math.max(0, Math.min(n - 1, idx() + d))) * track.clientWidth, behavior: 'smooth' });
  c.querySelector('.prev').onclick = () => go(-1);
  c.querySelector('.next').onclick = () => go(1);
  track.addEventListener('scroll', () => out.textContent = `${idx() + 1}/${n}`, { passive: true });
});
