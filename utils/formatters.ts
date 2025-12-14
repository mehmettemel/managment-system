import { numericFormatter } from 'react-number-format';

export const formatCurrency = (value: number | string | undefined | null) => {
  if (value === undefined || value === null) return '0 ₺';

  return numericFormatter(String(value), {
    thousandSeparator: '.',
    decimalSeparator: ',',
    suffix: ' ₺',
    decimalScale: 0,
    displayType: 'text',
  });
};

export const formatPhone = (value: string | undefined | null) => {
  if (!value) return '-';
  // Simple format for display if not using mask component
  // Use regex to keep it simple for pure text display if needed,
  // or use a library, but for simple display logic, the previous regex was fine.
  // However, let's try to match the mask: +90 5XX ...

  // Clean all non-digits
  const cleaned = value.replace(/\D/g, '');

  // If it starts with 90, strip it for easier processing
  let bare = cleaned;
  if (bare.startsWith('90')) bare = bare.slice(2);
  if (bare.startsWith('0')) bare = bare.slice(1);

  // Now we expect 10 digits: 5XX XXX XX XX
  if (bare.length === 10) {
    return `+90 ${bare.slice(0, 3)} ${bare.slice(3, 6)} ${bare.slice(6, 8)} ${bare.slice(8, 10)}`;
  }

  return value;
};

/**
 * Format payment method from database value to Turkish display name
 * Database values: 'cash', 'card', 'transfer', 'Nakit', 'Kredi Kartı', 'Havale/EFT'
 */
export const formatPaymentMethod = (
  value: string | undefined | null
): string => {
  if (!value) return '-';

  // Normalize to lowercase for comparison
  const normalized = value.toLowerCase().trim();

  switch (normalized) {
    case 'cash':
    case 'nakit':
      return 'Nakit';
    case 'card':
    case 'credit card':
    case 'kredi kartı':
    case 'kredi karti':
      return 'Kredi Kartı';
    case 'transfer':
    case 'havale':
    case 'havale/eft':
    case 'eft':
      return 'Havale/EFT';
    default:
      // Return capitalized version if unknown
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
};
