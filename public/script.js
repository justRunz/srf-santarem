// Mobile menu
const btn = document.querySelector('.menu-btn'), nav = document.querySelector('nav');
btn?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  btn.setAttribute('aria-expanded', open);
  btn.textContent = open ? '×' : '≡';
});

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Counter: <b data-count="375" data-suffix=" €">
function countUp(el) {
  const end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1400;
  const step = t => {
    const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(end * e) + suf;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Reveal on scroll
const io = new IntersectionObserver(entries => {
  for (const en of entries) if (en.isIntersecting) {
    en.target.classList.add('in');
    if (en.target.dataset.count && !reduce) countUp(en.target);
    io.unobserve(en.target);
  }
}, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal,.lines,[data-count]').forEach(el => io.observe(el));

// Carousel ←→ 1/4
document.querySelectorAll('.carousel').forEach(c => {
  const track = c.querySelector('.track'), n = track.children.length, out = c.querySelector('.count');
  const idx = () => Math.round(track.scrollLeft / track.clientWidth);
  const go = d => track.scrollTo({ left: (Math.max(0, Math.min(n - 1, idx() + d))) * track.clientWidth, behavior: 'smooth' });
  c.querySelector('.prev').onclick = () => go(-1);
  c.querySelector('.next').onclick = () => go(1);
  const title = c.querySelector('.car-title');
  let cur = 0;
  // Image fade: each slide fades out as it leaves the frame
  const slides = [...track.children];
  track.addEventListener('scroll', () => {
    slides.forEach((sl, j) => {
      const d = Math.abs(j - track.scrollLeft / track.clientWidth);
      sl.firstElementChild.style.opacity = Math.max(0, 1 - d * 1.6);
    });
    const i = idx();
    if (i === cur) return;
    cur = i;
    out.textContent = `${i + 1}/${n}`;
    title.textContent = track.children[i].dataset.title;
    if (!reduce) title.animate({ opacity: [0, 1] }, { duration: 400, easing: 'ease-out' });
  }, { passive: true });
});

// Booking form: prefilled WhatsApp message or email via /api/booking (Resend)
const form = document.getElementById('booking');
form?.addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  if (e.submitter?.value === 'wa') {
    const text = [...form.querySelectorAll('label:not(.hp):not(.consent)')]
      .map(l => { const c = l.querySelector('[name]'); return c.value.trim() && `${l.firstChild.textContent.replace('*', '').trim()}: ${c.value.trim()}`; })
      .filter(Boolean).join('\n');
    location.href = `https://wa.me/${form.dataset.wa}?text=${encodeURIComponent('Olá, gostaria de fazer um pedido de aluguer.\n\n' + text)}`;
    return;
  }
  const status = form.querySelector('.booking-status'), buttons = form.querySelectorAll('button');
  buttons.forEach(b => b.disabled = true);
  status.textContent = 'A enviar…';
  try {
    const r = await fetch('/api/booking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const res = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(res.error);
    form.reset();
    status.textContent = 'Pedido enviado! Respondemos em breve.';
  } catch (err) {
    status.textContent = err.message || 'O envio falhou. Contacte-nos por WhatsApp ou telefone.';
  } finally {
    buttons.forEach(b => b.disabled = false);
  }
});
