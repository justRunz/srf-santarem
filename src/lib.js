import site from './data/site.json';
export const wa = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.whatsappMessage)}`;
export const tel = `tel:${site.phone.replace(/\s/g, '')}`;
export const orPlaceholder = (value, label) => value || `[${label} — a preencher]`;
