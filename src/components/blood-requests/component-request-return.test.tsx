// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { database } from '../../storage/sqlite/database-client';
import {
  adoptCurrentRecipientFromValues,
  readCurrentRecipient,
} from '../../storage/repositories/current-recipient';
import { ComponentRequest } from './component-request';

vi.mock('../../storage/sqlite/database-client', () => ({
  database: {
    loadProtocolDraft: vi.fn(async () => ({ values: {}, protocolRecordId: null, updatedAt: 0 })),
    saveBloodRequestRecord: vi.fn(),
    listSavedOptions: vi.fn(async () => []),
    rememberSavedOption: vi.fn(async () => []),
    listDepartments: vi.fn(async () => []),
    rememberDepartment: vi.fn(async () => []),
  },
}));
const key = 'blood:component-request-direction-draft';
const codedOptionsLabel = 'Показать сохранённые варианты: Идентификационный код (графа 6)';
const openCodes = () => fireEvent.click(screen.getByRole('button', { name: codedOptionsLabel }));
const chooseCode = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const profile = {
  recipientId: '1',
  recipientName: 'Рабочий реципиент',
  recipientSex: 'Мужской',
  medicalRecordNumber: '123',
  diagnosis: 'Рабочий диагноз',
  department: 'ОРИТ',
};
const working = {
  ...profile,
  sourceRecipientId: '1',
  recipientProfileSnapshot: profile,
  requiredComponent: 'Эритроцитная взвесь',
  componentAbo: 'A(II)',
  componentRh: 'Rh(+)',
  quantity: '2',
  transfusionOrder: 'planned',
  componentSelectionRequirement: 'individual',
  individualSelectionIndications: 'Рабочие показания к подбору',
  indicationValues: {
    componentGroup: 'erythrocytes',
    indicationComponent: 'erythrocytes',
    indications: 'Рабочие показания',
  },
  medicalOrganization: 'ЛПУ',
  directionDate: '2026-10-26',
  doctorName: 'Врач',
  doctorPhone: '12345',
};
beforeEach(() => {
  vi.mocked(database.listSavedOptions).mockResolvedValue([]);
  vi.mocked(database.rememberSavedOption).mockClear();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  vi.stubGlobal('matchMedia', () => ({ matches: true, addListener() {}, removeListener() {} }));
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.setAttribute('open', '');
      },
    },
    close: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.removeAttribute('open');
      },
    },
  });
  window.localStorage.clear();
  window.sessionStorage.clear();
  adoptCurrentRecipientFromValues(profile);
  window.localStorage.setItem(key, JSON.stringify(working));
  vi.mocked(database.saveBloodRequestRecord).mockImplementation(async ({ values }) => ({
    id: 42,
    recipientId: 1,
    kind: 'component-request',
    values,
    createdAt: 1,
    updatedAt: 1,
  }));
});
afterEach(cleanup);

const expectWorkingSelectionCleared = async () => {
  await waitFor(() => {
    const next = JSON.parse(window.localStorage.getItem(key)!);
    for (const field of ['requiredComponent', 'componentAbo', 'componentRh', 'quantity']) {
      expect(next[field]).toBe('');
    }
    for (const field of [
      'sourceRecipientId',
      'recipientName',
      'diagnosis',
      'medicalRecordNumber',
      'department',
      'medicalOrganization',
      'directionDate',
      'transfusionOrder',
      'componentSelectionRequirement',
      'individualSelectionIndications',
    ] as const) {
      expect(next[field]).toEqual(working[field]);
    }
    expect(next.doctorName).toBe('');
    expect(next.doctorPhone).toBeUndefined();
    expect(next.indicationValues.indications).toBe(working.indicationValues.indications);
  });
  expect(readCurrentRecipient()?.id).toBe(1);
};

