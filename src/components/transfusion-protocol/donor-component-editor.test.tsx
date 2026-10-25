// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SavedDocumentScope } from '../saved-document/saved-document-scope';
import { rememberSavedOption } from '../../storage/repositories/saved-options';
import { ProtocolEditorModal } from './protocol-editor-modal';
import type { ProtocolBlockId } from './protocol-types';

vi.mock('../modal/modal', () => ({
  default: ({
    title,
    children,
    onClose,
  }: {
    title: string;
    children: ReactNode;
    onClose: () => void;
  }) => (
    <section role="dialog" aria-label={title}>
      {children}
      <button onClick={onClose}>Готово</button>
    </section>
  ),
}));
vi.mock('../../storage/repositories/saved-options', () => ({
  loadSavedOptions: vi.fn(async () => []),
  subscribeSavedOptions: () => () => undefined,
  rememberSavedOption: vi.fn(async () => []),
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const original = {
  componentGroup: 'erythrocytes',
  indicationComponent: 'erythrocytes',
  componentName: 'Отмытые эритроциты',
  componentUnitNumber: '76102200045636',
  donorAbo: 'A(II)',
  donorRh: 'Rh(+)',
  donorAntigenK: '−',
  amountMl: '250',
  collectionDate: '2026-10-01',
  expirationDate: '2000-01-01',
  collectionOrganization: 'Станция крови',
  indicationRbcHemicHypoxia: '1',
};
const renderEditor = (blockId: ProtocolBlockId, savedDocument = false) => {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(
    <SavedDocumentScope value={savedDocument}>
      <ProtocolEditorModal
        blockId={blockId}
        values={original}
        savedDocument={savedDocument}
        bloodGroupWarning="Несовпадение группы крови."
        bloodGroupWarningDismissible={false}
        onDismissBloodGroupWarning={vi.fn()}
        componentUnitNumberWarning="Проверьте номер гемакона."
        onDismissComponentUnitNumberWarning={vi.fn()}
        previousTransfusionSuggestion=""
        persistReusableOptions={savedDocument}
        onOpenRecipients={vi.fn()}
        onSelectRecipient={vi.fn()}
        onSave={onSave}
        onClose={onClose}
      />
    </SavedDocumentScope>,
  );
  return { onSave, onClose };
};
const nameInput = () =>
  screen.getByRole('textbox', {
    name: 'Наименование компонента донорской крови',
  }) as HTMLInputElement;

it.each<ProtocolBlockId>(['donor', 'indications'])(
  'preserves both sections when opened through %s',
  (entry) => {
    const { onClose } = renderEditor(entry);
    expect(
      screen.getByRole('dialog', { name: 'Компонент крови и показания к трансфузии' }),
    ).toBeTruthy();
    expect(screen.getAllByRole('group', { name: 'Группа компонентов крови' })).toHaveLength(1);
    expect(nameInput().value).toBe(original.componentName);
    expect(screen.getByText('Несовпадение группы крови.')).toBeTruthy();
    expect(screen.getByText('Проверьте номер гемакона.')).toBeTruthy();
    expect(screen.getByText(/Срок годности гемакона истёк/)).toBeTruthy();
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Количество, мл' }), {
      target: { value: '300' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Признаки гемической гипоксии' }));
    fireEvent.click(screen.getByRole('button', { name: 'Готово' }));
    expect(onClose).toHaveBeenCalledWith(
      expect.objectContaining({ ...original, amountMl: '300', indicationRbcHemicHypoxia: '' }),
    );
  },
);

it('changes the component and indication group together from the single selector', () => {
  const { onSave, onClose } = renderEditor('indications');
  fireEvent.click(screen.getByRole('button', { name: 'Плазма' }));
  expect(onSave).toHaveBeenLastCalledWith({
    componentGroup: 'plasma-cryo',
    indicationComponent: 'plasma-cryo',
    componentName: '',
  });
  expect(nameInput().value).toBe('');
  expect(screen.queryByRole('checkbox', { name: 'Признаки гемической гипоксии' })).toBeNull();
  fireEvent.change(nameInput(), { target: { value: 'Свежезамороженная плазма' } });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Продолжающееся кровотечение' }));
  fireEvent.click(screen.getByRole('button', { name: 'Готово' }));
  expect(onClose).toHaveBeenCalledWith(
    expect.objectContaining({
      componentName: 'Свежезамороженная плазма',
      indicationComponent: 'plasma-cryo',
      indicationPlasmaOngoingBleeding: '1',
      componentUnitNumber: original.componentUnitNumber,
    }),
  );
});

it.each<ProtocolBlockId>(['donor', 'indications'])(
  'keeps archived values isolated when opened through %s',
  (entry) => {
    const { onClose } = renderEditor(entry, true);
    expect(screen.queryByText(/Срок годности гемакона истёк/)).toBeNull();
    fireEvent.change(nameInput(), { target: { value: 'Архивный компонент' } });
    fireEvent.blur(nameInput());
    fireEvent.click(screen.getByRole('button', { name: 'Готово' }));
    expect(rememberSavedOption).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledWith(
      expect.objectContaining({ ...original, componentName: 'Архивный компонент' }),
    );
  },
);
