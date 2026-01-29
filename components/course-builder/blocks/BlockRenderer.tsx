import { Page, PageType } from '../../../types';
import { TextBlock } from './TextBlock';
import { VideoBlock } from './VideoBlock';
import { EmbedBlock } from './EmbedBlock';
import { QuizBlock } from './QuizBlock';
import { CodeBlock } from './CodeBlock';
import { ImageBlock } from './ImageBlock';
import { DividerBlock } from './DividerBlock';

interface BlockRendererProps {
  page: Page;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (data: Page['data']) => void;
  onDelete: () => void;
}

export function BlockRenderer({
  page,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}: BlockRendererProps) {
  const blockComponents: Record<PageType, React.ComponentType<any>> = {
    text: TextBlock,
    video: VideoBlock,
    embed: EmbedBlock,
    quiz: QuizBlock,
    code: CodeBlock,
    image: ImageBlock,
    divider: DividerBlock
  };

  const BlockComponent = blockComponents[page.type];

  if (!BlockComponent) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
        Unknown block type: {page.type}
      </div>
    );
  }

  return (
    <BlockComponent
      data={page.data}
      isSelected={isSelected}
      onSelect={onSelect}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  );
}
