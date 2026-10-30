import { forwardRef, type ComponentPropsWithoutRef } from 'react';

export const TEXT_INPUT_MAX_LENGTH = 255;
export const TEXTAREA_MAX_LENGTH = 2000;

const textTypes = new Set(['text', 'search', 'email', 'tel', 'url', 'password']);

export const FormInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<'input'>>(
  ({ type = 'text', maxLength, ...props }, ref) => (
    <input
      {...props}
      ref={ref}
      type={type}
      maxLength={maxLength ?? (textTypes.has(type) ? TEXT_INPUT_MAX_LENGTH : undefined)}
    />
  ),
);
FormInput.displayName = 'FormInput';

export const FormTextarea = forwardRef<HTMLTextAreaElement, ComponentPropsWithoutRef<'textarea'>>(
  ({ maxLength = TEXTAREA_MAX_LENGTH, ...props }, ref) => (
    <textarea {...props} ref={ref} maxLength={maxLength} />
  ),
);
FormTextarea.displayName = 'FormTextarea';
