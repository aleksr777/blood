import { Choice, OtherChoice, type IndicationProps } from './indication-controls';

export const GRANULOCYTE_NEUTROPHIL_INDICATION =
  'Абсолютное количество нейтрофилов менее 0,5 × 10⁹/л.';

export const GranulocyteIndications = ({ values, onChange }: IndicationProps) => {
  const checked = values.indicationGranulocyteNeutrophilsLow === '1';

  return (
    <>
      <Choice
        type="checkbox"
        name="indicationGranulocyteNeutrophilsLow"
        checked={checked}
        onChange={() => onChange({ indicationGranulocyteNeutrophilsLow: checked ? '' : '1' })}
      >
        {GRANULOCYTE_NEUTROPHIL_INDICATION}
      </Choice>
      <OtherChoice
        checked={values.indicationGranulocyteOther === '1'}
        text={values.indicationGranulocyteOtherText ?? ''}
        name="indicationGranulocyteOther"
        label="Другие показания"
        onChange={onChange}
      />
    </>
  );
};
