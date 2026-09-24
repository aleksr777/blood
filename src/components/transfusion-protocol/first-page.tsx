import { LabeledCell, SectionTitle, TextField } from './form-controls';

export const FirstPage = () => (
  <section className="sheet sheet--first" aria-label="Первая страница протокола трансфузии">
    <div className="legal-note">
      <div>Приложение N 11 к Порядку оказания медицинской помощи населению по профилю «трансфузиология»,</div>
      <div>утвержденному приказом Министерства здравоохранения Российской Федерации от 28 октября 2020 г. N 1170н</div>
    </div>

    <table className="protocol-table">
      <tbody>
        <tr>
          <th className="document-title" colSpan={6}>
            ПРОТОКОЛ ТРАНСФУЗИИ
          </th>
        </tr>
        <tr className="row-top-data">
          <LabeledCell
            colSpan={2}
            className="w-30"
            label="Фамилия, имя, отчество (при наличии) реципиента"
          />
          <LabeledCell colSpan={2} className="w-31" label="Дата и время подачи заявки" />
          <LabeledCell colSpan={2} className="w-39" label="Дата трансфузии" />
        </tr>
        <tr className="row-top-data">
          <LabeledCell colSpan={2} label="Отделение" />
          <LabeledCell colSpan={2} label="N и/б" />
          <td colSpan={2}>
            <div className="stacked-field">
              <label>Время начала трансфузии</label>
              <TextField label="Время начала трансфузии" />
            </div>
            <div className="stacked-field stacked-field--second">
              <label>Время окончания трансфузии</label>
              <TextField label="Время окончания трансфузии" />
            </div>
          </td>
        </tr>

        <SectionTitle>Данные медицинского обследования реципиента</SectionTitle>
        <tr>
          <LabeledCell colSpan={4} className="span-4" label="Группа крови реципиента AB0:" />
          <LabeledCell colSpan={2} className="span-2" label="Резус-принадлежность" />
        </tr>
        <tr>
          <LabeledCell colSpan={4} className="span-4" label="Антигены C, c, E, e, K" />
          <LabeledCell colSpan={2} className="span-2" label="Аллоиммунные антитела" />
        </tr>

        <SectionTitle>Показания к трансфузии</SectionTitle>
        <tr className="row-large-input">
          <td colSpan={6}>
            <TextField multiline label="Показания к трансфузии" />
          </td>
        </tr>

        <SectionTitle>Анамнез реципиента</SectionTitle>
        <tr className="row-history">
          <LabeledCell colSpan={2} centered label="Трансфузии компонентов крови в анамнезе" />
          <LabeledCell colSpan={2} centered label="Реакции и осложнения на трансфузии в анамнезе" />
          <LabeledCell colSpan={2} centered label="Трансфузии по индивидуальному подбору" />
        </tr>

        <SectionTitle>Данные о донорской крови или ее компоненте</SectionTitle>
        <tr className="row-donor-main">
          <LabeledCell
            colSpan={3}
            className="span-3"
            label="Наименование компонента донорской крови"
          />
          <LabeledCell
            colSpan={3}
            className="span-3"
            label="Наименование организации, осуществившей заготовку"
          />
        </tr>
        <tr>
          <LabeledCell colSpan={3} className="span-3" label="Группа крови донора AB0:" />
          <LabeledCell
            colSpan={3}
            rowSpan={2}
            className="span-3"
            label="Антигены эритроцитов донора C, c, E, e, K"
          />
        </tr>
        <tr>
          <LabeledCell colSpan={2} label="N единицы компонента крови" />
          <LabeledCell colSpan={1} label="Количество (мл)" />
        </tr>
        <tr>
          <LabeledCell colSpan={3} className="span-3" label="Дата заготовки:" />
          <LabeledCell colSpan={3} className="span-3" label="Срок годности:" />
        </tr>

        <SectionTitle>Результаты индивидуального подбора</SectionTitle>
        <tr>
          <LabeledCell
            colSpan={6}
            className="span-6"
            label="Наименование медицинской организации, осуществившей индивидуальный подбор"
          />
        </tr>
        <tr className="row-final-page1">
          <LabeledCell colSpan={6} className="span-6" label="Дата исследования" />
        </tr>
      </tbody>
    </table>
  </section>
);
