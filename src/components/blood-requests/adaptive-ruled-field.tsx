import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import styles from './individual-selection-direction.module.css';
import { RuledLabel, RuledText } from '../ruled-text/ruled-text';
import { SentenceWrappedText } from '../ruled-text/sentence-wrapped-text';

type AdaptiveRuledFieldProps = {
  label: string;
  value: string;
  minRows?: number;
  wrapSentences?: boolean;
};

export const AdaptiveRuledField = ({
  label,
  value,
  minRows = 1,
  wrapSentences = false,
}: AdaptiveRuledFieldProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const inlineMeasureRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [breakBeforeValue, setBreakBeforeValue] = useState(false);
  const [rowCount, setRowCount] = useState(minRows);

  const updateLayout = useCallback(() => {
    const inlineMeasure = inlineMeasureRef.current;
    const measure = measureRef.current;
    if (!inlineMeasure || !measure) return;

    const lineHeight = Number.parseFloat(window.getComputedStyle(inlineMeasure).lineHeight);
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;

    const inlineHeight = inlineMeasure.scrollHeight;
    const shouldBreakBeforeValue = Boolean(value) && inlineHeight > lineHeight + 0.5;

    setBreakBeforeValue((current) =>
      current === shouldBreakBeforeValue ? current : shouldBreakBeforeValue,
    );

    const measuredHeight = measure.scrollHeight;
    const measuredRows = Math.ceil((measuredHeight - 0.5) / lineHeight);
    const nextRowCount = Math.max(minRows, measuredRows);
    setRowCount((current) => (current === nextRowCount ? current : nextRowCount));
  }, [minRows, value]);

  useLayoutEffect(() => {
    updateLayout();

    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(updateLayout);
    observer.observe(root);

    return () => observer.disconnect();
  }, [breakBeforeValue, label, updateLayout, value]);

  const content = wrapSentences ? <SentenceWrappedText value={value} /> : value;
  const inlineContent = (
    <>
      {label && <span className={styles.adaptiveLabel}>{label}</span>}
      {value && <span className={styles.adaptiveText}> {content}</span>}
    </>
  );

  return (
    <div ref={rootRef} className={styles.adaptiveField}>
      {breakBeforeValue ? (
        <div className={styles.adaptiveMultiline}>
          {label && <div className={styles.adaptiveMultilineLabel}>{label}</div>}
          <div className={styles.adaptiveMultilineValueArea}>
            <span className={styles.adaptiveRules} aria-hidden="true">
              {Array.from({ length: rowCount }, (_, index) => (
                <span key={index} />
              ))}
            </span>
            <div className={styles.adaptiveMultilineValue}>{content}</div>
          </div>
        </div>
      ) : (
        <div className={styles.adaptiveSingleLine}>
          {label && <RuledLabel className={styles.adaptiveSingleLabel}>{label}</RuledLabel>}
          <RuledText className={styles.adaptiveSingleValue}>{value ? content : ' '}</RuledText>
        </div>
      )}

      <div ref={measureRef} className={styles.adaptiveMeasure} aria-hidden="true">
        <span className={styles.adaptiveMeasureValue}>{value ? content : ' '}</span>
      </div>
      <div ref={inlineMeasureRef} className={styles.adaptiveInlineMeasure} aria-hidden="true">
        {inlineContent}
      </div>
    </div>
  );
};
