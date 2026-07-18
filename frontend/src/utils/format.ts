export function formatMoney(
  value: number,
  options: Intl.NumberFormatOptions = { maximumFractionDigits: 0 }
) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    ...options,
  }).format(value);
}
