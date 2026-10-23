import { expect, it } from 'vitest';
import { getBloodGroupMismatch } from './blood-group-validation';
import type { ProtocolValues } from './protocol-types';

it.each<ProtocolValues>([
  { recipientAbo: 'A(II)', donorAbo: 'B(III)' },
  { recipientAbo: 'A(II)', donorAbo: 'B(III)', recipientRh: 'Rh(+)' },
  { recipientAbo: 'A(II)', donorAbo: 'B(III)', donorRh: 'Rh(-)' },
])('warns about ABO differences without requiring complete Rh data: %j', (values) => {
  const warning = getBloodGroupMismatch(values);
  expect(warning.message).toContain('группа крови:');
  expect(warning.message).not.toContain('резус-принадлежность:');
  expect(warning.dismissible).toBe(false);
});

it.each<ProtocolValues>([
  { recipientRh: 'Rh(+)', donorRh: 'Rh(-)' },
  { recipientRh: 'Rh(+)', donorRh: 'Rh(-)', recipientAbo: 'A(II)' },
  { recipientRh: 'Rh(+)', donorRh: 'Rh(-)', donorAbo: 'B(III)' },
  { recipientRh: ' Rh(D)+ ', donorRh: 'Rh(D)-' },
])('warns about Rh differences without requiring complete ABO data: %j', (values) => {
  const warning = getBloodGroupMismatch(values);
  expect(warning.message).toContain('резус-принадлежность:');
  expect(warning.message).not.toContain('группа крови:');
  expect(warning.dismissible).toBe(false);
});

it.each<ProtocolValues>([
  {},
  { recipientAbo: 'A(II)', donorRh: 'Rh(-)' },
  { recipientRh: 'Rh(+)', donorAbo: 'B(III)' },
  { recipientAbo: 'A(II)', donorAbo: 'A(II)' },
  { recipientRh: 'Rh(D)+', donorRh: 'Rh(+)' },
])('does not treat unknown or matching data as a mismatch: %j', (values) => {
  expect(getBloodGroupMismatch(values).message).toBe('');
});

it.each(
  [
    ['erythrocytes', 'O(I)', 'Rh(-)', true],
    ['erythrocytes', 'O(I)', 'Rh(D)-', true],
    ['erythrocytes', 'O(I)', 'Rh(+)', false],
    ['erythrocytes', 'O(I)', '', false],
    ['erythrocytes', 'B(III)', 'Rh(-)', false],
    ['platelets', 'O(I)', 'Rh(-)', false],
    ['plasma-cryo', 'O(I)', 'Rh(-)', false],
    ['', 'O(I)', 'Rh(-)', false],
  ].map(([componentGroup, donorAbo, donorRh, dismissible]) => ({
    componentGroup,
    donorAbo,
    donorRh,
    dismissible,
  })),
)(
  'only makes known O(I) Rh-negative erythrocytes dismissible: $componentGroup $donorAbo $donorRh',
  ({ componentGroup, donorAbo, donorRh, dismissible }) => {
    const warning = getBloodGroupMismatch({
      recipientAbo: 'A(II)',
      recipientRh: 'Rh(+)',
      componentGroup: String(componentGroup),
      donorAbo: String(donorAbo),
      donorRh: String(donorRh),
    });
    expect(warning.message).toContain('не совпадают');
    expect(warning.dismissible).toBe(dismissible);
  },
);

it('recognizes legacy erythrocyte names but respects an explicitly selected component group', () => {
  const values = {
    recipientAbo: 'A(II)',
    donorAbo: 'O(I)',
    donorRh: 'Rh(-)',
    componentName: 'Эритроцитная взвесь',
  };
  expect(getBloodGroupMismatch(values).dismissible).toBe(true);
  expect(getBloodGroupMismatch({ ...values, componentGroup: 'platelets' }).dismissible).toBe(false);
});
