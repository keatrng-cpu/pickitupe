export function digitsPhone(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
  return d;
}

export function isUsPhone(raw: string) {
  return /^\d{10}$/.test(digitsPhone(raw));
}

export function formatPhone(raw: string) {
  const d = digitsPhone(raw);
  if (d.length !== 10) return raw;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