it.each(['view', 'edit'] as const)(
  'clears only the working component details when returning from %s',
  async (mode) => {
    window.sessionStorage.setItem(
      'blood:component-request-open-record',
      JSON.stringify({
        record: {
          id: 42,
          recipientId: 2,
          kind: 'component-request',
          values: { recipientName: 'Архивный реципиент' },
        },
        mode,
      }),
    );
    render(<ComponentRequest />);
    fireEvent.click(screen.getByRole('button', { name: 'К созданию нового бланка' }));
    await expectWorkingSelectionCleared();
    expect(database.saveBloodRequestRecord).not.toHaveBeenCalled();
  },
);

it('preserves other request data when a working request is saved and closed', async () => {
  const { container } = render(<ComponentRequest />);
  fireEvent.click(screen.getByRole('button', { name: /^Сохранить$/ }));
  await screen.findByRole('button', { name: 'К созданию нового бланка' });
  expect(container.querySelector('main')?.getAttribute('data-document-mode')).toBe('edit');
  expect(screen.getByRole('button', { name: 'Сохранить' }).hasAttribute('disabled')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'К созданию нового бланка' }));
  await expectWorkingSelectionCleared();
  expect(database.saveBloodRequestRecord).toHaveBeenCalledOnce();
  const saved = vi.mocked(database.saveBloodRequestRecord).mock.calls[0][0].values;
  expect(saved.requiredComponent).toBe(working.requiredComponent);
  expect(saved.doctorName).toBe(working.doctorName);
});
it('сохраняет новые графы приложения № 17 через модальное окно компонента', async () => {
  render(<ComponentRequest />);
  fireEvent.click(screen.getByText('Эритроцитная взвесь'));
  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.queryByLabelText('Идентификационный код компонента (графа 6)')).toBeNull();
  const componentInput = dialog.getByRole('textbox', { name: 'Идентификационный код (графа 6)' });
  openCodes();
  expect(dialog.queryByRole('button', { name: /КТ-ЛП\./ })).toBeNull();
  chooseCode('ЭВ-Л. Эритроцитная взвесь лейкоредуцированная');
  expect((componentInput as HTMLInputElement).value).toBe(
    'ЭВ-Л. Эритроцитная взвесь лейкоредуцированная',
  );
  fireEvent.change(dialog.getByLabelText('Код показания к трансфузии (графа 8)'), {
    target: { value: '1.1' },
  });
  fireEvent.change(dialog.getByRole('textbox', { name: /Показание для индивидуального подбора/ }), {
    target: { value: '3 — Аллоиммунные антитела к эритроцитам' },
  });
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: true, cancelable: true }));

  expect(screen.getByText('ЭВ-Л')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /^Сохранить$/ }));
  await waitFor(() => expect(database.saveBloodRequestRecord).toHaveBeenCalledOnce());
  const saved = vi.mocked(database.saveBloodRequestRecord).mock.calls[0][0].values;
  expect(saved.componentCode).toBe('ЭВ-Л');
  expect(saved.requiredComponent).toBe('Эритроцитная взвесь лейкоредуцированная');
  expect(saved.transfusionIndicationCode).toBe('1.1');
  expect(saved.individualSelectionRequired).toBe('yes');
  expect(saved.individualSelectionCode).toBe('3');
});
it('при смене группы показывает только её коды и очищает прежнее наименование и код', () => {
  window.localStorage.setItem(
    key,
    JSON.stringify({
      ...working,
      requiredComponent: 'Эритроцитная взвесь лейкоредуцированная',
      componentCode: 'ЭВ-Л',
      transfusionIndicationCode: '1.1',
    }),
  );
  render(<ComponentRequest />);
  fireEvent.click(screen.getByText('Эритроцитная взвесь лейкоредуцированная'));
  const dialog = within(screen.getByRole('dialog'));
  fireEvent.click(dialog.getByRole('button', { name: 'Плазма' }));
  const componentInput = dialog.getByRole('textbox', {
    name: 'Идентификационный код (графа 6)',
  }) as HTMLInputElement;
  expect(componentInput.value).toBe('');
  openCodes();
  expect(dialog.queryByRole('button', { name: /ЭВ-Л\./ })).toBeNull();
  chooseCode('КРИО-Л. Криопреципитат лиофилизированный');
  expect(componentInput.value).toBe('КРИО-Л. Криопреципитат лиофилизированный');
  expect(
    (dialog.getByLabelText('Код показания к трансфузии (графа 8)') as HTMLSelectElement).value,
  ).toBe('');
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: true, cancelable: true }));
  expect(screen.getByText('КРИО-Л')).toBeTruthy();
});

