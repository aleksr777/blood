import { LabeledCell, SectionTitle, TextField } from './form-controls';

export const SecondPage = () => (
  <section className="sheet sheet--second" aria-label="Вторая страница протокола трансфузии">
    <table className="protocol-table protocol-table--page2">
      <tbody>
        <tr className="row-responsible">
          <LabeledCell colSpan={3} className="span-3" label="Фамилия, имя, отчество (при наличии) ответственного лица" />
          <LabeledCell colSpan={3} className="span-3" label="Заключение (совместимо/несовместимо)" />
        </tr>

        <SectionTitle>Пробы на индивидуальную совместимость в отделении</SectionTitle>
        <tr>
          <LabeledCell colSpan={6} className="span-6" label="Наименования реагентов" />
        </tr>
        <tr>
          <LabeledCell colSpan={4} className="span-4" label="N серии реагента" />
          <LabeledCell colSpan={2} className="span-2" label="Срок годности" />
        </tr>
        <tr className="row-tests">
          <td colSpan={3} className="span-3 cell--centered">
            <div className="cell-label">На плоскости</div>
            <select className="form-control form-control--select" aria-label="Результат пробы на плоскости" defaultValue="">
              <option value="" />
              <option>Совместимо</option>
              <option>Несовместимо</option>
            </select>
          </td>
          <td colSpan={3} className="span-3 cell--centered">
            <div className="cell-label">Биологическая проба</div>
            <select className="form-control form-control--select" aria-label="Результат биологической пробы" defaultValue="">
              <option value="" />
              <option>Совместимо</option>
              <option>Несовместимо</option>
            </select>
          </td>
        </tr>

        <SectionTitle>Реакции и осложнения</SectionTitle>
        <tr className="row-complications">
          <LabeledCell colSpan={3} className="span-3" label="Основные симптомы" />
          <LabeledCell colSpan={3} className="span-3" label="Степень тяжести" />
        </tr>

        <SectionTitle>Наблюдение за состоянием реципиента</SectionTitle>
        <tr>
          <td colSpan={6} className="monitor-wrapper">
            <table className="monitor-table">
              <tbody>
                <tr className="monitor-header">
                  <th className="monitor-label">Трансфузии компонентов крови</th>
                  <th>АД (мм рт.ст.)</th>
                  <th>Частота пульса (уд/мин)</th>
                  <th>Температура (°C)</th>
                  <th>Диурез, цвет мочи</th>
                </tr>
                <tr className="monitor-row">
                  <th>Перед началом переливания</th>
                  <td><TextField label="АД перед началом переливания" /></td>
                  <td><TextField label="Частота пульса перед началом переливания" /></td>
                  <td><TextField label="Температура перед началом переливания" /></td>
                  <td><TextField label="Диурез и цвет мочи перед началом переливания" /></td>
                </tr>
                <tr className="monitor-row">
                  <th>Через 1 час после переливания</th>
                  <td><TextField label="АД через 1 час после переливания" /></td>
                  <td><TextField label="Частота пульса через 1 час после переливания" /></td>
                  <td><TextField label="Температура через 1 час после переливания" /></td>
                  <td><TextField label="Диурез и цвет мочи через 1 час после переливания" /></td>
                </tr>
                <tr className="monitor-row">
                  <th>Через 2 часа после переливания</th>
                  <td><TextField label="АД через 2 часа после переливания" /></td>
                  <td><TextField label="Частота пульса через 2 часа после переливания" /></td>
                  <td><TextField label="Температура через 2 часа после переливания" /></td>
                  <td><TextField label="Диурез и цвет мочи через 2 часа после переливания" /></td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
        <tr className="doctor-row">
          <LabeledCell colSpan={6} className="span-6" label="Врач, осуществивший трансфузию:" />
        </tr>
      </tbody>
    </table>
  </section>
);
