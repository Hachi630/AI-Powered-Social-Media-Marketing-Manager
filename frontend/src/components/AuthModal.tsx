import {
  AppleFilled,
  GoogleOutlined,
  MobileOutlined,
  WindowsFilled,
} from '@ant-design/icons'
import { Button, Divider, Input, Modal, Space, Typography } from 'antd'
import styles from './AuthModal.module.css'

interface AuthModalProps {
  open: boolean
  onCancel: () => void
}

export default function AuthModal({ open, onCancel }: AuthModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      width={400}
      className={styles.authModal}
      maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }} // 浅色遮罩，模仿 ChatGPT
    >
      <div className={styles.container}>
        <Typography.Title level={2} className={styles.title}>
          Log in or sign up
        </Typography.Title>
        <Typography.Text className={styles.subtitle}>
          You'll get smarter responses and can upload files, images, and more.
        </Typography.Text>

        <Space direction="vertical" size={12} className={styles.socialButtons}>
          <Button block size="large" icon={<GoogleOutlined />} className={styles.socialBtn}>
            Continue with Google
          </Button>
          <Button block size="large" icon={<AppleFilled />} className={styles.socialBtn}>
            Continue with Apple
          </Button>
          <Button block size="large" icon={<WindowsFilled />} className={styles.socialBtn}>
            Continue with Microsoft
          </Button>
          <Button block size="large" icon={<MobileOutlined />} className={styles.socialBtn}>
            Continue with phone
          </Button>
        </Space>

        <Divider className={styles.divider}>OR</Divider>

        <div className={styles.emailSection}>
          <Input size="large" placeholder="Email address" className={styles.emailInput} />
          <Button type="primary" block size="large" className={styles.continueBtn}>
            Continue
          </Button>
        </div>
      </div>
    </Modal>
  )
}

