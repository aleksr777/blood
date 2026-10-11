import type { ProtocolValues } from './protocol-types';

type Props = {
  values: ProtocolValues;
  part: 'main' | 'hour1' | 'hour2';
};

const ValueCell = ({ children }: { children?: string }) => (
  <td>{children && <div className="cell-value monitor-value">{children}</div>}</td>
);

const MonitorColGroup = () => (
  <colgroup>
    <col className="monitor-col-period" />
    <col className="monitor-col-bp" />
    <col className="monitor-col-pulse" />
    <col className="monitor-col-temperature" />
    <col className="monitor-col-urine" />
  </colgroup>
);

export const MonitorTable = ({ values, part }: Props) => (
  <table className="monitor-table">
    <MonitorColGroup />
    <tbody>
      {part === 'main' && (
        <>
          <tr className="monitor-header">
            <th>Трансфузии компонентов крови:</th>
            <th>АД (мм рт.ст.):</th>
            <th>
              Частота пульса
              <br />
              (уд/мин):
            </th>
            <th>Температура (°C):</th>
            <th>Диурез, цвет мочи:</th>
          </tr>
          <tr className="monitor-row">
            <th>Перед началом переливания:</th>
            <ValueCell>{values.beforeBp}</ValueCell>
            <ValueCell>{values.beforePulse}</ValueCell>
            <ValueCell>{values.beforeTemperature}</ValueCell>
            <ValueCell>{values.beforeUrine}</ValueCell>
          </tr>
        </>
      )}

      {part === 'hour1' && (
        <tr className="monitor-row">
          <th>Через 1 час после переливания:</th>
          <ValueCell>{values.hour1Bp}</ValueCell>
          <ValueCell>{values.hour1Pulse}</ValueCell>
          <ValueCell>{values.hour1Temperature}</ValueCell>
          <ValueCell>{values.hour1Urine}</ValueCell>
        </tr>
      )}

      {part === 'hour2' && (
        <tr className="monitor-row">
          <th>Через 2 часа после переливания:</th>
          <ValueCell>{values.hour2Bp}</ValueCell>
          <ValueCell>{values.hour2Pulse}</ValueCell>
          <ValueCell>{values.hour2Temperature}</ValueCell>
          <ValueCell>{values.hour2Urine}</ValueCell>
        </tr>
      )}
    </tbody>
  </table>
);
