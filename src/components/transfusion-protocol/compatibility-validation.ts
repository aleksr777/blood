import type { ProtocolValues } from './protocol-types';

export const getFailedCompatibilityChecks = (values: ProtocolValues): string[] => {
  const failures: string[] = [];
  const isErythrocytes = values.componentGroup === 'erythrocytes';

  if (values.confirmedRecipientAboResult === 'Не подтверждено') {
    failures.push('группа крови реципиента не подтверждена');
  }

  if (isErythrocytes && values.confirmedDonorAboResult === 'Не подтверждено') {
    failures.push('группа крови донора не подтверждена');
  }

  if (isErythrocytes && values.planeTestResult === 'Несовместимо') {
    failures.push('проба на плоскости — несовместимо');
  }

  if (values.biologicalTestResult === 'Несовместимо') {
    failures.push('биологическая проба — несовместимо');
  }

  return failures;
};

export const getCompatibilityDangerWarning = (values: ProtocolValues) => {
  const failures = getFailedCompatibilityChecks(values);
  if (!failures.length) return '';

  return `Внимание: пробы на совместимость не пройдены.\n\n${failures
    .map((failure) => `• ${failure}`)
    .join(
      '\n',
    )}.\n\nТрансфузия данного компонента недопустима до получения совместимых результатов всех обязательных проб и подтверждения групп крови.`;
};
