// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CompatibilityTestsFields } from './compatibility-tests-fields';

vi.mock('./protocol-field-control', () => ({ ProtocolFieldControl: () => null }));
afterEach(cleanup);

const components = [
  ['erythrocytes', true],
  ['plasma-cryo', false],
  ['platelets', false],
  ['', false],
] as const;

it.each(components)('shows the plane test only for erythrocytes: %s', (componentGroup, visible) => {
  const onChange = vi.fn();
  render(
    <CompatibilityTestsFields
      values={{ componentGroup, planeTestResult: 'Несовместимо' }}
      onChange={onChange}
      applyDefaults={false}
    />,
  );
  const group = screen.queryByRole('group', { name: 'Проба на плоскости' });
  expect(Boolean(group)).toBe(visible);
  expect(Boolean(screen.queryByRole('alert'))).toBe(visible);
  if (group) {
    expect(
      (within(group).getByRole('radio', { name: 'Несовместимо' }) as HTMLInputElement).checked,
    ).toBe(true);
  }
  expect(screen.getByRole('group', { name: 'Биологическая проба' })).toBeTruthy();
  expect(onChange).not.toHaveBeenCalled();
});

it.each(components)('does not initialize a hidden plane test: %s', (componentGroup, visible) => {
  const onChange = vi.fn();
  render(<CompatibilityTestsFields values={{ componentGroup }} onChange={onChange} />);
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ biologicalTestResult: 'Совместимо' }),
  );
  const initialized = onChange.mock.calls.some(([changes]) => 'planeTestResult' in changes);
  expect(initialized).toBe(visible);
});

it('retains the entered plane result when its group is hidden and shown again', () => {
  const values = { componentGroup: 'erythrocytes', planeTestResult: 'Несовместимо' };
  const onChange = vi.fn();
  const { rerender } = render(
    <CompatibilityTestsFields values={values} onChange={onChange} applyDefaults={false} />,
  );
  rerender(
    <CompatibilityTestsFields
      values={{ ...values, componentGroup: 'plasma-cryo' }}
      onChange={onChange}
      applyDefaults={false}
    />,
  );
  expect(screen.queryByRole('group', { name: 'Проба на плоскости' })).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
  rerender(<CompatibilityTestsFields values={values} onChange={onChange} applyDefaults={false} />);
  const plane = screen.getByRole('group', { name: 'Проба на плоскости' });
  expect(
    (within(plane).getByRole('radio', { name: 'Несовместимо' }) as HTMLInputElement).checked,
  ).toBe(true);
  expect(onChange).not.toHaveBeenCalled();
});

it.each(['plasma-cryo', 'platelets', ''])(
  'still warns about an incompatible biological test when the plane test is hidden: %s',
  (componentGroup) => {
    render(
      <CompatibilityTestsFields
        values={{
          componentGroup,
          planeTestResult: 'Несовместимо',
          biologicalTestResult: 'Несовместимо',
        }}
        onChange={vi.fn()}
        applyDefaults={false}
      />,
    );
    const warning = screen.getByRole('alert').textContent;
    expect(warning).toContain('биологическая проба — несовместимо');
    expect(warning).not.toContain('проба на плоскости');
  },
);
