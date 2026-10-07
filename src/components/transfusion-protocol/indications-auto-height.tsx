import { useLayoutEffect, useRef, useState, type PropsWithChildren } from 'react';
import styles from './indications-fields.module.css';

export const IndicationsAutoHeight = ({ children }: PropsWithChildren) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return undefined;

    const updateHeight = () => setHeight(content.getBoundingClientRect().height);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(content);
    const frame = window.requestAnimationFrame(() => setReady(true));

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className={styles.resizeShell}
      data-ready={ready}
      style={height === undefined ? undefined : { height }}
    >
      <div ref={contentRef} className={styles.resizeContent}>
        {children}
      </div>
    </div>
  );
};
