import { useLayoutEffect, useRef, useState, type PropsWithChildren } from 'react';
import styles from './indications-fields.module.css';

export const IndicationsAutoHeight = ({ children }: PropsWithChildren) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const readyFrameRef = useRef<number | null>(null);
  const initializedRef = useRef(false);
  const [height, setHeight] = useState<number>();
  const [scrollable, setScrollable] = useState(false);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const content = contentRef.current;
    if (!shell || !content) return undefined;

    const updateHeight = (measuredHeight?: number) => {
      // ResizeObserver reports layout dimensions, unlike getBoundingClientRect(),
      // so the modal opening transform does not make the measured height smaller.
      const nextHeight = measuredHeight ?? content.offsetHeight;
      if (nextHeight <= 0) return;

      const maxHeight = Number.parseFloat(window.getComputedStyle(shell).maxHeight);
      setHeight(nextHeight);
      setScrollable(Number.isFinite(maxHeight) && nextHeight > maxHeight + 0.5);

      if (!initializedRef.current) {
        initializedRef.current = true;
        readyFrameRef.current = window.requestAnimationFrame(() => {
          readyFrameRef.current = null;
          setReady(true);
        });
      }
    };

    updateHeight();

    const observer = new ResizeObserver(([entry]) => {
      updateHeight(entry.contentRect.height);
    });
    observer.observe(content);

    const handleViewportResize = () => updateHeight(content.offsetHeight);
    window.addEventListener('resize', handleViewportResize);

    return () => {
      if (readyFrameRef.current !== null) {
        window.cancelAnimationFrame(readyFrameRef.current);
      }
      window.removeEventListener('resize', handleViewportResize);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={shellRef}
      className={styles.resizeShell}
      data-ready={ready}
      data-scrollable={scrollable}
      style={height === undefined ? undefined : { height }}
    >
      <div ref={contentRef} className={styles.resizeContent}>
        {children}
      </div>
    </div>
  );
};
