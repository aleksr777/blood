import { beforeEach, expect, it, vi } from 'vitest';
import { rememberSavedOption } from '../../storage/repositories/saved-options';
import { persistRequestOptions } from './request-saved-options';

vi.mock('../../storage/repositories/saved-options', () => ({
  rememberSavedOption: vi.fn(async () => []),
}));
vi.mock('../../storage/repositories/departments', () => ({
  rememberDepartment: vi.fn(async () => []),
}));
beforeEach(() => vi.clearAllMocks());

it('saves a custom coded entry with its code and name only during document persistence', async () => {
  await persistRequestOptions(
    {
      componentCode: 'МОЙ-1',
      requiredComponent: 'Пользовательский компонент',
      indicationValues: { componentGroup: 'erythrocytes' },
    },
    [],
  );
  expect(rememberSavedOption).toHaveBeenCalledWith(
    'componentRequestCode:erythrocytes',
    'МОЙ-1. Пользовательский компонент',
  );
  expect(rememberSavedOption).toHaveBeenCalledWith(
    'componentName:erythrocytes',
    'Пользовательский компонент',
  );
});

it('does not duplicate immutable official coded choices in editable history', async () => {
  await persistRequestOptions(
    {
      componentCode: 'ЭВ-Л',
      requiredComponent: 'Эритроцитная взвесь лейкоредуцированная',
      indicationValues: { componentGroup: 'erythrocytes' },
    },
    [],
  );
  expect(rememberSavedOption).not.toHaveBeenCalled();
});

it('does not add a code-less draft to the coded options list', async () => {
  await persistRequestOptions(
    {
      componentCode: '',
      requiredComponent: 'Произвольное наименование',
      indicationValues: { componentGroup: 'erythrocytes' },
    },
    [],
  );
  expect(rememberSavedOption).not.toHaveBeenCalledWith(
    'componentRequestCode:erythrocytes',
    expect.any(String),
  );
});

it.each([
  { individualSelectionRequired: 'yes', individualSelectionCode: 'Своя причина' },
  { individualSelectionIndications: 'Своя причина' },
])('saves a custom reason to the shared list on document save', async (reason) => {
  await persistRequestOptions(
    { ...reason, indicationValues: { componentGroup: 'erythrocytes' } },
    [],
  );
  expect(rememberSavedOption).toHaveBeenCalledWith('individualSelectionReason', 'Своя причина');
});

it.each([
  { individualSelectionRequired: 'yes', individualSelectionCode: '3' },
  { individualSelectionIndications: 'Аллоиммунные антитела к эритроцитам' },
  { individualSelectionRequired: 'no', individualSelectionCode: 'Скрытая причина' },
])('does not save official or inactive reasons as custom options', async (reason) => {
  await persistRequestOptions(
    { ...reason, indicationValues: { componentGroup: 'erythrocytes' } },
    [],
  );
  expect(rememberSavedOption).not.toHaveBeenCalledWith(
    'individualSelectionReason',
    expect.any(String),
  );
});
