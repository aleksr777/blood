import { Fragment } from 'react';
import styles from './sentence-wrapped-text.module.css';

export const SentenceWrappedText = ({ value }: { value: string }) => (
  <span className={styles.text}>
    {value.split(/(?<=\.)\s+/u).map((sentence, index) => (
      <Fragment key={index}>
        {index > 0 && ' '}
        <span className={styles.sentence}>{sentence}</span>
      </Fragment>
    ))}
  </span>
);
