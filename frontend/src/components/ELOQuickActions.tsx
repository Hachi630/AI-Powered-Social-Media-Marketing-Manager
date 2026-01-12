import { BookOutlined, RocketOutlined, QuestionCircleOutlined, BulbOutlined, EditOutlined, AimOutlined } from '@ant-design/icons';
import styles from './ELOQuickActions.module.css';

export interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  action: () => void;
}

interface ELOQuickActionsProps {
  onActionSelect: (actionId: string) => void;
  onSendToDashboard?: () => void;
}

export default function ELOQuickActions({ onActionSelect, onSendToDashboard }: ELOQuickActionsProps) {
  const actions: QuickAction[] = [
    {
      id: 'guide',
      icon: <BookOutlined />,
      label: 'New User Guide',
      action: () => onActionSelect('guide'),
    },
    {
      id: 'quick-create',
      icon: <RocketOutlined />,
      label: 'Quick Create',
      action: () => onActionSelect('quick-create'),
    },
    {
      id: 'faq',
      icon: <QuestionCircleOutlined />,
      label: 'FAQ',
      action: () => onActionSelect('faq'),
    },
    {
      id: 'tips',
      icon: <BulbOutlined />,
      label: 'Tips',
      action: () => onActionSelect('tips'),
    },
    {
      id: 'send-dashboard',
      icon: <EditOutlined />,
      label: 'Send to Dashboard',
      action: () => {
        if (onSendToDashboard) {
          onSendToDashboard();
        }
        onActionSelect('send-dashboard');
      },
    },
    {
      id: 'project-guide',
      icon: <AimOutlined />,
      label: 'Project Guide',
      action: () => onActionSelect('project-guide'),
    },
  ];

  return (
    <div className={styles.quickActionsContainer}>
      {actions.map((action) => (
        <div
          key={action.id}
          className={styles.actionCard}
          onClick={action.action}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              action.action();
            }
          }}
        >
          <div className={styles.actionIcon}>{action.icon}</div>
          <p className={styles.actionLabel}>{action.label}</p>
        </div>
      ))}
    </div>
  );
}
