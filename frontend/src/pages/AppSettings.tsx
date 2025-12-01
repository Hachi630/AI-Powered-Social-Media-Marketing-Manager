import {
  Button,
  Card,
  Col,
  Modal,
  Row,
  Select,
  Slider,
  Typography,
  message,
} from 'antd'
import { SettingOutlined, ReloadOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import styles from './AppSettings.module.css'
import { useAppSettings } from '../contexts/AppSettingsContext'
import ThemeToggle from '../components/ThemeToggle'

const { Text } = Typography

const fontOptions = [
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: "'ZCOOL KuaiLe', Inter, system-ui, sans-serif", label: 'ZCOOL KuaiLe' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "'Times New Roman', serif", label: 'Times New Roman' },
]

interface AppSettingsProps {
  open: boolean
  onClose: () => void
}

export default function AppSettings({
  open,
  onClose,
}: AppSettingsProps) {
  const { 
    pendingSettings, 
    updatePendingSettings, 
    applySettings,
    resetSettings,
    resetPendingSettings
  } = useAppSettings()

  const handleFontSizeChange = (value: number) => {
    updatePendingSettings({ fontSize: value })
  }

  const handleFontFamilyChange = (value: string) => {
    updatePendingSettings({ fontFamily: value })
  }

  const handleApply = () => {
    applySettings()
    message.success('Settings applied successfully')
    onClose()
  }

  const handleCancel = () => {
    resetPendingSettings()
    onClose()
  }

  const handleReset = () => {
    resetSettings()
    message.success('Settings reset to default')
  }

  const handleModalClose = () => {
    resetPendingSettings()
    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={handleModalClose}
      title={
        <div className={styles.modalTitle}>
          <SettingOutlined /> App Settings
        </div>
      }
      width={800}
      className={styles.settingsModal}
      footer={[
        <Button
          key="reset"
          icon={<ReloadOutlined />}
          onClick={handleReset}
          className={styles.resetButton}
        >
          Reset to Default
        </Button>,
        <Button key="cancel" onClick={handleCancel} icon={<CloseOutlined />}>
          Cancel
        </Button>,
        <Button
          key="apply"
          type="primary"
          onClick={handleApply}
          icon={<CheckOutlined />}
        >
          Apply
        </Button>,
      ]}
      centered
    >
      <div className={styles.modalContent}>
        <Row gutter={[24, 24]}>
          {/* Theme Toggle */}
          <Col xs={24} sm={24} md={12} lg={12}>
            <Card className={styles.settingCard} title="Theme Mode">
              <div className={styles.settingItem}>
                <Text className={styles.settingLabel}>Select Theme</Text>
                <div className={styles.themeToggleWrapper}>
                  <ThemeToggle />
                </div>
                <Text className={styles.settingDescription}>
                  Switch between Classic and Warm themes
                </Text>
              </div>
            </Card>
          </Col>

          {/* Font Size */}
          <Col xs={24} sm={24} md={12} lg={12}>
            <Card className={styles.settingCard} title="Font Size">
              <div className={styles.settingItem}>
                <Text className={styles.settingLabel}>
                  Font Size: {pendingSettings.fontSize}px
                </Text>
                <Slider
                  min={10}
                  max={24}
                  value={pendingSettings.fontSize}
                  onChange={handleFontSizeChange}
                  className={styles.slider}
                />
                <Text className={styles.settingDescription}>
                  Adjust the font size for the application (10px - 24px)
                </Text>
              </div>
            </Card>
          </Col>

          {/* Font Family */}
          <Col xs={24} sm={24} md={12} lg={12}>
            <Card className={styles.settingCard} title="Font Family">
              <div className={styles.settingItem}>
                <Text className={styles.settingLabel}>Font Family</Text>
                <Select
                  value={pendingSettings.fontFamily}
                  onChange={handleFontFamilyChange}
                  options={fontOptions}
                  className={styles.select}
                  style={{ width: '100%' }}
                />
                <Text className={styles.settingDescription}>
                  Choose the font family for the application
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </Modal>
  )
}

