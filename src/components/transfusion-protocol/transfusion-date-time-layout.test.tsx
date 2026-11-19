// @vitest-environment jsdom
import type { PropsWithChildren } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ProtocolEditorModal } from './protocol-editor-modal';
import styles from './protocol-editor.module.css';

vi.mock('../modal/modal', () => ({
  default: ({ children }: PropsWithChildren) => <section>{children}</section>,
}));
afterEach(cleanup);

it('groups the transfusion date and both time fields in the same responsive grid', () => {
  render(
    <ProtocolEditorModal
      blockId="general"
      values={{}}
      bloodGroupWarning=""
      bloodGroupWarningDismissible={false}
      onDismissBloodGroupWarning={vi.fn()}
      componentUnitNumberWarning=""
      onDismissComponentUnitNumberWarning={vi.fn()}
      previousTransfusionSuggestion=""
      persistReusableOptions={false}
      onOpenRecipients={vi.fn()}
      onSelectRecipient={vi.fn()}
      onSave={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  const group = screen.getByRole('group', { name: 'Данные трансфузии' });
  const labels = ['Дата трансфузии', 'Время начала трансфузии', 'Время окончания трансфузии'];
  const fields = labels.map((text) => within(group).getByText(text).closest('label'));
  const grid = fields[0]?.parentElement;
  expect(grid?.classList.contains(styles.transfusionGrid)).toBe(true);
  expect(fields.every((field) => field?.parentElement === grid)).toBe(true);
  expect(fields.map((field) => field?.querySelector('input')?.type)).toEqual([
    'date',
    'time',
    'time',
  ]);
});
