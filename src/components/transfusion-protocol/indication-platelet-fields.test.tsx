// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  LEGACY_PLATELET_INDICATION_OPTIONS,
  PLATELET_INDICATION_OPTIONS,
} from '../../domain/platelet-indications';
import { getProtocolBlockConfig } from './editor-config';
import { PlateletIndications } from './indication-platelet-fields';
import { formatIndications } from './indications-model';

afterEach(cleanup);
const thresholdLabel = 'Количество тромбоцитов менее';
const thresholdInput = () =>
  screen.getByRole('textbox', { name: 'Порог количества тромбоцитов' }) as HTMLInputElement;

it('показывает пять пунктов, включая другие показания, и текстовый порог 50 по умолчанию', () => {
  render(<PlateletIndications values={{}} onChange={vi.fn()} />);
  expect(screen.getAllByRole('checkbox').map((item) => item.parentElement?.textContent)).toEqual([
    thresholdLabel,
    ...PLATELET_INDICATION_OPTIONS.map(([, label]) => label),
    'Другие показания',
  ]);
  expect(thresholdInput().value).toBe('50');
  expect(thresholdInput().type).toBe('text');
  expect(thresholdInput().disabled).toBe(true);
  expect(screen.getByText('× 10⁹/л.')).toBeTruthy();
  expect(screen.getByRole('checkbox', { name: 'Другие показания' })).toBeTruthy();
  expect(screen.queryByText('Количество тромбоцитов менее 20 × 10⁹/л')).toBeNull();
});

it('включает порог, позволяет вводить число и сохраняет его при снятии галочки', () => {
  const onChange = vi.fn();
  const { rerender } = render(<PlateletIndications values={{}} onChange={onChange} />);
  fireEvent.click(screen.getByRole('checkbox', { name: thresholdLabel }));
  expect(onChange).toHaveBeenLastCalledWith({
    indicationPlateletThrombocytopenia: '1',
    indicationPlateletVersion: '2',
  });
  rerender(
    <PlateletIndications
      values={{ indicationPlateletThrombocytopenia: '1' }}
      onChange={onChange}
    />,
  );
  expect(thresholdInput().disabled).toBe(false);
  fireEvent.change(thresholdInput(), { target: { value: '75' } });
  expect(onChange).toHaveBeenLastCalledWith({
    indicationPlateletCount: '75',
    indicationPlateletVersion: '2',
  });
  fireEvent.change(thresholdInput(), { target: { value: '7x' } });
  expect(onChange).toHaveBeenCalledTimes(2);
  rerender(
    <PlateletIndications
      values={{ indicationPlateletThrombocytopenia: '1', indicationPlateletCount: '75' }}
      onChange={onChange}
    />,
  );
  fireEvent.click(screen.getByRole('checkbox', { name: thresholdLabel }));
  expect(onChange).toHaveBeenLastCalledWith({
    indicationPlateletThrombocytopenia: '',
    indicationPlateletVersion: '2',
  });
});

it.each(PLATELET_INDICATION_OPTIONS)('позволяет переключать показание %s', (name, label) => {
  const onChange = vi.fn();
  const { rerender } = render(<PlateletIndications values={{}} onChange={onChange} />);
  fireEvent.click(screen.getByRole('checkbox', { name: label }));
  expect(onChange).toHaveBeenLastCalledWith({ [name]: '1', indicationPlateletVersion: '2' });
  rerender(<PlateletIndications values={{ [name]: '1' }} onChange={onChange} />);
  fireEvent.click(screen.getByRole('checkbox', { name: label }));
  expect(onChange).toHaveBeenLastCalledWith({ [name]: '', indicationPlateletVersion: '2' });
});

it('передаёт новые четыре формулировки и редактируемый порог в печатный бланк', () => {
  const values = Object.fromEntries(PLATELET_INDICATION_OPTIONS.map(([name]) => [name, '1']));
  const text = formatIndications({
    indicationComponent: 'platelets',
    indicationPlateletVersion: '2',
    indicationPlateletThrombocytopenia: '1',
    indicationPlateletCount: '75',
    ...values,
  });
  expect(text).toBe(
    [
      'Количество тромбоцитов менее 75 × 10⁹/л.',
      ...PLATELET_INDICATION_OPTIONS.map(([, label]) => label),
    ].join(' '),
  );
  expect(
    formatIndications({
      indicationComponent: 'platelets',
      indicationPlateletVersion: '2',
      indicationPlateletThrombocytopenia: '1',
    }),
  ).toBe('Количество тромбоцитов менее 50 × 10⁹/л.');
});

it('сохраняет старые показания в архиве и новые поля в настройках сохранения', () => {
  const fields = getProtocolBlockConfig('donor').fields.map(({ name }) => name);
  const names = [
    ...PLATELET_INDICATION_OPTIONS.map(([name]) => name),
    ...LEGACY_PLATELET_INDICATION_OPTIONS.map(([name]) => name),
    'indicationPlateletVersion',
    'indicationPlateletThrombocytopenia',
    'indicationPlateletCount',
  ];
  for (const name of names) {
    expect(fields).toContain(name);
  }
  const stored = {
    indicationComponent: 'platelets',
    indicationPlateletBelow20Invasive: '1',
    indicationPlateletHighBleedingRisk: '1',
  };
  expect(formatIndications(stored)).toContain('Количество тромбоцитов менее 20 × 10⁹/л');
  expect(formatIndications({ ...stored, indicationPlateletVersion: '2' })).toBe(
    'Высокий риск кровотечения.',
  );
});
