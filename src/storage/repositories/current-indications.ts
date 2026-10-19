import type { ProtocolValuesRecord } from '../sqlite/database-types';

const STORAGE_KEY = 'blood:current-indications';

type StoredState = {
  recipientId: number;
  byComponent: Record<string, ProtocolValuesRecord>;
  individualSelectionIndications: string;
  individualSelectionIndicationsSet: boolean;
};

const componentPrefix = (component: string) => {
  if (component === 'erythrocytes') return 'indicationRbc';
  if (component === 'plasma-cryo') return 'indicationPlasma';
  if (component === 'platelets') return 'indicationPlatelet';
  return '';
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
          ? Object.fromEntries(
              Object.entries(values).filter(
                (entry): entry is [string, string] =>
                  typeof entry[1] === 'string',
              ),
            )
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
      individualSelectionIndicationsSet:
        parsed.individualSelectionIndicationsSet === true,
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

export const currentIndicationsForComponent = (
  values: ProtocolValuesRecord,
  component: string,
): ProtocolValuesRecord => {
  const prefix = componentPrefix(component);
  if (!prefix) return {};

  return {
    indicationComponent: component,
    ...Object.fromEntries(
      Object.entries(values).filter(
        ([key]) => key === 'indications' || key.startsWith(prefix),
      ),
    ),
  };
};

export const hasStoredCurrentIndications = (
  recipientId: number,
  component: string,
) => {
  const state = readState();
  return Boolean(
    state &&
      state.recipientId === recipientId &&
      state.byComponent[component],
  );
};

export const readCurrentIndications = (
  recipientId: number,
  component: string,
): ProtocolValuesRecord => {
  const state = readState();
  if (!state || state.recipientId !== recipientId) {
    return { indicationComponent: component };
  }

  return {
    indicationComponent: component,
    ...(state.byComponent[component] ?? {}),
  };
};

export const writeCurrentIndications = (
  recipientId: number,
  component: string,
  values: ProtocolValuesRecord,
) => {
  if (!Number.isFinite(recipientId) || recipientId <= 0 || !componentPrefix(component)) {
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

export const hasStoredCurrentIndividualSelectionIndications = (
  recipientId: number,
) => {
  const state = readState();
  return Boolean(
    state &&
      state.recipientId === recipientId &&
      state.individualSelectionIndicationsSet,
  );
};

export const readCurrentIndividualSelectionIndications = (
  recipientId: number,
) => {
  const state = readState();
  if (
    !state ||
    state.recipientId !== recipientId ||
    !state.individualSelectionIndicationsSet
  ) {
    return '';
  }

  return state.individualSelectionIndications;
};

export const writeCurrentIndividualSelectionIndications = (
  recipientId: number,
  value: string,
) => {
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
