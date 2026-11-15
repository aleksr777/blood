// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DonorBlock } from '../transfusion-protocol/first-page-blocks-secondary';
import { ComponentRequestForm } from './component-request-form';
import { visibleRequestComponentValues } from './component-request-form-values';
import { request } from './component-request-form.fixture';
import { visibleDirectionComponentValues } from './direction-indications';

afterEach(cleanup);

it('hides request component columns without changing the stored component data', () => {
  const values = {
    ...request,
    indicationValues: {
      componentGroup: '',
      indicationComponent: '',
      lastSelectedComponentGroup: 'erythrocytes',
    },
  };
  const { rerender } = render(
    <ComponentRequestForm values={values} examination={{}} readOnly onEdit={() => {}} />,
  );
  const cells = () =>
    screen.getByRole('table', { name: 'Графы 1–12 заявки' }).querySelectorAll('tbody td');
  expect(
    Array.from(cells())
      .slice(5, 10)
      .every((cell) => cell.textContent === ''),
  ).toBe(true);
  expect(cells()[0].textContent).toContain('Иванов Иван Иванович');
  expect(values.requiredComponent).toBe(request.requiredComponent);
  expect(values.componentCode).toBe('ЭВ-Л');
  expect(visibleRequestComponentValues(values).componentCode).toBe('');
  rerender(
    <ComponentRequestForm
      values={{
        ...values,
        indicationValues: { componentGroup: 'erythrocytes', indicationComponent: 'erythrocytes' },
      }}
      examination={{}}
      readOnly
      onEdit={() => {}}
    />,
  );
  expect(cells()[5].textContent).toContain('ЭВ-Л');
  expect(cells()[7].textContent).toContain('Анемия в стационаре');
});

it('hides direction text and indications without deleting the draft fields', () => {
  const draft = {
    requiredComponent: 'Отмытые эритроциты',
    quantity: '2',
    individualSelectionIndications: 'Показания к подбору',
    indicationValues: {
      componentGroup: '',
      indicationComponent: '',
      indicationRbcHemicHypoxia: '1',
    },
  };
  const hidden = visibleDirectionComponentValues(draft);
  expect(hidden.requiredComponent).toBe('');
  expect(hidden.quantity).toBe('');
  expect(hidden.individualSelectionIndications).toBe('');
  expect(hidden.indicationValues).toEqual({});
  expect(draft.requiredComponent).toBe('Отмытые эритроциты');
  expect(draft.indicationValues.indicationRbcHemicHypoxia).toBe('1');
  expect(
    visibleDirectionComponentValues({
      ...draft,
      indicationValues: { ...draft.indicationValues, componentGroup: 'erythrocytes' },
    }).requiredComponent,
  ).toBe('Отмытые эритроциты');
});

it('hides donor details from the protocol until the component group is reselected', () => {
  const values = {
    componentGroup: '',
    indicationComponent: '',
    componentName: 'Отмытые эритроциты',
    collectionOrganization: 'Станция крови',
    donorAbo: 'A(II)',
    amountMl: '250',
    componentUnitNumber: '76102200045636',
    indicationRbcAnemicSyndrome: '1',
  };
  const sheet = (group: string) => (
    <table>
      {(['indications', 'main', 'blood', 'dates'] as const).map((part) => (
        <DonorBlock
          key={part}
          part={part}
          values={{ ...values, componentGroup: group, indicationComponent: group }}
          onOpenBlock={() => {}}
        />
      ))}
    </table>
  );
  const { container, rerender } = render(sheet(''));
  expect(container.textContent).not.toContain('Отмытые эритроциты');
  expect(container.textContent).not.toContain('Станция крови');
  expect(container.textContent).not.toContain('A(II)');
  expect(container.textContent).not.toContain('250');
  expect(container.textContent).not.toContain('Анемический синдром');
  expect(values.componentName).toBe('Отмытые эритроциты');
  rerender(sheet('erythrocytes'));
  expect(container.textContent).toContain('Отмытые эритроциты');
  expect(container.textContent).toContain('Станция крови');
  expect(container.textContent).toContain('Анемический синдром');
});
