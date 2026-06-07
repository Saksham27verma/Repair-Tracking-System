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

/**
 * Create a URL-friendly slug from a string
 * Removes special characters, converts to lowercase, and replaces spaces with hyphens
 */
export function createSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/&/g, '-and-')      // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word characters except hyphens
    .replace(/\-\-+/g, '-')      // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')          // Trim hyphens from start
    .replace(/-+$/, '');         // Trim hyphens from end
} 