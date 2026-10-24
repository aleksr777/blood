import { useLayoutEffect, useRef, useState, type PropsWithChildren } from 'react';
import { useRevealMotion } from './use-reveal-motion';
import styles from './animated-reveal.module.css';

export const AnimatedReveal = ({
  open,
  contentKey,
  children,
}: PropsWithChildren<{
  open: boolean;
  contentKey?: string | number;
}>) => {
  const [present, setPresent] = useState(open);
  const root = useRef<HTMLDivElement>(null);
  const lastChildren = useRef(children);
  if (open) lastChildren.current = children;
  useLayoutEffect(() => {
    if (open) setPresent(true);
  }, [open]);
  useRevealMotion(root, { open, present, contentKey }, () => setPresent(false));
  return (
    <div ref={root} className={styles.reveal} data-animated-reveal aria-hidden={!open}>
      <div className={styles.content}>{present ? lastChildren.current : null}</div>
    </div>
  );
};
