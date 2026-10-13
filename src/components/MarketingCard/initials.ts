/**
 * Two initials from a name, for a plate or an avatar until there is a photo:
 * "Mayank Kelwani" → "MK", "ravi kumar singh" → "RK". A leading "Dr." is not
 * part of the name ("Dr. Priya Menon" → "PM").
 *
 * Internal to the marketing cards (PersonCard, ShowcaseCard); not exported
 * from the entry.
 */
export function initials(name: string): string {
  return name
    .replace(/^\s*Dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}
