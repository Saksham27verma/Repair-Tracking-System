/**
 * Format a date string to a readable format
 */
export function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a currency value
 */
export function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined) {
    return '-';
  }
  return `₹${amount}`;
} 