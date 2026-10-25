import { firstPageBlockConfigs } from './editor-config-first-page';
import { secondPageBlockConfigs } from './editor-config-second-page';
import type { ProtocolBlockConfig, ProtocolBlockId } from './protocol-types';

const blockConfigs = [...firstPageBlockConfigs, ...secondPageBlockConfigs];

const findBlockConfig = (blockId: ProtocolBlockId): ProtocolBlockConfig => {
  const config = blockConfigs.find(({ id }) => id === blockId);
  if (!config) throw new Error(`Unknown protocol block: ${blockId}`);
  return config;
};

export const isDonorComponentBlock = (blockId: ProtocolBlockId | null) =>
  blockId === 'donor' || blockId === 'indications';

const donorComponentConfig: ProtocolBlockConfig = {
  id: 'donor',
  title: 'Компонент крови и показания к трансфузии',
  size: 'large',
  fields: [
    ...new Map(
      [...findBlockConfig('donor').fields, ...findBlockConfig('indications').fields].map(
        (field) => [field.name, field] as const,
      ),
    ).values(),
  ],
};

export const getProtocolBlockConfig = (blockId: ProtocolBlockId): ProtocolBlockConfig =>
  isDonorComponentBlock(blockId) ? donorComponentConfig : findBlockConfig(blockId);
