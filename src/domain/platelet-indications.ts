// Exact display order and wording for the platelet indications in the protocol.
export const PLATELET_INDICATION_OPTIONS = [
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
  ['indicationPlateletHemorrhagicSyndrome', 'Геморрагический синдром.'],
] as const;
