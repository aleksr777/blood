import type { ComponentProps } from 'react';
import { BoundedNumberInput } from '../bounded-number-input/bounded-number-input';

type Props = Omit<ComponentProps<typeof BoundedNumberInput>, 'step'>;

export const BoundedIntegerInput = (props: Props) => <BoundedNumberInput {...props} step="1" />;
