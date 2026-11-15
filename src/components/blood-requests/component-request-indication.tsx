import { TRANSFUSION_INDICATIONS } from './component-request-447n';
import styles from './component-request-form.module.css';

type Props = { code: string };

export const ComponentRequestIndication = ({ code }: Props) => {
  if (!code) return null;

  const description = TRANSFUSION_INDICATIONS.find((item) => item.code === code)?.label;

  return (
    <>
      <div>{code}</div>
      {description && <span className={styles.indicationDescription}>{description}</span>}
    </>
  );
};
