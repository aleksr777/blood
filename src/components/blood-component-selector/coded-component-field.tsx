import {
  codedComponentOptionCategory,
  formatCodedComponent,
  parseCodedComponent,
  type CodedComponent,
} from '../../domain/coded-component';
import { SavedOptionsField } from '../transfusion-protocol/saved-options-field';
import styles from './blood-component-selector.module.css';

type Props = {
  group: string;
  inputName: string;
  code: string;
  name: string;
  options: readonly CodedComponent[];
  onChange: (component: CodedComponent) => void;
};

export const CodedComponentField = ({ group, inputName, code, name, options, onChange }: Props) => {
  const label = 'Идентификационный код (графа 6)';
  return (
    <>
      <div className={styles.label}>{label}</div>
      <SavedOptionsField
        key={group}
        name={inputName}
        label={label}
        category={codedComponentOptionCategory(group)}
        fixedOptions={options.map(formatCodedComponent)}
        value={formatCodedComponent({ code, name })}
        wrapOptions
        onChange={(value) => onChange(parseCodedComponent(value, options))}
      />
    </>
  );
};
