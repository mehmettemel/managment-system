import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPhone, formatPaymentMethod } from '@/utils/formatters';

describe('formatCurrency', () => {
  it('formats number correctly', () => {
    expect(formatCurrency(1500)).toBe('1.500 ₺');
    expect(formatCurrency(1000000)).toBe('1.000.000 ₺');
    expect(formatCurrency(0)).toBe('0 ₺');
  });

  it('formats string number correctly', () => {
    expect(formatCurrency('2500')).toBe('2.500 ₺');
    expect(formatCurrency('999')).toBe('999 ₺');
  });

  it('handles null and undefined', () => {
    expect(formatCurrency(null)).toBe('0 ₺');
    expect(formatCurrency(undefined)).toBe('0 ₺');
  });
});

describe('formatPhone', () => {
  it('formats Turkish phone number correctly', () => {
    expect(formatPhone('5551234567')).toBe('+90 555 123 45 67');
    expect(formatPhone('05551234567')).toBe('+90 555 123 45 67');
    expect(formatPhone('905551234567')).toBe('+90 555 123 45 67');
  });

  it('handles invalid phone numbers', () => {
    expect(formatPhone('123')).toBe('123');
    expect(formatPhone('invalid')).toBe('invalid');
  });

  it('handles null and undefined', () => {
    expect(formatPhone(null)).toBe('-');
    expect(formatPhone(undefined)).toBe('-');
    expect(formatPhone('')).toBe('-');
  });
});

describe('formatPaymentMethod', () => {
  it('formats cash correctly', () => {
    expect(formatPaymentMethod('cash')).toBe('Nakit');
    expect(formatPaymentMethod('CASH')).toBe('Nakit');
    expect(formatPaymentMethod('Nakit')).toBe('Nakit');
  });

  it('formats card correctly', () => {
    expect(formatPaymentMethod('card')).toBe('Kredi Kartı');
    expect(formatPaymentMethod('credit card')).toBe('Kredi Kartı');
    expect(formatPaymentMethod('Kredi Kartı')).toBe('Kredi Kartı');
  });

  it('formats transfer correctly', () => {
    expect(formatPaymentMethod('transfer')).toBe('Havale/EFT');
    expect(formatPaymentMethod('havale')).toBe('Havale/EFT');
    expect(formatPaymentMethod('Havale/EFT')).toBe('Havale/EFT');
  });

  it('handles null and undefined', () => {
    expect(formatPaymentMethod(null)).toBe('-');
    expect(formatPaymentMethod(undefined)).toBe('-');
  });

  it('handles unknown payment methods', () => {
    expect(formatPaymentMethod('bitcoin')).toBe('Bitcoin');
  });
});
