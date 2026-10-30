// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MonitoringFields } from './monitoring-fields';
import { MONITORING_PERIODS } from './monitoring-model';
import type { ProtocolValues } from './protocol-types';

vi.mock('../../storage/repositories/saved-options', () => ({
  loadSavedOptions: vi.fn(async () => []),
  subscribeSavedOptions: () => () => undefined,
  rememberSavedOption: vi.fn(async () => []),
  renameSavedOption: vi.fn(async () => []),
  removeSavedOption: vi.fn(async () => []),
}));
afterEach(cleanup);

it.each(MONITORING_PERIODS)('enforces all three ranges for $title', async ({ prefix, title }) => {
  const onChange = vi.fn();
  const Editor = () => {
    const [values, setValues] = useState<ProtocolValues>({
      [`${prefix}Pulse`]: '72',
      [`${prefix}Temperature`]: '36.6',
      [`${prefix}Urine`]: '150',
    });
    return (
      <MonitoringFields
        values={values}
        onChange={(next) => {
          onChange(next);
          setValues((current) => ({ ...current, ...next }));
        }}
      />
    );
  };
  render(<Editor />);
  const group = within(screen.getByRole('group', { name: title }));
  for (const [label, suffix, min, max, initial, invalid] of [
    ['Частота пульса, уд/мин', 'Pulse', '1', '999', '72', '1000'],
    ['Температура, °C', 'Temperature', '20', '50', '36.6', '50.1'],
    ['Диурез, мл', 'Urine', '0', '9999', '150', '10000'],
  ]) {
    const input = group.getByLabelText(label) as HTMLInputElement;
    expect([input.min, input.max]).toEqual([min, max]);
    fireEvent.change(input, { target: { value: invalid } });
    expect(input.value).toBe(initial);
    for (const value of [min, max]) {
      fireEvent.change(input, { target: { value } });
      expect(input.value).toBe(value);
      expect(onChange).toHaveBeenLastCalledWith({ [`${prefix}${suffix}`]: value });
    }
  }
  const updates = onChange.mock.calls.map(([value]) => Object.values(value)[0]);
  expect(updates).not.toContain('1000');
  expect(updates).not.toContain('50.1');
  expect(updates).not.toContain('10000');
  await waitFor(() => expect(group.getByLabelText('Цвет мочи')).toHaveProperty('maxLength', 255));
});

it('shows legacy combined urine text without rewriting it on opening', async () => {
  const onChange = vi.fn();
  render(
    <MonitoringFields
      values={{ beforeUrine: '100 мл, светло-жёлтая', beforeTemperature: '15' }}
      onChange={onChange}
    />,
  );
  expect(screen.getByText('Ранее введено: 100 мл, светло-жёлтая')).toBeTruthy();
  expect((screen.getAllByLabelText('Температура, °C')[0] as HTMLInputElement).value).toBe('15');
  await waitFor(() => expect(onChange).not.toHaveBeenCalled());
});
