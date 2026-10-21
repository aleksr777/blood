import { ExaminationBlock, GeneralBlock, IndicationsBlock } from './first-page-blocks-primary';
import { DonorBlock, HistoryBlock, SelectionBlock } from './first-page-blocks-secondary';
import {
  CompatibilityTestsBlock,
  ComplicationsBlock,
  DoctorBlock,
  MonitoringBlock,
} from './second-page-blocks';
import { getChunkBlockId, getChunkPart, type ProtocolChunkId } from './protocol-pagination';
import type { ProtocolPageProps } from './protocol-types';

type Props = ProtocolPageProps & {
  chunkIds: ProtocolChunkId[];
};

export const ProtocolBlocks = ({ chunkIds, values, onOpenBlock }: Props) => (
  <>
    {chunkIds.map((chunkId) => {
      const blockId = getChunkBlockId(chunkId);
      const part = getChunkPart(chunkId);
      const props = { values, onOpenBlock, part };

      switch (blockId) {
        case 'general':
          return <GeneralBlock key={chunkId} {...props} />;
        case 'examination':
          return <ExaminationBlock key={chunkId} {...props} />;
        case 'indications':
          return <IndicationsBlock key={chunkId} {...props} />;
        case 'history':
          return <HistoryBlock key={chunkId} {...props} />;
        case 'donor':
          return <DonorBlock key={chunkId} {...props} />;
        case 'selection':
          return <SelectionBlock key={chunkId} {...props} />;
        case 'compatibilityTests':
          return <CompatibilityTestsBlock key={chunkId} {...props} />;
        case 'complications':
          return <ComplicationsBlock key={chunkId} {...props} />;
        case 'monitoring':
          return <MonitoringBlock key={chunkId} {...props} />;
        case 'doctor':
          return <DoctorBlock key={chunkId} {...props} />;
        default:
          return null;
      }
    })}
  </>
);
