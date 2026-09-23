import { TextField } from './form-controls';

export const MonitorTable = () => (
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
        <td>
          <TextField label="АД перед началом переливания" />
        </td>
        <td>
          <TextField label="Частота пульса перед началом переливания" />
        </td>
        <td>
          <TextField label="Температура перед началом переливания" />
        </td>
        <td>
          <TextField label="Диурез и цвет мочи перед началом переливания" />
        </td>
      </tr>
      <tr className="monitor-row">
        <th>Через 1 час после переливания</th>
        <td>
          <TextField label="АД через 1 час после переливания" />
        </td>
        <td>
          <TextField label="Частота пульса через 1 час после переливания" />
        </td>
        <td>
          <TextField label="Температура через 1 час после переливания" />
        </td>
        <td>
          <TextField label="Диурез и цвет мочи через 1 час после переливания" />
        </td>
      </tr>
      <tr className="monitor-row">
        <th>Через 2 часа после переливания</th>
        <td>
          <TextField label="АД через 2 часа после переливания" />
        </td>
        <td>
          <TextField label="Частота пульса через 2 часа после переливания" />
        </td>
        <td>
          <TextField label="Температура через 2 часа после переливания" />
        </td>
        <td>
          <TextField label="Диурез и цвет мочи через 2 часа после переливания" />
        </td>
      </tr>
    </tbody>
  </table>
);
