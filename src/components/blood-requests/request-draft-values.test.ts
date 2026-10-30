import { expect, it } from 'vitest';
import { restoreRequestDraft } from './request-draft-values';

const blank = () => ({
  requiredComponent: '',
  quantity: '',
  indicationValues: {} as Record<string, string>,
  recipientProfileSnapshot: {} as Record<string, string>,
  autoValues: {} as Record<string, string>,
});

it.each([null, undefined, [], 5, 'broken draft'])(
  'restores a blank for an invalid draft: %j',
  (value) => {
    expect(restoreRequestDraft(blank(), value)).toEqual(blank());
  },
);

it('rejects unexpected fields and invalid types in local or archived request data', () => {
  const restored = restoreRequestDraft(blank(), {
    requiredComponent: 123,
    quantity: '2',
    unexpected: 'value',
    indicationValues: { indicationRbcOngoingBleeding: '1', invalid: true },
    recipientProfileSnapshot: ['not a profile'],
    autoValues: null,
  });
  expect(restored).toEqual({
    ...blank(),
    quantity: '2',
    indicationValues: { indicationRbcOngoingBleeding: '1' },
  });
});

it('keeps historical strings intact and copies maps without mutating the archive snapshot', () => {
  const original = {
    ...blank(),
    requiredComponent: '  ' + 'А'.repeat(300),
    indicationValues: { indications: 'Исходные показания' },
  };
  const restored = restoreRequestDraft(blank(), original);
  expect(restored).toEqual(original);
  restored.indicationValues.indications = 'Исправленные показания';
  expect(original.indicationValues.indications).toBe('Исходные показания');
});
