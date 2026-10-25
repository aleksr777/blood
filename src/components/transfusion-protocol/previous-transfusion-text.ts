import type { ProtocolValues } from './protocol-types';

export const splitPreviousTransfusionText = (values: ProtocolValues) => {
  const text = values.previousTransfusions ?? '';
  const generated = values.previousTransfusionsAutoText?.trim() ?? '';
  const remainder = text.slice(generated.length);
  if (
    !generated ||
    !text.startsWith(generated) ||
    (remainder && !remainder.startsWith('\n') && !remainder.startsWith('\r\n'))
  ) {
    return { generated: '', manual: text };
  }
  return { generated, manual: remainder.replace(/^\r?\n(?:\r?\n)?/u, '') };
};

export const combinePreviousTransfusionText = (generated: string, manual: string) =>
  generated ? `${generated}${manual ? `\n\n${manual}` : ''}` : manual;
