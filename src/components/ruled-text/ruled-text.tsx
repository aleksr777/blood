import type { ComponentPropsWithoutRef } from 'react';
import styles from './ruled-text.module.css';

type Props = ComponentPropsWithoutRef<'span'> & { truncate?: boolean };

export const RuledText = ({ children, className = '', truncate = false, ...props }: Props) => (
  <span
    {...props}
    className={[styles.line, truncate ? styles.truncate : '', className].filter(Boolean).join(' ')}
  >
    <span className={styles.value}>{children}</span>
  </span>
);

export const RuledLabel = ({ className = '', ...props }: ComponentPropsWithoutRef<'span'>) => (
  <span {...props} className={[styles.label, className].filter(Boolean).join(' ')} />
);
