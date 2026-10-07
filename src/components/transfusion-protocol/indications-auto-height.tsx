import { useLayoutEffect, useRef, useState, type PropsWithChildren } from 'react';
import styles from './indications-fields.module.css';

export const IndicationsAutoHeight = ({ children }: PropsWithChildren) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const readyFrameRef = useRef<number | null>(null);
  const initializedRef = useRef(false);
  const [height, setHeight] = useState<number>();
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return undefined;

    const updateHeight = () => {
      const nextHeight = content.getBoundingClientRect().height;

      // A closed <dialog> has no layout box. Ignore that zero-height
      // measurement and initialize only after the modal becomes visible.
      if (nextHeight <= 0) return;

      setHeight(nextHeight);

      if (!initializedRef.current) {
        initializedRef.current = true;
        readyFrameRef.current = window.requestAnimationFrame(() => {
          readyFrameRef.current = null;
          setReady(true);
        });
      }
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(content);

    return () => {
      if (readyFrameRef.current !== null) {
        window.cancelAnimationFrame(readyFrameRef.current);
      }
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
