import {
  ExaminationBlock,
  GeneralBlock,
  IndicationsBlock,
} from './first-page-blocks-primary';
import {
  DonorBlock,
  HistoryBlock,
  SelectionBlock,
} from './first-page-blocks-secondary';
import {
  CompatibilityTestsBlock,
  ComplicationsBlock,
  DoctorBlock,
  MonitoringBlock,
} from './second-page-blocks';
import type { ProtocolBlockId, ProtocolPageProps } from './protocol-types';

type Props = ProtocolPageProps & {
  blockIds: ProtocolBlockId[];
};

export const ProtocolBlocks = ({ blockIds, values, onOpenBlock }: Props) => (
  <>
    {blockIds.map((blockId) => {
      const props = { values, onOpenBlock };

      switch (blockId) {
        case 'general':
          return <GeneralBlock key={blockId} {...props} />;
        case 'examination':
          return <ExaminationBlock key={blockId} {...props} />;
        case 'indications':
          return <IndicationsBlock key={blockId} {...props} />;
        case 'history':
          return <HistoryBlock key={blockId} {...props} />;
        case 'donor':
          return <DonorBlock key={blockId} {...props} />;
        case 'selection':
          return <SelectionBlock key={blockId} {...props} />;
        case 'compatibilityTests':
          return <CompatibilityTestsBlock key={blockId} {...props} />;
        case 'complications':
          return <ComplicationsBlock key={blockId} {...props} />;
        case 'monitoring':
          return <MonitoringBlock key={blockId} {...props} />;
        case 'doctor':
          return <DoctorBlock key={blockId} {...props} />;
        default:
          return null;
      }
    })}
  </>
);
