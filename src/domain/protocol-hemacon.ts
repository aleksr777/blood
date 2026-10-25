export const normalizeComponentUnitNumber = (value?: string) => (value ?? '').replace(/\D/g, '');

const getMissingHemaconFields = (values: Record<string, string>) => {
  const missing: string[] = [];
  if (!values.componentName?.trim()) missing.push('наименование компонента');
  if (normalizeComponentUnitNumber(values.componentUnitNumber).length !== 14) {
    missing.push('полный номер гемакона (14 цифр)');
  }
  if (!values.donorAbo?.trim()) missing.push('группу крови гемакона');

  return missing;
};

export const getProtocolHemaconWarning = (values: Record<string, string>) => {
  const missing = getMissingHemaconFields(values);
  return missing.length
    ? `Сохранение и печать протокола недоступны.\n\nЗаполните данные гемакона:\n\n${missing.map((field) => `• ${field}`).join('\n')}.`
    : '';
};

export const getProtocolNewBlankWarning = (values: Record<string, string>) => {
  const missing = getMissingHemaconFields(values);
  if (!values.recipientName?.trim()) missing.unshift('ФИО реципиента');

  return missing.length
    ? `Создание нового бланка недоступно.\n\nДля автоматического сохранения текущего протокола заполните:\n\n${missing.map((field) => `• ${field}`).join('\n')}.`
    : '';
};
