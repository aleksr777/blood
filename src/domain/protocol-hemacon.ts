export const normalizeComponentUnitNumber = (value?: string) => (value ?? '').replace(/\D/g, '');

export const getProtocolHemaconWarning = (values: Record<string, string>) => {
  const missing: string[] = [];
  if (!values.componentName?.trim()) missing.push('наименование компонента');
  if (normalizeComponentUnitNumber(values.componentUnitNumber).length !== 14) {
    missing.push('полный номер гемакона (14 цифр)');
  }
  if (!values.donorAbo?.trim()) missing.push('группу крови гемакона');

  return missing.length
    ? `Сохранение и печать протокола недоступны. Заполните данные гемакона: ${missing.join(', ')}.`
    : '';
};
