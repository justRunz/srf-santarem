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
  const title = c.querySelector('.car-title');
  let cur = 0;
  // Fondu des images : chaque slide s'estompe à mesure qu'elle sort du cadre
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
    title.textContent = track.children[i].dataset.titulo;
    if (!reduce) title.animate({ opacity: [0, 1] }, { duration: 400, easing: 'ease-out' });
  }, { passive: true });
});

// Formulário de pedido : WhatsApp pré-preenchido ou email via /api/pedido (Resend)
const pedido = document.getElementById('pedido');
pedido?.addEventListener('submit', async e => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(pedido));
  if (e.submitter?.value === 'wa') {
    const texto = [...pedido.querySelectorAll('label:not(.hp):not(.consent)')]
      .map(l => { const c = l.querySelector('[name]'); return c.value.trim() && `${l.firstChild.textContent.replace('*', '').trim()}: ${c.value.trim()}`; })
      .filter(Boolean).join('\n');
    location.href = `https://wa.me/${pedido.dataset.wa}?text=${encodeURIComponent('Olá, gostaria de fazer um pedido de aluguer.\n\n' + texto)}`;
    return;
  }
  const estado = pedido.querySelector('.pedido-estado'), botoes = pedido.querySelectorAll('button');
  botoes.forEach(b => b.disabled = true);
  estado.textContent = 'A enviar…';
  try {
    const r = await fetch('/api/pedido', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
    const res = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(res.error);
    pedido.reset();
    estado.textContent = 'Pedido enviado! Respondemos em breve.';
  } catch (err) {
    estado.textContent = err.message || 'O envio falhou. Contacte-nos por WhatsApp ou telefone.';
  } finally {
    botoes.forEach(b => b.disabled = false);
  }
});
