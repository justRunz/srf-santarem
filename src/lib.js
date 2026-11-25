import site from './data/site.json';
export const wa = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.mensagemWhatsapp)}`;
export const tel = `tel:${site.telefone.replace(/\s/g, '')}`;
export const falta = (v, nome) => v || `[${nome} — a preencher]`;
