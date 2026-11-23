/**
 * Shared utility functions for formatting dates and text.
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatAge(age: number): string {
  return `${age} tahun`;
}
