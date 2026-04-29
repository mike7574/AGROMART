/** @param {number} amount */
export function formatKSh(amount) {
  const parsed = Number(amount);
  const n = Number.isFinite(parsed) ? parsed : 0;
  return `KSh ${Math.round(n).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}
