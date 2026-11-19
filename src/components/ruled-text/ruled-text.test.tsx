// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { RuledText } from './ruled-text';
import { AdaptiveRuledField } from '../blood-requests/adaptive-ruled-field';
import { ComponentRequestForm } from '../blood-requests/component-request-form';
import { request } from '../blood-requests/component-request-form.fixture';
import styles from './ruled-text.module.css';

afterEach(cleanup);

it('shares ruled text styling with the adaptive fields and supports truncation', () => {
  render(
    <>
      <RuledText truncate title="Полное значение">
        Иванов
      </RuledText>
      <AdaptiveRuledField label="Врач:" value="Петров" />
    </>,
  );
  const text = screen.getByText('Иванов').parentElement;
  expect(text?.classList.contains(styles.line)).toBe(true);
  expect(text?.classList.contains(styles.truncate)).toBe(true);
  expect(text?.getAttribute('title')).toBe('Полное значение');
  const visible = screen.getByText('Петров', { selector: `.${styles.value}` });
  expect(visible.parentElement?.classList.contains(styles.line)).toBe(true);
  const label = screen.getByText('Врач:', { selector: `.${styles.label}` });
  expect(label.parentElement).toBe(visible.parentElement?.parentElement);
});

it('uses the same ruled text for the physician on both request pages', () => {
  render(
    <ComponentRequestForm values={request} examination={{}} readOnly={false} onEdit={() => {}} />,
  );
  const names = screen.getAllByText(request.doctorName, { selector: `.${styles.value}` });
  expect(names).toHaveLength(2);
  expect(names.every((name) => name.parentElement?.classList.contains(styles.line))).toBe(true);
  const label = screen.getByText('Получил компоненты крови:', { selector: `.${styles.label}` });
  expect(label.parentElement).toBe(names[1].parentElement?.parentElement);
});
