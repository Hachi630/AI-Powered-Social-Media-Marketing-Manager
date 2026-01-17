import { Card } from 'antd';
import { PromptTemplate } from '../constants/promptTemplates';
import styles from './PromptTemplateCard.module.css';

interface PromptTemplateCardProps {
  template: PromptTemplate;
  onClick: (prompt: string) => void;
}

export default function PromptTemplateCard({ template, onClick }: PromptTemplateCardProps) {
  const IconComponent = template.icon;

  const handleClick = () => {
    onClick(template.prompt);
  };

  return (
    <Card
      className={styles.templateCard}
      hoverable
      onClick={handleClick}
      style={{
        borderColor: template.color,
        borderWidth: 2,
        cursor: 'pointer',
      }}
    >
      <div className={styles.cardContent}>
        <div 
          className={styles.iconWrapper}
          style={{ 
            backgroundColor: `${template.color}15`,
            color: template.color,
          }}
        >
          <IconComponent style={{ fontSize: 24 } as React.CSSProperties} />
        </div>
        <div className={styles.textContent}>
          <h3 className={styles.title}>{template.title}</h3>
          <p className={styles.description}>{template.description}</p>
        </div>
      </div>
    </Card>
  );
}
