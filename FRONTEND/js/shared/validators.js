export function normalizeMobileDigits(input) {
  return String(input || '').replace(/\D/g, '');
}

export function validateKenyaMobile(input) {
  const d = normalizeMobileDigits(input);
  if (d.length < 9 || d.length > 12) return 'Enter a valid mobile number (digits only, 9–12 digits).';
  return null;
}

export function validateRequired(value, label) {
  if (!String(value || '').trim()) return `${label} is required.`;
  return null;
}
