import styles from './ELOSubOptions.module.css';
import { PresetAnswer } from '../data/presetAnswers';

interface ELOSubOptionsProps {
  options: PresetAnswer[];
  categoryName: string;
  onOptionSelect: (optionId: string) => void;
}

export default function ELOSubOptions({
  options,
  categoryName,
  onOptionSelect,
}: ELOSubOptionsProps) {
  return (
    <div>
      <div style={{ 
        fontSize: '13px', 
        fontWeight: 600, 
        color: '#666', 
        marginBottom: '12px',
        textAlign: 'center'
      }}>
        {categoryName}
      </div>
      <div className={styles.subOptionsContainer}>
        {options.map((option) => (
          <div
            key={option.id}
            className={styles.optionCard}
            onClick={() => onOptionSelect(option.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOptionSelect(option.id);
              }
            }}
          >
            <div className={styles.optionLabel}>{option.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
