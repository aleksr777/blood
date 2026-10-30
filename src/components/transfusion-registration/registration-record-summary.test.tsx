// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { RegistrationRecordSummary } from './registration-record-summary';
import type { ProtocolRecord, RegistrationRecord } from '../../storage/repositories/recipients';

afterEach(cleanup);
const protocol: ProtocolRecord = {
  id: 7,
  recipientId: 1,
  values: { componentName: 'Текущая плазма', componentUnitNumber: '222222 222222 22' },
  createdAt: 1,
  updatedAt: 1,
};
const record = (rows: Record<string, unknown>[]): RegistrationRecord => ({
  id: 42,
  recipientId: 1,
  values: { registrationTransfusionRows: JSON.stringify(rows) },
  createdAt: new Date(2026, 9, 29, 12, 0).getTime(),
  updatedAt: new Date(2026, 9, 30, 21, 45).getTime(),
});

it('shows only the last save date and every snapshot component after protocol changes or deletion', () => {
  const snapshot = record([
    {
      protocolId: 7,
      componentName: 'Исходные эритроциты',
      componentUnitNumber: '111111 111111 11',
    },
    { protocolId: 8, componentName: 'Тромбоциты', componentUnitNumber: '333333 333333 33' },
  ]);
  render(<RegistrationRecordSummary record={snapshot} protocols={[protocol]} />);
  expect(screen.getByText('30.10.2026').getAttribute('datetime')).toBe('2026-10-30');
  expect(screen.queryByText(/21:45/)).toBeNull();
  for (const text of [
    'Исходные эритроциты',
    '№ 111111 111111 11',
    'Тромбоциты',
    '№ 333333 333333 33',
  ]) {
    expect(screen.getByText(text)).toBeDefined();
  }
  expect(screen.queryByText(/Текущая плазма|222222/)).toBeNull();
  expect(JSON.parse(snapshot.values.registrationTransfusionRows)).toHaveLength(2);
});

it('uses matching protocols of the same recipient for numbers missing from legacy snapshots', () => {
  render(
    <RegistrationRecordSummary
      record={record([{ protocolId: 7, componentName: 'Архивное наименование' }])}
      protocols={[protocol]}
    />,
  );
  expect(screen.getByText('Архивное наименование')).toBeDefined();
  expect(screen.getByText('№ 222222 222222 22')).toBeDefined();
  expect(screen.queryByText('Текущая плазма')).toBeNull();
});

it('does not borrow hemacon details from another recipient or invent an absent number', () => {
  render(
    <RegistrationRecordSummary
      record={record([{ protocolId: 7, componentName: 'Компонент' }])}
      protocols={[{ ...protocol, recipientId: 2 }]}
    />,
  );
  expect(screen.getByText('Номер гемакона не указан')).toBeDefined();
  expect(screen.queryByText(/222222/)).toBeNull();
});

it('keeps separate sheets from mixing their components', () => {
  render(
    <>
      <section aria-label="Первый лист">
        <RegistrationRecordSummary
          record={record([{ protocolId: 7, componentName: 'Первый компонент' }])}
          protocols={[protocol]}
        />
      </section>
      <section aria-label="Второй лист">
        <RegistrationRecordSummary
          record={record([{ protocolId: 8, componentName: 'Второй компонент' }])}
          protocols={[protocol]}
        />
      </section>
    </>,
  );
  expect(
    within(screen.getByRole('region', { name: 'Первый лист' })).queryByText('Второй компонент'),
  ).toBeNull();
  expect(
    within(screen.getByRole('region', { name: 'Второй лист' })).queryByText('Первый компонент'),
  ).toBeNull();
});

it('uses creation date if the last save date is absent and handles an empty legacy sheet', () => {
  render(<RegistrationRecordSummary record={{ ...record([]), updatedAt: 0 }} protocols={[]} />);
  expect(screen.getByText('29.10.2026')).toBeDefined();
  expect(screen.queryByText(/12:00/)).toBeNull();
  expect(screen.getByText('Трансфузии не указаны.')).toBeDefined();
});

it('handles malformed legacy rows and absent timestamps without failing', () => {
  render(
    <RegistrationRecordSummary
      record={{
        ...record([]),
        values: { registrationTransfusionRows: '{' },
        createdAt: 0,
        updatedAt: NaN,
      }}
      protocols={[]}
    />,
  );
  expect(screen.getByText('Дата сохранения не указана')).toBeDefined();
  expect(screen.getByText('Трансфузии не указаны.')).toBeDefined();
});
