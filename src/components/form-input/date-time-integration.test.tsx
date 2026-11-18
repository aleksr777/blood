// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { PropsWithChildren } from 'react';
import { ProtocolFieldControl } from '../transfusion-protocol/protocol-field-control';
import { RequestEditorModal } from '../blood-requests/request-editor-modal';

vi.mock('../modal/modal', () => ({
  default: ({ children }: PropsWithChildren) => <section>{children}</section>,
}));
afterEach(cleanup);

it('uses separate inputs in the protocol and preserves the other part when clearing', () => {
  const change = vi.fn();
  render(
    <ProtocolFieldControl
      field={{
        name: 'requestDateTime',
        label: 'Дата и время подачи заявки',
        type: 'datetime-local',
      }}
      value="2026-11-18T08:30"
      onChange={change}
    />,
  );
  const group = screen.getByRole('group', { name: 'Дата и время подачи заявки' });
  fireEvent.change(within(group).getByLabelText('Время'), { target: { value: '' } });
  expect(change).toHaveBeenCalledWith('requestDateTime', '2026-11-18', undefined);
});

it('uses separate inputs for both date and time fields of a request', () => {
  const change = vi.fn();
  render(
    <RequestEditorModal
      title="Заявка"
      fields={[
        { name: 'requestDateTime', label: 'Подача заявки', type: 'datetime-local' },
        { name: 'plannedTransfusionDateTime', label: 'Трансфузия', type: 'datetime-local' },
      ]}
      values={{ requestDateTime: '2026-11-18T08:30', plannedTransfusionDateTime: '' }}
      onChange={change}
      onClose={() => {}}
    />,
  );
  const request = screen.getByRole('group', { name: 'Подача заявки' });
  const transfusion = screen.getByRole('group', { name: 'Трансфузия' });
  fireEvent.change(within(request).getByLabelText('Дата'), { target: { value: '' } });
  expect(change).toHaveBeenCalledWith({ requestDateTime: 'T08:30' });
  fireEvent.change(within(transfusion).getByLabelText('Время'), { target: { value: '11:45' } });
  expect(change).toHaveBeenCalledWith({ plannedTransfusionDateTime: 'T11:45' });
});
