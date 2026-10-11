import type { ProtocolValues } from './protocol-types';

export const getBloodGroupMismatch = (values: ProtocolValues) => {
  const recipientAbo = values.recipientAbo?.trim() ?? '';
  const donorAbo = values.donorAbo?.trim() ?? '';

  if (!recipientAbo || !donorAbo || recipientAbo === donorAbo) {
    return { key: '', message: '' };
  }

  return {
    key: `${recipientAbo}|${donorAbo}`,
    message:
      `Внимание: указанные группы крови различаются: реципиент — ${recipientAbo}, ` +
      `донор — ${donorAbo}. Проверьте правильность введённых данных и допустимость трансфузии.`,
  };
};
