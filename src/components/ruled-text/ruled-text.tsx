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
