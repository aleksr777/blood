// @vitest-environment jsdom
import type { PropsWithChildren } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ProtocolEditorModal } from './protocol-editor-modal';
import patientStyles from './patient-details-fields.module.css';
import styles from './protocol-editor.module.css';

vi.mock('../../storage/repositories/departments', () => ({
  loadDepartments: vi.fn(async () => []),
}));

vi.mock('../modal/modal', () => ({
  default: ({ children }: PropsWithChildren) => <section>{children}</section>,
}));
afterEach(cleanup);

it('places age after birth date and groups the transfusion date and times', () => {
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
  const recipient = screen.getByRole('group', { name: 'Данные реципиента' });
  const recipientFields = recipient.querySelector('legend + div')?.children;
  expect(recipientFields?.[0].parentElement?.classList.contains(patientStyles.grid)).toBe(true);
  expect(recipientFields?.[1].textContent).toContain('Дата рождения');
  expect(recipientFields?.[2].textContent).toContain('Возраст');
  expect(recipientFields?.[3].textContent).toContain('Пол');
  expect(within(recipient).getByLabelText('Диагноз')).toBeTruthy();
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
