import { RESEND_API_KEY, EMAIL_FROM, EMAIL_TO } from 'astro:env/server';

// Única rota dinâmica do site (adaptador Vercel); o resto continua estático.
export const prerender = false;

const ERRO = 'O envio falhou. Contacte-nos por WhatsApp ou telefone.';

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const clean = (v, max = 200) =>
  typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim().slice(0, max) : '';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CAMPOS = [
  ['nome', 'Nome'], ['telefone', 'Telefone'], ['email', 'Email'], ['cirurgia', 'Tipo de cirurgia'],
  ['data', 'Data da cirurgia'], ['duracao', 'Duração'], ['local', 'Local de entrega'],
];

export async function POST({ request }) {
  let p;
  try { p = await request.json(); } catch { return json(400, { error: 'Pedido ilegível.' }); }

  // Campo armadilha: só um robô o preenche. Responde "ok" para não o informar.
  if (clean(p.website)) return json(200, { ok: true });

  const v = Object.fromEntries(CAMPOS.map(([k]) => [k, clean(p[k])]));
  const mensagem = clean(p.mensagem, 4000);

  if (!v.nome || !v.telefone || !v.local)
    return json(400, { error: 'Indique o nome, o telefone e o local de entrega.' });
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email))
    return json(400, { error: 'O email parece incorreto.' });

  if (!RESEND_API_KEY || !EMAIL_FROM || !EMAIL_TO) {
    console.error('Variáveis Resend em falta (RESEND_API_KEY, EMAIL_FROM, EMAIL_TO)');
    return json(500, { error: ERRO });
  }

  const linhas = CAMPOS.map(([k, label]) => [label, v[k] || '—']);
  const text = [...linhas.map(([l, x]) => `${l}: ${x}`), '', mensagem].join('\n');
  const html = `<table style="font-family:system-ui,sans-serif;font-size:15px;border-collapse:collapse">${linhas
    .map(([l, x]) => `<tr><td style="padding:4px 16px 4px 0;color:#686b72">${l}</td><td style="padding:4px 0"><strong>${esc(x)}</strong></td></tr>`)
    .join('')}</table>${mensagem ? `<p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;border-top:1px solid #d5d3d4;margin-top:16px;padding-top:16px">${esc(mensagem).replace(/\n/g, '<br>')}</p>` : ''}`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [EMAIL_TO],
        ...(v.email && { reply_to: v.email }),
        subject: `Pedido de aluguer — ${v.nome}`,
        text,
        html,
      }),
    });
    if (!r.ok) {
      console.error('Resend recusou o envio', r.status, await r.text());
      return json(502, { error: ERRO });
    }
  } catch (e) {
    console.error('Resend inacessível', e);
    return json(502, { error: ERRO });
  }
  return json(200, { ok: true });
}
