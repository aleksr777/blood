// @vitest-environment jsdom
import { createRef } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { FormInput, FormTextarea, TEXT_INPUT_MAX_LENGTH, TEXTAREA_MAX_LENGTH } from './form-input';

afterEach(cleanup);

it.each([undefined, 'text', 'search', 'email', 'tel', 'url', 'password'])(
  'limits single-line text input of type %s by default',
  (type) => {
    render(<FormInput aria-label="Поле" type={type} />);
    expect((screen.getByLabelText('Поле') as HTMLInputElement).maxLength).toBe(
      TEXT_INPUT_MAX_LENGTH,
    );
  },
);

it('keeps explicit limits, including a zero limit, and limits multiline text separately', () => {
  render(
    <>
      <FormInput aria-label="Гемакон" maxLength={16} />
      <FormInput aria-label="Закрыто" maxLength={0} />
      <FormTextarea aria-label="Описание" />
      <FormTextarea aria-label="Короткое описание" maxLength={100} />
    </>,
  );
  expect((screen.getByLabelText('Гемакон') as HTMLInputElement).maxLength).toBe(16);
  expect((screen.getByLabelText('Закрыто') as HTMLInputElement).maxLength).toBe(0);
  expect((screen.getByLabelText('Описание') as HTMLTextAreaElement).maxLength).toBe(
    TEXTAREA_MAX_LENGTH,
  );
  expect((screen.getByLabelText('Короткое описание') as HTMLTextAreaElement).maxLength).toBe(100);
});

it.each(['number', 'date', 'time', 'datetime-local', 'radio', 'checkbox'])(
  'does not add a text length limit to %s controls',
  (type) => {
    render(<FormInput aria-label="Поле" type={type} />);
    expect(screen.getByLabelText('Поле').hasAttribute('maxlength')).toBe(false);
  },
);

it('preserves long existing values and does not emit a change while opening', () => {
  const onChange = vi.fn();
  const text = 'А'.repeat(400);
  const description = 'Б'.repeat(3000);
  render(
    <>
      <FormInput aria-label="Поле" value={text} onChange={onChange} />
      <FormTextarea aria-label="Описание" value={description} onChange={onChange} />
    </>,
  );
  expect((screen.getByLabelText('Поле') as HTMLInputElement).value).toBe(text);
  expect((screen.getByLabelText('Описание') as HTMLTextAreaElement).value).toBe(description);
  expect(onChange).not.toHaveBeenCalled();
});

it('forwards refs, names, classes and native change events without adding DOM wrappers', () => {
  const input = createRef<HTMLInputElement>();
  const textarea = createRef<HTMLTextAreaElement>();
  const onChange = vi.fn();
  const { container } = render(
    <>
      <FormInput ref={input} name="department" className="field" onChange={onChange} />
      <FormTextarea ref={textarea} name="history" />
    </>,
  );
  expect([...container.children].map((element) => element.tagName)).toEqual(['INPUT', 'TEXTAREA']);
  expect(input.current?.className).toBe('field');
  expect(input.current?.name).toBe('department');
  expect(textarea.current?.name).toBe('history');
  input.current?.focus();
  expect(document.activeElement).toBe(input.current);
  fireEvent.change(input.current!, { target: { value: 'Реанимация' } });
  expect(onChange).toHaveBeenCalledOnce();
});
