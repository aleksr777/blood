import { describe, expect, it } from 'vitest';
import { formatBloodComponentName } from './blood-components';

describe('component description on request forms', () => {
  it.each([
    ['erythrocytes', 'Эритроциты'],
    ['plasma-cryo', 'Плазма'],
    ['platelets', 'Тромбоциты'],
  ])('prints the selected group %s when no exact name is supplied', (group, label) => {
    expect(formatBloodComponentName('', group)).toBe(label);
  });

  it('keeps an existing exact name instead of replacing it with a group label', () => {
    expect(formatBloodComponentName('Отмытые эритроциты', 'erythrocytes')).toBe(
      'Отмытые эритроциты',
    );
    expect(formatBloodComponentName('Мой компонент')).toBe('Мой компонент');
    expect(formatBloodComponentName('', 'unknown')).toBe('');
  });
});
