import { fireEvent, screen, within } from '@testing-library/react';

export const countGroup = (label: string) => within(screen.getByRole('group', { name: label }));
export const countInput = (label: string) =>
  countGroup(label).getByRole('spinbutton', { name: `Количество: ${label}` }) as HTMLInputElement;
export const countRadio = (label: string, option: string) =>
  countGroup(label).getByRole('radio', { name: option }) as HTMLInputElement;
export const chooseCount = (label: string, option: string) =>
  fireEvent.click(countRadio(label, option));
