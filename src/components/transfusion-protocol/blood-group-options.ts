export const ABO_OPTIONS = ['O(I)', 'A(II)', 'B(III)', 'AB(IV)'];
export const RH_OPTIONS = ['Rh(+)', 'Rh(-)'];
export const ANTIGEN_OPTIONS = ['+', '-'];

export type BloodGroupTone = 'positive' | 'negative' | 'neutral';

export const normalizeBloodGroupRh = (value?: string) => {
  if (value === 'Rh(D)+' || value === 'Rh(+)') return 'Rh(+)';
  if (value === 'Rh(D)-' || value === 'Rh(-)') return 'Rh(-)';
  return '';
};

export const getBloodGroupTone = (rh?: string): BloodGroupTone => {
  const normalized = normalizeBloodGroupRh(rh);
  if (normalized === 'Rh(-)') return 'negative';
  if (normalized === 'Rh(+)') return 'positive';
  return 'neutral';
};
