import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { TemporalInput } from './temporal-input';

export const TEXT_INPUT_MAX_LENGTH = 255;
export const TEXTAREA_MAX_LENGTH = 2000;

const textTypes = new Set(['text', 'search', 'email', 'tel', 'url', 'password']);

export const FormInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<'input'>>(
  ({ type = 'text', maxLength, ...props }, ref) => {
    if (type === 'date' || type === 'time') {
      return (
        <TemporalInput
          {...props}
          ref={ref}
          type={type === 'date' ? 'date' : 'time'}
          maxLength={maxLength}
        />
      );
    }
    return (
      <input
        {...props}
        ref={ref}
        type={type}
        maxLength={maxLength ?? (textTypes.has(type) ? TEXT_INPUT_MAX_LENGTH : undefined)}
      />
    );
  },
);
FormInput.displayName = 'FormInput';

export const FormCheckbox = forwardRef<
  HTMLInputElement,
  Omit<ComponentPropsWithoutRef<'input'>, 'type'>
>((props, ref) => <FormInput {...props} ref={ref} type="checkbox" />);
FormCheckbox.displayName = 'FormCheckbox';

export const FormSelect = forwardRef<HTMLSelectElement, ComponentPropsWithoutRef<'select'>>(
  (props, ref) => <select {...props} ref={ref} />,
);
FormSelect.displayName = 'FormSelect';

export const FormTextarea = forwardRef<HTMLTextAreaElement, ComponentPropsWithoutRef<'textarea'>>(
  ({ maxLength = TEXTAREA_MAX_LENGTH, ...props }, ref) => (
    <textarea {...props} ref={ref} maxLength={maxLength} />
  ),
);
FormTextarea.displayName = 'FormTextarea';
