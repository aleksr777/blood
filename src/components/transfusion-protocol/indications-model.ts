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
    items.push(`Острая кровопотеря >${values.indicationBloodLossPercent}% ОЦК`);
  }
  if (yes(values.indicationOngoingBleeding)) items.push('Продолжающееся кровотечение');

  if (values.indicationComponent === 'erythrocytes') {
    if (yes(values.indicationRbcSevereAnemia) || yes(values.indicationRbcReplacement)) {
      items.push('Тяжёлый анемический синдром');
    }
    if (values.indicationRbcThreshold === '70-25') items.push('Hb <70 г/л и Hct <25%');
    if (values.indicationRbcThreshold === 'custom') {
      const hgb = values.indicationRbcHgb?.trim();
      const hct = values.indicationRbcHct?.trim();
      if (hgb || hct) items.push(`Hb <${hgb || '…'} г/л и Hct <${hct || '…'}%`);
    }
    if (yes(values.indicationRbcOther) && values.indicationRbcOtherText?.trim()) {
      items.push(values.indicationRbcOtherText.trim());
    }
  }

  if (values.indicationComponent === 'plasma-cryo') {
    if (yes(values.indicationPlasmaFactorDeficiency)) {
      items.push('Дефицит плазменных факторов свёртывания крови');
    }
    if (yes(values.indicationPlasmaAnticoagulantOverdose)) {
      items.push('Передозировка антикоагулянтов непрямого действия');
    }
    if (yes(values.indicationPlasmaPlasmapheresis)) {
      items.push('Выполнение терапевтического плазмафереза');
    }
    if (yes(values.indicationPlasmaOther) && values.indicationPlasmaOtherText?.trim()) {
      items.push(values.indicationPlasmaOtherText.trim());
    }
  }

  if (values.indicationComponent === 'platelets') {
    if (values.indicationPlateletReason === 'hemorrhagic') {
      items.push('Тромбоцитопения, геморрагический синдром');
    }
    if (values.indicationPlateletReason === 'high-risk') {
      items.push('Тромбоцитопения, высокий риск кровотечения');
    }
    if (yes(values.indicationPlateletOther) && values.indicationPlateletOtherText?.trim()) {
      items.push(values.indicationPlateletOtherText.trim());
    }
  }

  return items.length ? joinIndications(items) : values.indications ?? '';
};
