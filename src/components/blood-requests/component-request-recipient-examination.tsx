import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import { RecipientExaminationSection } from '../transfusion-protocol/recipient-input-sections';

type Props = {
  values: ProtocolValues;
  onChange: (changes: ProtocolValues) => void | Promise<void>;
};

export const ComponentRequestRecipientExamination = ({ values, onChange }: Props) => (
  <RecipientExaminationSection
    title="Группа крови и антигены реципиента"
    values={values}
    showAlloimmuneAntibodies={false}
    onChange={(changes) => void onChange(changes)}
  />
);
