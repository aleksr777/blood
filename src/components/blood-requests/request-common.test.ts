// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import {
  activateOnKeyboard,
  formatDirectionDate,
  readSavedRequestRecordId,
  REQUEST_AUTO_FIELDS,
} from './request-common';

beforeEach(() => window.localStorage.clear());

it('restores only positive integer archive identifiers', () => {
  const key = 'blood:test-request';
  const savedIdKey = `${key}:saved-record-id`;
  for (const invalid of ['0', '-1', '1.5', 'Infinity', '9007199254740992', 'not-a-number']) {
    window.localStorage.setItem(savedIdKey, invalid);
    expect(readSavedRequestRecordId(key)).toBeNull();
  }
  window.localStorage.setItem(savedIdKey, '42');
  expect(readSavedRequestRecordId(key)).toBe(42);
});

it('formats request dates and ignores malformed date strings', () => {
  expect(formatDirectionDate('2026-11-10')).toBe('10.11.2026');
  expect(formatDirectionDate('10.11.2026')).toBe('');
  expect(formatDirectionDate('')).toBe('');
});

it.each(['Enter', ' '])('activates request editors on %s', (key) => {
  const preventDefault = vi.fn();
  const action = vi.fn();
  activateOnKeyboard(
    { key, preventDefault } as unknown as Parameters<typeof activateOnKeyboard>[0],
    action,
  );
  expect(preventDefault).toHaveBeenCalledOnce();
  expect(action).toHaveBeenCalledOnce();
});

it('does not activate editors for unrelated keys', () => {
  const preventDefault = vi.fn();
  const action = vi.fn();
  activateOnKeyboard(
    { key: 'Escape', preventDefault } as unknown as Parameters<typeof activateOnKeyboard>[0],
    action,
  );
  expect(preventDefault).not.toHaveBeenCalled();
  expect(action).not.toHaveBeenCalled();
});

it('keeps the same auto-filled field list for both request forms', () => {
  expect(REQUEST_AUTO_FIELDS).toContain('recipientAboRh');
  expect(REQUEST_AUTO_FIELDS).toContain('recipientSex');
  expect(new Set(REQUEST_AUTO_FIELDS).size).toBe(REQUEST_AUTO_FIELDS.length);
});
