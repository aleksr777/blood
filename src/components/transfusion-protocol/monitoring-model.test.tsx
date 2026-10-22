// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { clearRecipientLinkedValues } from '../../storage/repositories/recipient-linked-values';
import { MonitorTable } from './monitor-table';
import { formatMonitoringUrine, getMonitoringFields, MONITORING_PERIODS } from './monitoring-model';

afterEach(cleanup);

it.each(MONITORING_PERIODS)(
  'retains old combined urine text for $prefix in the editor and printed table',
  ({ prefix }) => {
    const legacy = '100 мл, светло-жёлтая';
    const values = { [`${prefix}Urine`]: legacy };
    const fields = getMonitoringFields(prefix);
    expect(fields.find(({ name }) => name === `${prefix}Urine`)?.label).toBe('Диурез');
    expect(fields.find(({ name }) => name === `${prefix}UrineColor`)?.label).toBe('Цвет мочи');
    expect(formatMonitoringUrine(values, prefix)).toBe(legacy);
    render(<MonitorTable values={values} part={prefix === 'before' ? 'main' : prefix} />);
    expect(screen.getByText(legacy)).toBeTruthy();
  },
);

it('prints both separately entered urine values without dropping either field', () => {
  render(
    <MonitorTable
      values={{ beforeUrine: '150 мл', beforeUrineColor: 'Соломенно-жёлтая' }}
      part="main"
    />,
  );
  expect(screen.getByText('150 мл, Соломенно-жёлтая')).toBeTruthy();
  expect(formatMonitoringUrine({ hour1UrineColor: 'Жёлтая' }, 'hour1')).toBe('Жёлтая');
});

it('clears both monitoring fields when disconnecting a recipient while retaining reagent defaults', () => {
  const values = {
    recipientId: '1',
    recipientName: 'Реципиент',
    reagentAntiASeries: '123',
    ...Object.fromEntries(
      MONITORING_PERIODS.flatMap(({ prefix }) => [
        [`${prefix}Urine`, '100 мл'],
        [`${prefix}UrineColor`, 'Жёлтая'],
      ]),
    ),
  };
  expect(clearRecipientLinkedValues(values, 1)).toEqual({ reagentAntiASeries: '123' });
  expect(clearRecipientLinkedValues(values, 2)).toBe(values);
});
