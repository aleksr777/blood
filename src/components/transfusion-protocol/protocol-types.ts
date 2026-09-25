export type ProtocolBlockId =
  | 'general'
  | 'examination'
  | 'indications'
  | 'history'
  | 'donor'
  | 'selection'
  | 'compatibilityTests'
  | 'complications'
  | 'monitoring'
  | 'doctor';

export type ProtocolValues = Record<string, string>;

export type ProtocolFieldType =
  | 'text'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'number'
  | 'textarea'
  | 'select';

export type ProtocolFieldConfig = {
  name: string;
  label: string;
  type?: ProtocolFieldType;
  options?: string[];
  wide?: boolean;
  step?: string;
};

export type ProtocolBlockSize = 'small' | 'medium' | 'large' | 'xlarge';

export type ProtocolBlockConfig = {
  id: ProtocolBlockId;
  title: string;
  size: ProtocolBlockSize;
  fields: ProtocolFieldConfig[];
};

export type ProtocolPageProps = {
  values: ProtocolValues;
  onOpenBlock: (blockId: ProtocolBlockId) => void;
};

export const formatDate = (value?: string) => {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}.${month}.${year}` : value;
};

export const formatDateTime = (value?: string) => {
  if (!value) return '';
  const [date, time] = value.split('T');
  return [formatDate(date), time].filter(Boolean).join(' ');
};
