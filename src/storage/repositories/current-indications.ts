import type { ProtocolValuesRecord } from '../sqlite/database-types';
import { INDICATION_FIELDS_BY_COMPONENT } from '../indication-fields';

const STORAGE_KEY = 'blood:current-indications';

type StoredState = {
  recipientId: number;
  byComponent: Record<string, ProtocolValuesRecord>;
  individualSelectionIndications: string;
  individualSelectionIndicationsSet: boolean;
};

// A component selection belongs to its document. The shared recipient cache
// contains only indication fields, even when reading data written by older versions.
export const currentIndicationsForComponent = (
  values: ProtocolValuesRecord,
  component: string,
): ProtocolValuesRecord => {
  const fields = INDICATION_FIELDS_BY_COMPONENT[component];
  if (!Array.isArray(fields)) return {};
  return Object.fromEntries(
    fields.flatMap((field) => (typeof values[field] === 'string' ? [[field, values[field]]] : [])),
  );
};

const readState = (): StoredState | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredState>;
    if (
      typeof parsed.recipientId !== 'number' ||
      parsed.recipientId <= 0 ||
      !parsed.byComponent ||
      typeof parsed.byComponent !== 'object' ||
      Array.isArray(parsed.byComponent)
    ) {
      return null;
    }

    const byComponent = Object.fromEntries(
      Object.entries(parsed.byComponent).map(([component, values]) => [
        component,
        values && typeof values === 'object' && !Array.isArray(values)
          ? currentIndicationsForComponent(values, component)
          : {},
      ]),
    );

    return {
      recipientId: parsed.recipientId,
      byComponent,
      individualSelectionIndications:
        typeof parsed.individualSelectionIndications === 'string'
          ? parsed.individualSelectionIndications
          : '',
      individualSelectionIndicationsSet: parsed.individualSelectionIndicationsSet === true,
    };
  } catch (error) {
    console.error('Не удалось прочитать общие показания к трансфузии:', error);
    return null;
  }
};

const writeState = (state: StoredState) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Не удалось сохранить общие показания к трансфузии:', error);
  }
};

export const hasStoredCurrentIndications = (recipientId: number, component: string) => {
  const state = readState();
  return Boolean(state && state.recipientId === recipientId && state.byComponent[component]);
};

export const readCurrentIndications = (
  recipientId: number,
  component: string,
): ProtocolValuesRecord => {
  const state = readState();
  const fields = INDICATION_FIELDS_BY_COMPONENT[component];
  if (!Array.isArray(fields)) return {};
  const emptyValues = Object.fromEntries(fields.map((field) => [field, '']));
  if (!state || state.recipientId !== recipientId) {
    return emptyValues;
  }

  return {
    ...emptyValues,
    ...(state.byComponent[component] ?? {}),
  };
};

export const writeCurrentIndications = (
  recipientId: number,
  component: string,
  values: ProtocolValuesRecord,
) => {
  if (
    !Number.isFinite(recipientId) ||
    recipientId <= 0 ||
    !Array.isArray(INDICATION_FIELDS_BY_COMPONENT[component])
  ) {
    return;
  }

  const current = readState();
  const state: StoredState =
    current && current.recipientId === recipientId
      ? current
      : {
          recipientId,
          byComponent: {},
          individualSelectionIndications: '',
          individualSelectionIndicationsSet: false,
        };

  state.byComponent = {
    ...state.byComponent,
    [component]: currentIndicationsForComponent(values, component),
  };
  writeState(state);
};

export const resetCurrentIndications = (recipientId: number) => {
  if (!Number.isFinite(recipientId) || recipientId <= 0) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  writeState({
    recipientId,
    byComponent: {},
    individualSelectionIndications: '',
    individualSelectionIndicationsSet: false,
  });
};

export const clearCurrentIndicationsForRecipient = (recipientId: number) => {
  const state = readState();
  if (!state || state.recipientId !== recipientId) return false;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Не удалось очистить общие показания удалённого реципиента:', error);
  }

  return true;
};

export const hasStoredCurrentIndividualSelectionIndications = (recipientId: number) => {
  const state = readState();
  return Boolean(
    state && state.recipientId === recipientId && state.individualSelectionIndicationsSet,
  );
};

export const readCurrentIndividualSelectionIndications = (recipientId: number) => {
  const state = readState();
  if (!state || state.recipientId !== recipientId || !state.individualSelectionIndicationsSet) {
    return '';
  }

  return state.individualSelectionIndications;
};

export const writeCurrentIndividualSelectionIndications = (recipientId: number, value: string) => {
  if (!Number.isFinite(recipientId) || recipientId <= 0) return;

  const current = readState();
  const state: StoredState =
    current && current.recipientId === recipientId
      ? current
      : {
          recipientId,
          byComponent: {},
          individualSelectionIndications: '',
          individualSelectionIndicationsSet: false,
        };

  writeState({
    ...state,
    individualSelectionIndications: value,
    individualSelectionIndicationsSet: true,
  });
};
