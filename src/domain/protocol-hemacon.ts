export const normalizeComponentUnitNumber = (value?: string) => (value ?? '').replace(/\D/g, '');

export const getProtocolHemaconWarning = (values: Record<string, string>) => {
  const missing: string[] = [];
  if (!values.componentName?.trim()) missing.push('наименование компонента');
  if (normalizeComponentUnitNumber(values.componentUnitNumber).length !== 14) {
    missing.push('полный номер гемакона (14 цифр)');
  }
  const amount = Number(values.amountMl?.replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) missing.push('объём компонента');
  if (!values.expirationDate?.trim()) missing.push('срок годности');

  return missing.length
    ? `Сохранение и печать протокола недоступны. Заполните данные гемакона: ${missing.join(', ')}.`
    : '';
};
