import { firstPageBlockConfigs } from './editor-config-first-page';
import { secondPageBlockConfigs } from './editor-config-second-page';
import type { ProtocolBlockConfig, ProtocolBlockId } from './protocol-types';

const blockConfigs = [...firstPageBlockConfigs, ...secondPageBlockConfigs];

export const getProtocolBlockConfig = (blockId: ProtocolBlockId): ProtocolBlockConfig => {
  const config = blockConfigs.find(({ id }) => id === blockId);
  if (!config) throw new Error(`Unknown protocol block: ${blockId}`);
  return config;
};
