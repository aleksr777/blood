// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PLATELET_INDICATION_OPTIONS } from '../../domain/platelet-indications';
import { INDICATION_FIELDS_BY_COMPONENT } from '../../storage/indication-fields';
import { getProtocolBlockConfig } from './editor-config';
import { PlateletIndications } from './indication-platelet-fields';
import { formatIndications } from './indications-model';

afterEach(cleanup);

it('отображает ровно восемь заданных показаний, затем «Другие показания»', () => {
  render(<PlateletIndications values={{}} onChange={vi.fn()} />);
  expect(screen.getAllByRole('checkbox').map((item) => item.parentElement?.textContent)).toEqual([
    ...PLATELET_INDICATION_OPTIONS.map(([, label]) => label),
    'Другие показания',
  ]);
  expect(screen.queryByRole('spinbutton')).toBeNull();
  expect(screen.queryByRole('textbox')).toBeNull();
});

it('позволяет независимо выбирать и снимать каждое показание', () => {
  for (const [name, label] of PLATELET_INDICATION_OPTIONS) {
    const onChange = vi.fn();
    const { rerender, unmount } = render(<PlateletIndications values={{}} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: label }));
    expect(onChange).toHaveBeenLastCalledWith({ [name]: '1' });
    rerender(<PlateletIndications values={{ [name]: '1' }} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: label }));
    expect(onChange).toHaveBeenLastCalledWith({ [name]: '' });
    unmount();
  }
});

it('открывает текстовое поле только при выборе «Другие показания»', () => {
  const onChange = vi.fn();
  const { rerender } = render(<PlateletIndications values={{}} onChange={onChange} />);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Другие показания' }));
  expect(onChange).toHaveBeenLastCalledWith({ indicationPlateletOther: '1' });

  rerender(<PlateletIndications values={{ indicationPlateletOther: '1' }} onChange={onChange} />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Дополнительное показание' } });
  expect(onChange).toHaveBeenLastCalledWith({
    indicationPlateletOtherText: 'Дополнительное показание',
  });
});

it('печатает показания в заданном порядке с сохранением других показаний', () => {
  const values = Object.fromEntries(PLATELET_INDICATION_OPTIONS.map(([name]) => [name, '1']));
  const text = formatIndications({
    indicationComponent: 'platelets',
    ...values,
    indicationPlateletOther: '1',
    indicationPlateletOtherText: 'Индивидуальная причина',
  });
  expect(text).toBe(
    [...PLATELET_INDICATION_OPTIONS.map(([, label]) => label), 'Индивидуальная причина.'].join(' '),
  );
});

it('сохраняет новые поля и поддерживает вывод ранее сохранённых показаний', () => {
  const fields = getProtocolBlockConfig('donor').fields.map(({ name }) => name);
  for (const [name] of PLATELET_INDICATION_OPTIONS) {
    expect(fields).toContain(name);
    expect(INDICATION_FIELDS_BY_COMPONENT.platelets).toContain(name);
  }
  expect(
    formatIndications({
      indicationComponent: 'platelets',
      indicationPlateletThrombocytopenia: '1',
      indicationPlateletCount: '50',
      indicationPlateletHighBleedingRisk: '1',
    }),
  ).toBe('Высокий риск кровотечения. Тромбоцитопения менее 50 ×10⁹/л.');
});
