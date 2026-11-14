// Appendix No. 1 to Government Decree No. 641 of 14 May 2025,
// as amended by Decree No. 1148 of 9 September 2026.
// Keep the official code/name pairs together: the printed request uses both.
import { TRANSFUSABLE_COMPONENTS } from '../../domain/transfusable-components';
import { ERYTHROCYTES } from './component-request-catalog-erythrocytes';
import { PLATELETS } from './component-request-catalog-platelets';
import {
  PLASMA,
  CRYOPRECIPITATE,
  CRYOSUPERNATANT,
  GRANULOCYTES,
} from './component-request-catalog-other';

export type ComponentCatalogEntry = { code: string; name: string };

export const COMPONENT_NOMENCLATURE = {
  erythrocytes: ERYTHROCYTES,
  platelets: PLATELETS,
  plasma: PLASMA,
  cryoprecipitate: CRYOPRECIPITATE,
  cryosupernatant: CRYOSUPERNATANT,
  granulocytes: GRANULOCYTES,
} as const;

export const COMPONENT_CODES = Object.fromEntries(
  Object.entries(COMPONENT_NOMENCLATURE).map(([type, entries]) => [
    type,
    entries.map(({ code }) => code),
  ]),
) as { [K in keyof typeof COMPONENT_NOMENCLATURE]: string[] };

const selectableComponents: Record<string, readonly ComponentCatalogEntry[]> =
  TRANSFUSABLE_COMPONENTS;

export const componentCatalogForGroup = (group: string): readonly ComponentCatalogEntry[] =>
  selectableComponents[group] ?? [];
