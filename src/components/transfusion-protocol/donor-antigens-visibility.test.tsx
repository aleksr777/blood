// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DonorFields } from './donor-fields';
import { DonorBlock } from './first-page-blocks-secondary';
import { formatDonorAntigensForComponent } from './donor-model';

afterEach(cleanup);

const donor = {
  componentGroup: 'erythrocytes',
  indicationComponent: 'erythrocytes',
  componentName: 'Эритроцитная взвесь',
  donorAbo: 'A(II)',
  donorRh: 'Rh(+)',
  donorAntigenK: '+',
  donorAntigenC: '-',
};

it('shows donor antigens only for erythrocyte components without removing saved values', () => {
  const { container, rerender } = render(
    <DonorFields values={donor} onChange={vi.fn()} showComponentSelector={false} />,
  );
  const antigenInputs = () =>
    container.querySelectorAll('[data-blood-group-field^="donorAntigen"]');
  expect(screen.getByText('Антигены:')).toBeTruthy();
  expect(antigenInputs()).toHaveLength(7);

  for (const componentGroup of ['platelets', 'plasma-cryo', 'granulocytes', '']) {
    rerender(
      <DonorFields
        values={{ ...donor, componentGroup, indicationComponent: componentGroup }}
        onChange={vi.fn()}
        showComponentSelector={false}
      />,
    );
    expect(screen.queryByText('Антигены:')).toBeNull();
    expect(antigenInputs()).toHaveLength(0);
    expect(screen.getByText('Группа крови AB0')).toBeTruthy();
    expect(screen.getByText('Резус-принадлежность')).toBeTruthy();
  }
  expect(donor.donorAntigenK).toBe('+');
  rerender(<DonorFields values={donor} onChange={vi.fn()} showComponentSelector={false} />);
  expect(antigenInputs()).toHaveLength(7);
});

it('respects explicitly selected group but supports erythrocyte legacy names', () => {
  expect(formatDonorAntigensForComponent(donor)).toBe('C- K+');
  expect(formatDonorAntigensForComponent({ ...donor, componentGroup: 'platelets' })).toBe('');
  expect(formatDonorAntigensForComponent({ ...donor, componentGroup: '' })).toBe('');
  const legacy = {
    componentName: donor.componentName,
    donorAntigenK: donor.donorAntigenK,
    donorAntigenC: donor.donorAntigenC,
  };
  expect(formatDonorAntigensForComponent(legacy)).toBe('C- K+');
});

it('does not print retained donor antigen values for non-erythrocyte components', () => {
  const renderBlock = (group: string) => (
    <table>
      <DonorBlock
        part="blood"
        values={{ ...donor, componentGroup: group, indicationComponent: group }}
        onOpenBlock={() => {}}
      />
    </table>
  );
  const { rerender } = render(renderBlock('erythrocytes'));
  const antigenValue = () =>
    screen.getByText('Антигены эритроцитов донора:').closest('td')?.textContent;
  expect(antigenValue()).toContain('C- K+');
  rerender(renderBlock('platelets'));
  expect(antigenValue()).not.toContain('C- K+');
  rerender(renderBlock('erythrocytes'));
  expect(antigenValue()).toContain('C- K+');
});
