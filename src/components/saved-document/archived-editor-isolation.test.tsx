// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SavedOptionsField } from '../transfusion-protocol/saved-options-field';
import { DepartmentField } from '../transfusion-protocol/department-field';
import { subscribeSavedOptions } from '../../storage/repositories/saved-options';
import { SavedDocumentScope } from './saved-document-scope';

const storage = vi.hoisted(() => ({
  remember: vi.fn(async () => []),
  rename: vi.fn(async () => []),
  remove: vi.fn(async () => []),
}));
vi.mock('../../storage/repositories/saved-options', () => ({
  loadSavedOptions: async () => [{ id: 1, value: 'Готовый вариант' }],
  rememberSavedOption: storage.remember,
  renameSavedOption: storage.rename,
  removeSavedOption: storage.remove,
  subscribeSavedOptions: vi.fn(() => () => undefined),
}));
vi.mock('../../storage/repositories/departments', () => ({
  loadDepartments: async () => [{ id: 1, name: 'Сохранённое отделение' }],
  renameDepartment: storage.rename,
  removeDepartment: storage.remove,
}));
afterEach(cleanup);

it('allows option controls but keeps incoming option renames from changing an archived document', async () => {
  const onChange = vi.fn();
  render(
    <SavedDocumentScope value={true}>
      <SavedOptionsField
        name="doctorName"
        label="Врач"
        category="doctorName"
        value="Готовый вариант"
        onChange={onChange}
      />
    </SavedDocumentScope>,
  );
  await screen.findByText('Готовый вариант');
  fireEvent.change(screen.getByRole('textbox', { name: 'Врач' }), {
    target: { value: 'Правка бланка' },
  });
  expect(onChange).toHaveBeenCalledWith('Правка бланка');
  onChange.mockClear();
  fireEvent.blur(screen.getByRole('textbox', { name: 'Врач' }));
  expect(storage.remember).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Показать сохранённые варианты: Врач' }));
  expect(screen.getByRole('button', { name: 'Изменить значение' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Удалить значение' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Готовый вариант' }));
  expect(onChange).toHaveBeenCalledWith('Готовый вариант');
  onChange.mockClear();
  const notify = vi.mocked(subscribeSavedOptions).mock.calls[0][1];
  act(() =>
    notify({
      items: [{ id: 1, value: 'Внешняя правка' }],
      edit: { previousValue: 'Готовый вариант', value: 'Внешняя правка' },
    }),
  );
  expect(onChange).not.toHaveBeenCalled();
  expect(storage.rename).not.toHaveBeenCalled();
  expect(storage.remove).not.toHaveBeenCalled();
});

it('keeps working-form option controls available without auto-persisting drafts', async () => {
  render(
    <SavedOptionsField
      name="doctorName"
      label="Врач"
      category="doctorName"
      value="Новый вариант"
      onChange={vi.fn()}
    />,
  );
  await screen.findByText('Готовый вариант');
  fireEvent.blur(screen.getByRole('textbox', { name: 'Врач' }));
  expect(storage.remember).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Показать сохранённые варианты: Врач' }));
  expect(screen.getByRole('button', { name: 'Изменить значение' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Удалить значение' })).toBeTruthy();
});

it('keeps archived department selection local and offers explicit option controls', async () => {
  const onChange = vi.fn();
  render(
    <SavedDocumentScope value={true}>
      <DepartmentField value="Старое отделение" onChange={onChange} />
    </SavedDocumentScope>,
  );
  await screen.findByText('Сохранённое отделение');
  fireEvent.click(screen.getByRole('button', { name: 'Показать ранее введённые отделения' }));
  expect(screen.getByRole('button', { name: 'Изменить значение' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Удалить значение' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Сохранённое отделение' }));
  expect(onChange).toHaveBeenCalledWith('Сохранённое отделение');
  expect(storage.rename).not.toHaveBeenCalled();
  expect(storage.remove).not.toHaveBeenCalled();
});

it('updates the selected archived value only after an explicit successful list edit', async () => {
  const onChange = vi.fn();
  render(
    <SavedDocumentScope value={true}>
      <SavedOptionsField
        name="doctorName"
        label="Врач"
        category="doctorName"
        value="Готовый вариант"
        onChange={onChange}
      />
    </SavedDocumentScope>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Показать сохранённые варианты: Врач' }));
  await screen.findByRole('button', { name: 'Готовый вариант' });
  fireEvent.click(screen.getByRole('button', { name: 'Изменить значение' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Изменить: Врач' }), {
    target: { value: 'Новый вариант' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменение' }));
  await waitFor(() => expect(onChange).toHaveBeenCalledWith('Новый вариант', 'Готовый вариант'));
  expect(storage.rename).toHaveBeenCalledWith('doctorName', 1, 'Новый вариант');
});
