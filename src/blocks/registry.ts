import { NODE_TYPE_LABELS } from '../editor/createNode.ts'
import { NODE_TYPE_GROUPS, type NodeType } from '../editor/types.ts'

export type BlockGroupId = keyof typeof NODE_TYPE_GROUPS

export type BlockDef = {
  type: NodeType
  label: string
  group: BlockGroupId
  groupLabel: string
}

export const BLOCK_GROUP_LABELS: Record<BlockGroupId, string> = {
  layout: 'تخطيط',
  content: 'محتوى',
  interaction: 'تفاعل',
}

export const BLOCKS: readonly BlockDef[] = (
  Object.entries(NODE_TYPE_GROUPS) as Array<[BlockGroupId, readonly NodeType[]]>
).flatMap(([group, types]) =>
  types.map((type) => ({
    type,
    label: NODE_TYPE_LABELS[type],
    group,
    groupLabel: BLOCK_GROUP_LABELS[group],
  })),
)

export const BLOCK_GROUPS: Array<{ id: BlockGroupId; label: string; items: BlockDef[] }> = (
  Object.keys(NODE_TYPE_GROUPS) as BlockGroupId[]
).map((id) => ({
  id,
  label: BLOCK_GROUP_LABELS[id],
  items: BLOCKS.filter((block) => block.group === id),
}))

export function getBlock(type: NodeType): BlockDef | undefined {
  return BLOCKS.find((block) => block.type === type)
}
