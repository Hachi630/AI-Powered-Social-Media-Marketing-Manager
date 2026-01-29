import PromptTemplateCard from './PromptTemplateCard';
import { promptTemplates } from '../constants/promptTemplates';
import styles from './PromptTemplatesGrid.module.css';

interface PromptTemplatesGridProps {
  onTemplateSelect: (prompt: string) => void;
}

export default function PromptTemplatesGrid({ onTemplateSelect }: PromptTemplatesGridProps) {
  return (
    <div className={styles.templatesContainer}>
      {promptTemplates.map((template) => (
        <PromptTemplateCard
          key={template.id}
          template={template}
          onClick={onTemplateSelect}
        />
      ))}
    </div>
  );
}
