import { beforeEach, expect, it, vi } from 'vitest';
import { rememberDepartment } from './departments';
import { persistDocumentOptions } from './document-options';
import { rememberSavedOption } from './saved-options';

vi.mock('./saved-options', () => ({
  rememberSavedOption: vi.fn(async () => []),
}));
vi.mock('./departments', () => ({
  rememberDepartment: vi.fn(async () => []),
}));
beforeEach(() => vi.clearAllMocks());

it('persists unique editable values but excludes immutable options', async () => {
  await persistDocumentOptions({
    department: 'ОРИТ',
    options: [
      {
        category: 'componentName:granulocytes',
        value: 'Компонент из справочника',
        fixedOptions: ['Компонент из справочника'],
      },
      { category: 'componentName:granulocytes', value: 'Новый вариант' },
      { category: 'componentName:granulocytes', value: '  новый   ВАРИАНТ  ' },
      { category: 'doctorName', value: '  Врач  ' },
      { category: 'doctorName', value: '   ' },
    ],
  });
  expect(rememberDepartment).toHaveBeenCalledOnce();
  expect(rememberDepartment).toHaveBeenCalledWith('ОРИТ');
  expect(rememberSavedOption).toHaveBeenCalledTimes(2);
  expect(rememberSavedOption).toHaveBeenCalledWith('componentName:granulocytes', 'Новый вариант');
  expect(rememberSavedOption).toHaveBeenCalledWith('doctorName', 'Врач');
});

it('does not fail an already saved document if a dictionary update fails', async () => {
  vi.mocked(rememberSavedOption).mockRejectedValueOnce(new Error('Сбой справочника'));
  const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    await expect(
      persistDocumentOptions({ options: [{ category: 'doctorName', value: 'Врач' }] }),
    ).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith('Не удалось сохранить вариант doctorName:', expect.any(Error));
  } finally {
    log.mockRestore();
  }
});
