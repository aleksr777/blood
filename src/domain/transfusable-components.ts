import { TRANSFUSABLE_ERYTHROCYTES } from './transfusable-components-erythrocytes';
import {
  TRANSFUSABLE_GRANULOCYTES,
  TRANSFUSABLE_PLASMA,
} from './transfusable-components-other';
import { TRANSFUSABLE_PLATELETS } from './transfusable-components-platelets';

// The selectable subset of the statutory nomenclature: 34 names in four groups.
export const TRANSFUSABLE_COMPONENTS = {
  erythrocytes: TRANSFUSABLE_ERYTHROCYTES,
  'plasma-cryo': TRANSFUSABLE_PLASMA,
  platelets: TRANSFUSABLE_PLATELETS,
  granulocytes: TRANSFUSABLE_GRANULOCYTES,
} as const;
