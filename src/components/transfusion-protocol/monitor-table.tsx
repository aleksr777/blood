import type { ProtocolValues } from './protocol-types';

type Props = {
  values: ProtocolValues;
};

const ValueCell = ({ children }: { children?: string }) => (
  <td>{children && <div className="cell-value monitor-value">{children}</div>}</td>
);

export const MonitorTable = ({ values }: Props) => (
  <table className="monitor-table">
    <tbody>
      <tr className="monitor-header">
        <th>Трансфузии компонентов крови</th>
        <th>АД (мм рт.ст.)</th>
        <th>Частота пульса (уд/мин)</th>
        <th>Температура (°C)</th>
        <th>Диурез, цвет мочи</th>
      </tr>
      <tr className="monitor-row">
        <th>Перед началом переливания</th>
        <ValueCell>{values.beforeBp}</ValueCell>
        <ValueCell>{values.beforePulse}</ValueCell>
        <ValueCell>{values.beforeTemperature}</ValueCell>
        <ValueCell>{values.beforeUrine}</ValueCell>
      </tr>
      <tr className="monitor-row">
        <th>Через 1 час после переливания</th>
        <ValueCell>{values.hour1Bp}</ValueCell>
        <ValueCell>{values.hour1Pulse}</ValueCell>
        <ValueCell>{values.hour1Temperature}</ValueCell>
        <ValueCell>{values.hour1Urine}</ValueCell>
      </tr>
      <tr className="monitor-row">
        <th>Через 2 часа после переливания</th>
        <ValueCell>{values.hour2Bp}</ValueCell>
        <ValueCell>{values.hour2Pulse}</ValueCell>
        <ValueCell>{values.hour2Temperature}</ValueCell>
        <ValueCell>{values.hour2Urine}</ValueCell>
      </tr>
    </tbody>
  </table>
);
