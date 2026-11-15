// The active platelet checklist is shared by the protocol and selection direction.
export const PLATELET_THRESHOLD_DEFAULT = '50';
export const PLATELET_INDICATION_OPTIONS = [
  ['indicationPlateletHemorrhagicSyndrome', 'Геморрагический синдром.'],
  ['indicationPlateletHighBleedingRisk', 'Высокий риск кровотечения.'],
  ['indicationPlateletInvasiveProcedure', 'Планируется инвазивное медицинское вмешательство.'],
] as const;

// Preserve the original wording in previously saved documents without offering
// obsolete thresholds to users creating or editing the new checklist.
export const LEGACY_PLATELET_INDICATION_OPTIONS = [
  ['indicationPlateletBelow10', 'Количество тромбоцитов менее 10 × 10⁹/л.'],
  [
    'indicationPlateletBelow20Invasive',
    'Количество тромбоцитов менее 20 × 10⁹/л у пациентов с тромбоцитопенией, которым планируется инвазивное медицинское вмешательство.',
  ],
  [
    'indicationPlateletBelow50Apl',
    'Количество тромбоцитов менее 50 × 10⁹/л при остром промиелоцитарном лейкозе.',
  ],
  [
    'indicationPlateletBelow50Surgery',
    'Количество тромбоцитов менее 50 × 10⁹/л при подготовке пациента с тромбоцитопенией к хирургическому вмешательству.',
  ],
  [
    'indicationPlateletBelow70BleedingRisk',
    'Количество тромбоцитов менее 70 × 10⁹/л при высоком риске кровотечения.',
  ],
  [
    'indicationPlateletBelow80Epidural',
    'Количество тромбоцитов менее 80 × 10⁹/л при использовании эпидуральной анестезии.',
  ],
  [
    'indicationPlateletBelow100Neurosurgery',
    'Количество тромбоцитов менее 100 × 10⁹/л у пациента с тромбоцитопенией перед нейрохирургическим вмешательством.',
  ],
] as const;

export const plateletIndicationTexts = (values: Record<string, string>) => {
  const items: string[] = [];
  if (values.indicationPlateletVersion === '2') {
    if (values.indicationPlateletThrombocytopenia === '1') {
      const count = values.indicationPlateletCount ?? PLATELET_THRESHOLD_DEFAULT;
      if (count.trim()) items.push(`Количество тромбоцитов менее ${count.trim()} × 10⁹/л.`);
    }
    for (const [name, label] of PLATELET_INDICATION_OPTIONS) {
      if (values[name] === '1') items.push(label);
    }
  } else {
    for (const [name, label] of LEGACY_PLATELET_INDICATION_OPTIONS) {
      if (values[name] === '1') items.push(label);
    }
    if (values.indicationPlateletHemorrhagicSyndrome === '1')
      items.push('Геморрагический синдром.');
    if (values.indicationPlateletHighBleedingRisk === '1') items.push('Высокий риск кровотечения.');
    if (values.indicationPlateletThrombocytopenia === '1' && values.indicationPlateletCount?.trim())
      items.push(`Тромбоцитопения менее ${values.indicationPlateletCount.trim()} ×10⁹/л.`);
  }
  if (values.indicationPlateletOther === '1' && values.indicationPlateletOtherText?.trim())
    items.push(values.indicationPlateletOtherText.trim());
  return items;
};
