// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { INDICATION_FIELDS_BY_COMPONENT } from '../../storage/indication-fields';
import { getProtocolBlockConfig } from './editor-config';
import { PlasmaIndications } from './indication-plasma-fields';
import { formatIndications } from './indications-model';

const FIELD = 'indicationPlasmaFactorsBelow50';
const LABEL =
  'Активность одного или нескольких факторов свёртывания крови составляет не более 50% от нормы, а препарат соответствующего фактора отсутствует.';

afterEach(cleanup);

it('предлагает отдельное показание при выборе плазмы и позволяет его снять', () => {
  const onChange = vi.fn();
  const { rerender } = render(<PlasmaIndications values={{}} onChange={onChange} />);
  fireEvent.click(screen.getByRole('checkbox', { name: LABEL }));
  expect(onChange).toHaveBeenLastCalledWith({ [FIELD]: '1' });

  rerender(<PlasmaIndications values={{ [FIELD]: '1' }} onChange={onChange} />);
  expect((screen.getByRole('checkbox', { name: LABEL }) as HTMLInputElement).checked).toBe(true);
  fireEvent.click(screen.getByRole('checkbox', { name: LABEL }));
  expect(onChange).toHaveBeenLastCalledWith({ [FIELD]: '' });
});

it('выводит полное показание в протокол без дублирования точки', () => {
  expect(
    formatIndications({
      indicationComponent: 'plasma-cryo',
      [FIELD]: '1',
    }),
  ).toBe(LABEL);
});

it('включает новое поле в сохранение и восстановление показаний', () => {
  expect(INDICATION_FIELDS_BY_COMPONENT['plasma-cryo']).toContain(FIELD);
  expect(getProtocolBlockConfig('donor').fields.map(({ name }) => name)).toContain(FIELD);
});
