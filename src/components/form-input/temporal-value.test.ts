import { expect, it } from 'vitest';
import {
  formatDateInput,
  formatTemporalDraft,
  parseDateInput,
  parseTimeInput,
} from './temporal-value';

it('accepts real dates and keeps the storage format independent of the browser', () => {
  expect(formatDateInput('2024-02-29')).toBe('29.02.2024');
  expect(parseDateInput('29.02.2024')).toBe('2024-02-29');
  expect(parseDateInput('1.3.2026')).toBe('2026-03-01');
  expect(parseDateInput('2026-03-01')).toBe('2026-03-01');
  expect(parseDateInput('')).toBe('');
  expect(parseDateInput('29.02.2025')).toBeNull();
  expect(parseDateInput('31.04.2026')).toBeNull();
  expect(parseDateInput('20.11.')).toBeNull();
});

it('accepts 24-hour time and an empty field, without saving incomplete input', () => {
  expect(parseTimeInput('9:05')).toBe('09:05');
  expect(parseTimeInput('23:59')).toBe('23:59');
  expect(parseTimeInput('')).toBe('');
  expect(parseTimeInput('24:00')).toBeNull();
  expect(parseTimeInput('12:60')).toBeNull();
  expect(parseTimeInput('12:')).toBeNull();
});

it('adds separators while typing and formats pasted date and time values', () => {
  expect(formatTemporalDraft('date', '12')).toBe('12.');
  expect(formatTemporalDraft('date', '1203')).toBe('12.03.');
  expect(formatTemporalDraft('date', '12032026')).toBe('12.03.2026');
  expect(formatTemporalDraft('date', '2026-03-12')).toBe('12.03.2026');
  expect(formatTemporalDraft('time', '09')).toBe('09:');
  expect(formatTemporalDraft('time', '0935')).toBe('09:35');
  expect(formatTemporalDraft('time', '9:05')).toBe('09:05');
});