it('не переносит старые сведения о доноре КМ/ГСК в заявку', async () => {
  window.localStorage.setItem(
    key,
    JSON.stringify({
      ...working,
      stemCellDonorAbo: 'A(II)',
      stemCellDonorRh: 'Rh(+)',
      stemCellDonorAntigens: 'C+ c+ E− e+ K−',
    }),
  );
  render(<ComponentRequest />);
  const cells = screen
    .getByRole('table', { name: 'Графы 1–12 заявки' })
    .querySelectorAll('tbody td');
  expect(cells[10].textContent).toBe('');
  expect(cells[11].textContent).toBe('');
  fireEvent.click(screen.getByRole('button', { name: /^Сохранить$/ }));
  await waitFor(() => expect(database.saveBloodRequestRecord).toHaveBeenCalledOnce());
  const saved = vi.mocked(database.saveBloodRequestRecord).mock.calls[0][0].values;
  expect(saved).not.toHaveProperty('stemCellDonorAbo');
  expect(saved).not.toHaveProperty('stemCellDonorRh');
  expect(saved).not.toHaveProperty('stemCellDonorAntigens');
});

it('печатает каждую страницу заявки с поворотом и восстанавливает отображение', () => {
  const printClasses: string[][] = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => (callback(0), 1));
  vi.spyOn(window, 'print').mockImplementation(() => {
    expect(document.documentElement.dataset.requestPrintRotated).toBe('true');
    printClasses.push(
      [...document.body.classList].filter((className) =>
        className.startsWith('print-component-request-page-'),
      ),
    );
    window.dispatchEvent(new Event('afterprint'));
  });
  render(<ComponentRequest />);
  fireEvent.click(screen.getByRole('button', { name: 'Печать страницы 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Печать страницы 2' }));
  expect(printClasses).toEqual([
    ['print-component-request-page-1'],
    ['print-component-request-page-2'],
  ]);
  expect(document.documentElement.dataset.requestPrintRotated).toBeUndefined();
  expect(document.body.classList.contains('print-component-request-page-1')).toBe(false);
  expect(document.body.classList.contains('print-component-request-page-2')).toBe(false);
  vi.restoreAllMocks();
});

it('позволяет выбрать и отредактировать контактный телефон подразделения из выпадающего списка', async () => {
  vi.mocked(database.listSavedOptions).mockImplementation(async (category) =>
    category === 'componentRequestDepartmentPhone' ? [{ id: 1, value: '+79001112233' }] : [],
  );
  render(<ComponentRequest />);
  fireEvent.click(
    screen.getByRole('button', { name: 'Подразделение, сроки и форма оказания помощи' }),
  );
  const dialog = within(screen.getByRole('dialog'));
  const phoneInput = dialog.getByRole('textbox', { name: 'Контактный телефон подразделения' });
  const dropdown = dialog.getByRole('button', {
    name: 'Показать сохранённые варианты: Контактный телефон подразделения',
  });
  fireEvent.click(dropdown);
  fireEvent.click(await dialog.findByRole('button', { name: '+79001112233' }));
  expect((phoneInput as HTMLInputElement).value).toBe('+79001112233');

  fireEvent.change(phoneInput, { target: { value: '+79009998877' } });
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: true, cancelable: true }));
  expect(screen.getByText('+79009998877')).toBeTruthy();
  expect(database.rememberSavedOption).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /^Сохранить$/ }));
  await waitFor(() =>
    expect(database.rememberSavedOption).toHaveBeenCalledWith(
      'componentRequestDepartmentPhone',
      '+79009998877',
    ),
  );
});
