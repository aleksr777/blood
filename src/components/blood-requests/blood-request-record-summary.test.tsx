// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { BloodRequestRecord } from '../../storage/repositories/recipients';
import { BloodRequestRecordSummary } from './blood-request-record-summary';

afterEach(cleanup);
const record = (
  kind: BloodRequestRecord['kind'],
  values: Record<string, unknown>,
): BloodRequestRecord => ({
  id: 42,
  recipientId: 1,
  kind,
  values,
  createdAt: new Date(2026, 9, 29, 12, 0).getTime(),
  updatedAt: new Date(2026, 9, 30, 21, 45).getTime(),
});

it.each(['component-request', 'individual-selection-direction'] as const)(
  'shows the saved component and direction date without time for %s',
  (kind) => {
    render(
      <BloodRequestRecordSummary
        record={record(kind, {
          requiredComponent: '  Эритроцитная взвесь лейкоредуцированная  ',
          directionDate: kind === 'component-request' ? '2026-10-30' : '2026-10-30T18:15',
          doctorName: 'Врач из сохранённого бланка',
        })}
      />,
    );
    expect(screen.getByText('Эритроцитная взвесь лейкоредуцированная')).toBeDefined();
    expect(screen.getByText('30.10.2026').getAttribute('datetime')).toBe('2026-10-30');
    expect(screen.queryByText(/18:15|21:45|Врач из сохранённого бланка/)).toBeNull();
  },
);

it.each(['component-request', 'individual-selection-direction'] as const)(
  'does not replace an absent component with group names or invent a date in %s',
  (kind) => {
    const { container } = render(
      <BloodRequestRecordSummary
        record={record(kind, {
          requiredComponent: ' ',
          directionDate: '',
          indicationValues: { indicationComponent: 'erythrocytes' },
        })}
      />,
    );
    expect(screen.getByText('Требуемый компонент не указан')).toBeDefined();
    expect(container.querySelector('time')).toBeNull();
  },
);

it.each(['component-request', 'individual-selection-direction'] as const)(
  'handles malformed archived values in %s',
  (kind) => {
    const { container } = render(
      <BloodRequestRecordSummary
        record={record(kind, { requiredComponent: {}, directionDate: '2026-02-30' })}
      />,
    );
    expect(screen.getByText('Требуемый компонент не указан')).toBeDefined();
    expect(container.querySelector('time')).toBeNull();
  },
);
