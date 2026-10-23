import type { ProtocolValues } from './protocol-types';
import { inferBloodComponentGroup } from '../../domain/blood-components';

const normalizeRh = (value?: string) => {
  const normalized = value?.trim() ?? '';

  if (normalized === 'Rh(D)+' || normalized === 'Rh(+)') return 'Rh(+)';
  if (normalized === 'Rh(D)-' || normalized === 'Rh(-)') return 'Rh(-)';

  return normalized;
};

export const getBloodGroupMismatch = (values: ProtocolValues) => {
  const recipientAbo = values.recipientAbo?.trim() ?? '';
  const donorAbo = values.donorAbo?.trim() ?? '';
  const recipientRh = normalizeRh(values.recipientRh);
  const donorRh = normalizeRh(values.donorRh);
  const componentGroup =
    values.componentGroup ||
    values.indicationComponent ||
    inferBloodComponentGroup(values.componentName);

  const aboMismatch = Boolean(recipientAbo && donorAbo && recipientAbo !== donorAbo);
  const rhMismatch = Boolean(recipientRh && donorRh && recipientRh !== donorRh);

  if (!aboMismatch && !rhMismatch) {
    return { key: '', message: '', dismissible: false };
  }

  const differences: string[] = [];

  if (aboMismatch) {
    differences.push(`группа крови: реципиент — ${recipientAbo}, донор — ${donorAbo}`);
  }

  if (rhMismatch) {
    differences.push(`резус-принадлежность: реципиент — ${recipientRh}, донор — ${donorRh}`);
  }

  return {
    key: [
      values.recipientId ?? '',
      values.componentUnitNumber ?? '',
      componentGroup,
      recipientAbo,
      donorAbo,
      recipientRh,
      donorRh,
    ].join('|'),
    dismissible: componentGroup === 'erythrocytes' && donorAbo === 'O(I)' && donorRh === 'Rh(-)',
    message:
      `Внимание: данные реципиента и донора не совпадают — ${differences.join('; ')}. ` +
      'Проверьте правильность введённых данных и допустимость трансфузии.',
  };
};
