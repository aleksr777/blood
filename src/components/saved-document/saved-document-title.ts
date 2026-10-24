import { formatDate } from '../transfusion-protocol/protocol-types';
import type { SavedDocumentKind } from './saved-document-navigation';

const names: Record<SavedDocumentKind, string> = {
  protocol: 'Протокол трансфузии',
  registration: 'Лист регистрации трансфузий',
  'component-request': 'Заявка в трансфузиологический кабинет',
  'individual-selection-direction': 'Направление на индивидуальный подбор',
};

export const savedDocumentTitle = (kind: SavedDocumentKind, values: Record<string, unknown>) => {
  const date =
    kind === 'protocol'
      ? values.transfusionDate
      : kind === 'registration'
        ? ''
        : values.directionDate;
  return [names[kind], typeof date === 'string' ? formatDate(date) : '']
    .filter(Boolean)
    .join(' · ');
};
