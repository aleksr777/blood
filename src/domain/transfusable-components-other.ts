// Plasma includes cryosupernatant and cryoprecipitate, but excludes immunospecific plasma.
export const TRANSFUSABLE_PLASMA = [
  { code: 'СЗП', name: 'Свежезамороженная плазма' },
  { code: 'ПП', name: 'Плазма патогенредуцированная' },
  { code: 'ППП', name: 'Плазма пулированная, патогенредуцированная' },
  { code: 'КП', name: 'Криосупернатантная плазма' },
  { code: 'ЛП', name: 'Лиофилизированная плазма' },
  {
    code: 'КРИО',
    name: 'Криопреципитат из единицы донорской крови и (или) её компонентов',
  },
  { code: 'КРИО-П', name: 'Криопреципитат пулированный' },
  { code: 'КРИО-Л', name: 'Криопреципитат лиофилизированный' },
  { code: 'КРИО-ПЛ', name: 'Криопреципитат пулированный лиофилизированный' },
] as const;

export const TRANSFUSABLE_GRANULOCYTES = [
  {
    code: 'ГКО',
    name: 'Концентрат гранулоцитов, полученный методом афереза, облучённый',
  },
  { code: 'ГК-ПО', name: 'Концентрат гранулоцитов пулированный, облучённый' },
] as const;
