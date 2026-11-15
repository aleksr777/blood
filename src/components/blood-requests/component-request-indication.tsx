import {
  INDIVIDUAL_SELECTION_INDICATIONS,
  TRANSFUSION_INDICATIONS,
} from './component-request-447n';
import styles from './component-request-form.module.css';

type Props = { code: string; kind?: 'transfusion' | 'individualSelection' };

export const ComponentRequestIndication = ({ code, kind = 'transfusion' }: Props) => {
  if (!code) return null;

  const indications =
    kind === 'individualSelection' ? INDIVIDUAL_SELECTION_INDICATIONS : TRANSFUSION_INDICATIONS;
  const description = indications.find((item) => item.code === code)?.label;

  return (
    <>
      <div>{code}</div>
      {description && <span className={styles.indicationDescription}>{description}</span>}
    </>
  );
};
