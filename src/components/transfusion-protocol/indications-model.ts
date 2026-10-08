import type { ProtocolValues } from './protocol-types';

export const INDICATION_COMPONENTS = [
  { value: 'erythrocytes', label: 'Эритроциты' },
  { value: 'plasma-cryo', label: 'Плазма' },
  { value: 'platelets', label: 'Тромбоциты' },
] as const;

const yes = (value?: string) => value === '1';

const joinIndications = (items: string[]) => {
  const text = items.reduce((result, item) => {
    if (!result) return item;
    return `${result}${/[.!?…]$/.test(result) ? ' ' : '. '}${item}`;
  }, '');

  if (!text) return '';
  return /[.!?…]$/.test(text) ? text : `${text}.`;
};

export const formatIndications = (values: ProtocolValues) => {
  const items: string[] = [];

  if (values.indicationBloodLoss === 'custom' && values.indicationBloodLossPercent) {
    items.push(`Острая кровопотеря более ${values.indicationBloodLossPercent}% ОЦК`);
  }
  if (yes(values.indicationOngoingBleeding)) items.push('Продолжающееся кровотечение');

  if (values.indicationComponent === 'erythrocytes') {
    if (yes(values.indicationRbcCirculatoryDisturbances)) {
      items.push('Циркуляторные нарушения');
    }
    if (yes(values.indicationRbcHemicHypoxia)) {
      items.push('Признаки гемической гипоксии');
    }
    if (values.indicationRbcThreshold === '70-25') items.push('Снижение гемоглобина менее 70 г/л и гематокрита менее 25%');
    if (values.indicationRbcThreshold === 'custom') {
      const hgb = values.indicationRbcHgb?.trim();
      const hct = values.indicationRbcHct?.trim();
      if (hgb || hct) items.push(`Снижение гемоглобина менее ${hgb || '…'} г/л и гематокрита менее ${hct || '…'}%`);
    }
    if (yes(values.indicationRbcOther) && values.indicationRbcOtherText?.trim()) {
      items.push(values.indicationRbcOtherText.trim());
    }
  }

  if (values.indicationComponent === 'plasma-cryo') {
    if (yes(values.indicationPlasmaFactorDeficiency)) {
      items.push('Дефицит плазменных факторов свёртывания крови');
    }
    if (yes(values.indicationPlasmaFibrinogenBleeding)) {
      items.push('Фибриноген менее 1,5 г/л при кровотечении');
    }
    if (yes(values.indicationPlasmaFibrinogenLow)) {
      items.push('Фибриноген менее 1 г/л');
    }
    if (yes(values.indicationPlasmaOther) && values.indicationPlasmaOtherText?.trim()) {
      items.push(values.indicationPlasmaOtherText.trim());
    }
  }

  if (values.indicationComponent === 'platelets') {
    if (yes(values.indicationPlateletHemorrhagicSyndrome)) {
      items.push('Геморрагический синдром');
    }
    if (yes(values.indicationPlateletHighBleedingRisk)) {
      items.push('Высокий риск кровотечения');
    }
    if (yes(values.indicationPlateletThrombocytopenia)) {
      const plateletCount = values.indicationPlateletCount?.trim();
      if (plateletCount) {
        items.push(`Тромбоцитопения менее ${plateletCount} ×10⁹/л`);
      }
    }
    if (yes(values.indicationPlateletOther) && values.indicationPlateletOtherText?.trim()) {
      items.push(values.indicationPlateletOtherText.trim());
    }
  }

  return items.length ? joinIndications(items) : values.indications ?? '';
};
