import { RESEND_API_KEY, EMAIL_FROM, EMAIL_TO } from 'astro:env/server';

// The site's only dynamic route (Vercel adapter); everything else stays static.
export const prerender = false;

const SEND_ERROR = 'O envio falhou. Contacte-nos por WhatsApp ou telefone.';

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const clean = (v, max = 200) =>
  typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim().slice(0, max) : '';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const FIELDS = [
  ['name', 'Nome'], ['phone', 'Telefone'], ['email', 'Email'], ['surgery', 'Tipo de cirurgia'],
  ['date', 'Data da cirurgia'], ['duration', 'Duração'], ['location', 'Local de entrega'],
];

export async function POST({ request }) {
  let p;
  try { p = await request.json(); } catch { return json(400, { error: 'Pedido ilegível.' }); }

  // Honeypot field: only a bot fills it in. Reply "ok" so it isn't tipped off.
  if (clean(p.website)) return json(200, { ok: true });

  const v = Object.fromEntries(FIELDS.map(([k]) => [k, clean(p[k])]));
  const message = clean(p.message, 4000);

  if (!v.name || !v.phone || !v.location)
    return json(400, { error: 'Indique o nome, o telefone e o local de entrega.' });
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email))
    return json(400, { error: 'O email parece incorreto.' });

  if (!RESEND_API_KEY || !EMAIL_FROM || !EMAIL_TO) {
    console.error('Missing Resend variables (RESEND_API_KEY, EMAIL_FROM, EMAIL_TO)');
    return json(500, { error: SEND_ERROR });
  }

  const rows = FIELDS.map(([k, label]) => [label, v[k] || '—']);
  const text = [...rows.map(([l, x]) => `${l}: ${x}`), '', message].join('\n');
  const html = `<table style="font-family:system-ui,sans-serif;font-size:15px;border-collapse:collapse">${rows
    .map(([l, x]) => `<tr><td style="padding:4px 16px 4px 0;color:#686b72">${l}</td><td style="padding:4px 0"><strong>${esc(x)}</strong></td></tr>`)
    .join('')}</table>${message ? `<p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;border-top:1px solid #d5d3d4;margin-top:16px;padding-top:16px">${esc(message).replace(/\n/g, '<br>')}</p>` : ''}`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [EMAIL_TO],
        ...(v.email && { reply_to: v.email }),
        subject: `Pedido de aluguer — ${v.name}`,
        text,
        html,
      }),
    });
    if (!r.ok) {
      console.error('Resend rejected the email', r.status, await r.text());
      return json(502, { error: SEND_ERROR });
    }
  } catch (e) {
    console.error('Resend unreachable', e);
    return json(502, { error: SEND_ERROR });
  }
  return json(200, { ok: true });
}
