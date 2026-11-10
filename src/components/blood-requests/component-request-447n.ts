// Codes and indications for Appendix No. 17, completed under Appendix No. 18
// to Ministry of Health Order No. 447n of 18 May 2026.
export const COMPONENT_CODES = {
  erythrocytes: [
    'ЭВ-УЛС',
    'ЭВ-Л',
    'ЭВ-ЛА',
    'ЭВ-УДСО',
    'ЭВ-ЛО',
    'ЭВ-ЛАО',
    'ОЭ',
    'ОЭ-О',
    'ЭВ-РО',
    'ЭВ-РОО',
  ],
  platelets: [
    'КТ-ЛП',
    'КТ-ЛПП',
    'КТ-ЛПО',
    'КТ-ЛПДР',
    'КТ-ЛППДР',
    'КТ-ЛАПДР',
    'КТ-ЛАДР',
    'КТ-ЛПДРО',
    'КТ-ЛАДРО',
    'КТ-ЛПА',
    'КТ-ЛАП',
    'КТ-ЛКР',
    'КТ-КР',
    'КТ-ЛПАО',
  ],
  plasma: ['СЗП', 'ПП', 'ППП', 'ЛП'],
  cryoprecipitate: ['КРИО', 'КРИО-П'],
  cryosupernatant: ['КП'],
  granulocytes: ['ГКО', 'ГК-ПО'],
} as const;

type IndicationOption = { code: string; label: string; type: keyof typeof COMPONENT_CODES };

export const TRANSFUSION_INDICATIONS: IndicationOption[] = [
  { code: '1.1', type: 'erythrocytes', label: 'Анемия в стационаре, Hb < 80 г/л' },
  { code: '1.2', type: 'erythrocytes', label: 'Анемия в дневном стационаре, Hb < 90 г/л' },
  {
    code: '1.3',
    type: 'erythrocytes',
    label: 'Симптомная анемия при аутоиммунной гемолитической анемии',
  },
  { code: '1.4', type: 'erythrocytes', label: 'Врожденная гемолитическая анемия, Hb < 100 г/л' },
  { code: '2.1', type: 'platelets', label: 'Тромбоциты < 20 × 10⁹/л, инвазивное вмешательство' },
  { code: '2.2', type: 'platelets', label: 'Тромбоциты < 50 × 10⁹/л, операция' },
  { code: '2.3', type: 'platelets', label: 'Тромбоциты < 70 × 10⁹/л, высокий риск кровотечения' },
  { code: '2.4', type: 'platelets', label: 'Тромбоциты < 80 × 10⁹/л, эпидуральная анестезия' },
  { code: '2.5', type: 'platelets', label: 'Тромбоциты < 100 × 10⁹/л, нейрохирургия' },
  {
    code: '2.6',
    type: 'platelets',
    label: 'Тромбоциты < 50 × 10⁹/л, острый промиелоцитарный лейкоз',
  },
  { code: '2.7', type: 'platelets', label: 'Тромбоциты < 10 × 10⁹/л' },
  { code: '2.8', type: 'platelets', label: 'Геморрагический синдром' },
  { code: '3.1', type: 'cryoprecipitate', label: 'Фибриноген < 1,5 г/л при кровотечении' },
  { code: '3.2', type: 'cryoprecipitate', label: 'Фибриноген < 1 г/л' },
  { code: '4.1', type: 'plasma', label: 'Фибриноген < 1,5 г/л при кровотечении' },
  { code: '4.2', type: 'plasma', label: 'Фибриноген < 1 г/л' },
  {
    code: '4.3',
    type: 'plasma',
    label: 'Активность факторов свертывания ≤ 50%, нет концентрата фактора',
  },
  { code: '5', type: 'cryosupernatant', label: 'ТТП или ингибитор фактора VIII' },
  { code: '6', type: 'granulocytes', label: 'Нейтрофилы < 0,5 × 10⁹/л' },
];

export const INDIVIDUAL_SELECTION_INDICATIONS = [
  { code: '1', label: 'Гемолитические посттрансфузионные осложнения' },
  { code: '2', label: 'Беременность с признаками гемолитической болезни новорожденного' },
  { code: '3', label: 'Аллоиммунные антитела к эритроцитам' },
  { code: '4', label: 'Аутоиммунные антитела к эритроцитам' },
  { code: '5', label: 'Положительные пробы на индивидуальную совместимость' },
  { code: '6', label: 'Множественные трансфузии' },
  { code: '7', label: 'Возраст до 4 месяцев' },
  { code: '8', label: 'Две и более безрезультатные трансфузии тромбоцитов' },
] as const;

export const componentTypeForCode = (code: string) =>
  (
    Object.entries(COMPONENT_CODES) as Array<[keyof typeof COMPONENT_CODES, readonly string[]]>
  ).find(([, codes]) => codes.includes(code.trim().toUpperCase()))?.[0] ?? null;

export const indicationOptionsForComponent = (code: string, group: string) => {
  const type = componentTypeForCode(code);
  if (type) return TRANSFUSION_INDICATIONS.filter((item) => item.type === type);
  if (group === 'erythrocytes' || group === 'platelets')
    return TRANSFUSION_INDICATIONS.filter((item) => item.type === group);
  if (group === 'plasma-cryo')
    return TRANSFUSION_INDICATIONS.filter((item) =>
      ['plasma', 'cryoprecipitate', 'cryosupernatant'].includes(item.type),
    );
  return TRANSFUSION_INDICATIONS;
};

export const formatRequestDateTime = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[3]}.${match[2]}.${match[1]} ${match[4]}:${match[5]}` : '';
};

export const formatRequestedQuantity = (units: string, volumeMl: string) =>
  [units ? `${units} ед.` : '', volumeMl ? `≈ ${volumeMl} мл` : ''].filter(Boolean).join(', ');
