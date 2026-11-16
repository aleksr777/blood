import { SavedOptionsField } from './saved-options-field';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export const DepartmentField = ({ value, onChange }: Props) => (
  <SavedOptionsField
    name="department"
    label="Отделение"
    category="departments"
    toggleLabel="Показать ранее введённые отделения"
    departments
    value={value}
    onChange={onChange}
  />
);
