import { LabeledCell, SectionTitle } from './form-controls';
import { MonitorTable } from './monitor-table';

export const SecondPage = () => (
  <section className="sheet sheet--second" aria-label="Вторая страница протокола трансфузии">
    <table className="protocol-table">
      <tbody>
        <tr className="row-responsible">
          <LabeledCell
            colSpan={3}
            className="span-3"
            label="Фамилия, имя, отчество (при наличии) ответственного лица"
          />
          <LabeledCell
            colSpan={3}
            className="span-3"
            label="Заключение (совместимо/несовместимо)"
          />
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
          </td>
          <td colSpan={3} className="span-3 cell--centered">
            <div className="cell-label">Биологическая проба</div>
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
            <MonitorTable />
          </td>
        </tr>
        <tr className="doctor-row">
          <LabeledCell colSpan={6} className="span-6" label="Врач, осуществивший трансфузию:" />
        </tr>
      </tbody>
    </table>
  </section>
);
