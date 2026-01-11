import {
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Space,
  Typography,
  Upload,
  Avatar,
  message,
  Modal,
} from 'antd'
import { useState, useEffect, useRef } from 'react'
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import styles from './Personal.module.css'
import { User, authService } from '../services/authService'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import { getImageUrl } from '../utils/imageUtils'
import dayjs from 'dayjs'

const { TextArea } = Input

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

interface PersonalProps {
  open: boolean
  onClose: () => void
  user?: User | null
  onLoginSuccess?: (user: User) => void
}

export default function Personal({
  open,
  onClose,
  user: propUser,
  onLoginSuccess,
}: PersonalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(propUser || null)
  const [formData, setFormData] = useState({
    name: '',
    brandName: '',
    phone: '',
    birthday: '',
    email: '',
    gender: '',
    address: '',
    aboutMe: '',
    avatar: '',
  })
  const [originalData, setOriginalData] = useState(formData)
  const [avatarFile, setAvatarFile] = useState<UploadFile[]>([])
  const [avatarBase64, setAvatarBase64] = useState<string>('')
  
  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Inject calendar styles dynamically to ensure they apply
  useEffect(() => {
    const styleId = 'personal-datepicker-styles'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement
    
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }
    
    styleElement.textContent = `
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell {
        width: auto !important;
        height: 28px !important;
        padding: 0 !important;
        line-height: 28px !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell-inner {
        width: 28px !important;
        height: 28px !important;
        line-height: 28px !important;
        font-size: 13px !important;
        margin: 0 auto !important;
        border-radius: 4px !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-content tbody tr {
        height: 28px !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-week-panel-row th {
        width: auto !important;
        height: 28px !important;
        padding: 0 4px !important;
        line-height: 28px !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        color: #666 !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-content {
        width: 100% !important;
        padding: 8px !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-body {
        padding: 8px !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-header {
        padding: 8px 12px !important;
        min-height: 40px !important;
        border-bottom: 1px solid #f0f0f0 !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-header-view {
        font-size: 16px !important;
        font-weight: 500 !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-prev-icon,
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-next-icon,
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-super-prev-icon,
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-super-next-icon {
        font-size: 12px !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-panel {
        width: 280px !important;
      }
      
      /* Hide Today button */
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-footer {
        display: none !important;
      }
      
      /* Compact spacing */
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-content table {
        border-collapse: separate !important;
        border-spacing: 0 !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown {
        z-index: 1050 !important;
        max-height: 350px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-panel-container {
        z-index: 1050 !important;
        max-height: 350px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
      }
      
      /* Scrollbar styling - always visible */
      .personalDatePickerDropdown.ant-picker-dropdown::-webkit-scrollbar {
        width: 8px !important;
        display: block !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown::-webkit-scrollbar-track {
        background: #f1f1f1 !important;
        border-radius: 4px !important;
        margin: 4px 0 !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown::-webkit-scrollbar-thumb {
        background: #c1c1c1 !important;
        border-radius: 4px !important;
        min-height: 20px !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8 !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-panel-container::-webkit-scrollbar {
        width: 8px !important;
        display: block !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-panel-container::-webkit-scrollbar-track {
        background: #f1f1f1 !important;
        border-radius: 4px !important;
        margin: 4px 0 !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-panel-container::-webkit-scrollbar-thumb {
        background: #c1c1c1 !important;
        border-radius: 4px !important;
        min-height: 20px !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-panel-container::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8 !important;
      }
      
      /* Firefox scrollbar */
      .personalDatePickerDropdown.ant-picker-dropdown {
        scrollbar-width: thin !important;
        scrollbar-color: #c1c1c1 #f1f1f1 !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-panel-container {
        scrollbar-width: thin !important;
        scrollbar-color: #c1c1c1 #f1f1f1 !important;
      }
      
      /* Today's date - remove default inner border, use accent color for outer border only */
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell-today .ant-picker-cell-inner::before {
        display: none !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell-today .ant-picker-cell-inner {
        border: 1px solid var(--accent-color, #667eea) !important;
        border-radius: 4px !important;
        position: relative !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell-today:not(.ant-picker-cell-selected) .ant-picker-cell-inner {
        border: 1px solid var(--accent-color, #667eea) !important;
        background-color: transparent !important;
        color: inherit !important;
      }
      
      /* Remove any default today styling */
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell-today .ant-picker-cell-inner::after {
        display: none !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell-selected .ant-picker-cell-inner {
        background-color: var(--accent-color, #667eea) !important;
        color: #ffffff !important;
        border-color: var(--accent-color, #667eea) !important;
        border-radius: 4px !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell-selected:hover .ant-picker-cell-inner {
        background-color: var(--accent-color, #667eea) !important;
        color: #ffffff !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell:hover .ant-picker-cell-inner {
        background-color: #f5f5f5 !important;
        border-radius: 4px !important;
      }
      
      .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell-today:hover .ant-picker-cell-inner {
        border-color: var(--accent-color, #667eea) !important;
        background-color: rgba(102, 126, 234, 0.1) !important;
      }
      
      /* Warm theme - Today's date */
      [data-theme="warm"] .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell-today .ant-picker-cell-inner::before {
        display: none !important;
      }
      
      [data-theme="warm"] .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell-today .ant-picker-cell-inner::after {
        display: none !important;
      }
      
      [data-theme="warm"] .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell-today .ant-picker-cell-inner {
        border: 1px solid var(--accent-color, #ae906e) !important;
        border-radius: 4px !important;
        position: relative !important;
      }
      
      [data-theme="warm"] .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell-today:not(.ant-picker-cell-selected) .ant-picker-cell-inner {
        border: 1px solid var(--accent-color, #ae906e) !important;
        background-color: transparent !important;
        color: inherit !important;
      }
      
      [data-theme="warm"] .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell-today:hover .ant-picker-cell-inner {
        border-color: var(--accent-color, #ae906e) !important;
        background-color: rgba(174, 144, 110, 0.1) !important;
      }
      
      [data-theme="warm"] .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell-selected .ant-picker-cell-inner {
        background-color: var(--accent-color, #ae906e) !important;
        color: #ffffff !important;
        border-color: var(--accent-color, #ae906e) !important;
        border-radius: 4px !important;
      }
      
      [data-theme="warm"] .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell-selected:hover .ant-picker-cell-inner {
        background-color: var(--accent-color, #ae906e) !important;
        color: #ffffff !important;
      }
      
      [data-theme="warm"] .personalDatePickerDropdown.ant-picker-dropdown .ant-picker-cell:hover .ant-picker-cell-inner {
        background-color: #faf6ea !important;
        border-radius: 4px !important;
      }
    `
    
    return () => {
      // Cleanup on unmount
      const style = document.getElementById(styleId)
      if (style) {
        style.remove()
      }
    }
  }, [])

  // Load user data when modal opens
  useEffect(() => {
    const loadUser = async () => {
      if (open) {
        const currentUser = propUser || await authService.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          setFormData({
            name: currentUser.name || '',
            brandName: currentUser.brandName || '',
            phone: currentUser.phone || '',
            birthday: currentUser.birthday || '',
            email: currentUser.email || '',
            gender: currentUser.gender || '',
            address: currentUser.address || '',
            aboutMe: currentUser.aboutMe || '',
            avatar: currentUser.avatar || '',
          })
          setOriginalData({
            name: currentUser.name || '',
            brandName: currentUser.brandName || '',
            phone: currentUser.phone || '',
            birthday: currentUser.birthday || '',
            email: currentUser.email || '',
            gender: currentUser.gender || '',
            address: currentUser.address || '',
            aboutMe: currentUser.aboutMe || '',
            avatar: currentUser.avatar || '',
          })
        }
      }
    }
    loadUser()
  }, [open, propUser])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFormData(originalData)
    setIsEditing(false)
    setAvatarFile([])
    setAvatarBase64('')
    // Clean up blob URLs
    if (formData.avatar && formData.avatar.startsWith('blob:')) {
      URL.revokeObjectURL(formData.avatar)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Use base64 avatar if available, otherwise use existing avatar URL
      const avatarToSave = avatarBase64 || formData.avatar
      
      const response = await authService.updateProfile({
        name: formData.name,
        brandName: formData.brandName,
        phone: formData.phone,
        birthday: formData.birthday,
        gender: formData.gender,
        address: formData.address,
        aboutMe: formData.aboutMe,
        avatar: avatarToSave,
      })

      if (response.success && response.user) {
        // Clean up blob URL if it was a temporary one
        if (formData.avatar && formData.avatar.startsWith('blob:')) {
          URL.revokeObjectURL(formData.avatar)
        }
        
        // Update formData with saved avatar (base64 or URL from server)
        const updatedFormData = {
          ...formData,
          avatar: response.user.avatar || avatarBase64 || formData.avatar,
        }
        
        setUser(response.user)
        setFormData(updatedFormData)
        setOriginalData(updatedFormData)
        setIsEditing(false)
        setAvatarBase64('')
        setAvatarFile([])
        onLoginSuccess?.(response.user)
        message.success('Profile updated successfully')
      } else {
        message.error(response.message || 'Failed to update profile')
      }
    } catch (error) {
      message.error('An error occurred while updating profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange: UploadProps['onChange'] = (info) => {
    // Get file from different possible locations
    const file = 
      info.file.originFileObj || 
      (info.file as any).originFileObj || 
      (info.file as any)
    
    // Check if it's actually a File object
    if (file && file instanceof File) {
      // Validate file type
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG file!')
        return
      }
      // Validate file size
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        message.error('Image must smaller than 2MB!')
        return
      }
      
      // Convert to base64 for saving and preview
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setAvatarBase64(base64String)
        // Use base64 for preview (works better than blob URL)
        setFormData({ ...formData, avatar: base64String })
      }
      reader.onerror = () => {
        message.error('Failed to read image file')
      }
      reader.readAsDataURL(file)
      
      // Update file list for Upload component
      setAvatarFile([info.file])
    } else if (info.fileList && info.fileList.length > 0) {
      // Fallback: try to get file from fileList
      const fileFromList = info.fileList[0].originFileObj
      if (fileFromList && fileFromList instanceof File) {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = reader.result as string
          setAvatarBase64(base64String)
          setFormData({ ...formData, avatar: base64String })
        }
        reader.readAsDataURL(fileFromList)
        setAvatarFile(info.fileList)
      }
    }
  }

  const beforeUpload = (file: File) => {
    // Return false to prevent auto upload, we'll handle it manually in onChange
    return false
  }

  // Handle password change
  const handlePasswordChange = async () => {
    // Validate passwords
    if (!newPassword.trim()) {
      message.error('Please enter a new password')
      return
    }

    if (newPassword.length < 6) {
      message.error('Password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      message.error('Passwords do not match')
      return
    }

    setPasswordLoading(true)
    try {
      const response = await authService.changePassword(newPassword)
      if (response.success) {
        message.success('Password changed successfully')
        setShowPasswordModal(false)
        setNewPassword('')
        setConfirmPassword('')
      } else {
        message.error(response.message || 'Failed to change password')
      }
    } catch (error) {
      message.error('An error occurred while changing password')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Check if user is local auth user (can change password)
  const isLocalAuthUser = user?.authProvider === 'local' || !user?.authProvider

  const renderField = (
    label: string,
    value: string,
    fieldName: keyof typeof formData,
    isTextArea = false
  ) => {
    if (isEditing) {
      if (fieldName === 'birthday') {
        return (
          <DatePicker
            size="large"
            style={{ width: '100%' }}
            value={formData.birthday ? dayjs(formData.birthday) : null}
            onChange={(date) =>
              setFormData({ ...formData, birthday: date ? date.format('YYYY-MM-DD') : '' })
            }
            format="YYYY-MM-DD"
            getPopupContainer={(trigger) => trigger.parentElement || document.body}
            popupClassName="personalDatePickerDropdown"
          />
        )
      }
      if (fieldName === 'gender') {
        return (
          <Select
            size="large"
            style={{ width: '100%' }}
            value={formData.gender}
            onChange={(value) => setFormData({ ...formData, gender: value })}
            options={genderOptions}
          />
        )
      }
      if (isTextArea) {
        return (
          <TextArea
            size="large"
            rows={3}
            value={value}
            onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
          />
        )
      }
      return (
        <Input
          size="large"
          value={value}
          onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
        />
      )
    }
    return (
      <Typography.Text className={styles.fieldValue} type="secondary">
        {value || '—'}
      </Typography.Text>
    )
  }

  const handleModalClose = () => {
    // Reset editing state when closing
    if (isEditing) {
      handleCancel()
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={handleModalClose}
      title={
        <div className={styles.modalTitle}>
          <UserOutlined /> Personal Profile
        </div>
      }
      width={1000}
      className={styles.personalModal}
      footer={null}
      centered
    >
      <div className={styles.modalContent}>
        <div className={styles.headerSection}>
          <div className={styles.userInfo}>
            <div className={styles.avatarSection}>
              {isEditing ? (
                <Upload
                  name="avatar"
                  listType="picture-circle"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  onChange={handleAvatarChange}
                  accept="image/jpeg,image/png"
                  maxCount={1}
                >
                  {formData.avatar && !formData.avatar.startsWith('data:') ? (
                    <img src={getImageUrl(formData.avatar)} alt="avatar" className={styles.avatarImage} />
                  ) : formData.avatar && formData.avatar.startsWith('data:') ? (
                    <img src={formData.avatar} alt="avatar" className={styles.avatarImage} />
                  ) : user?.avatar ? (
                    <img src={getImageUrl(user.avatar)} alt="avatar" className={styles.avatarImage} />
                  ) : (
                    <div>
                      <UserOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              ) : (
                <Avatar
                  size={106}
                  src={getImageUrl(user?.avatar || formData.avatar)}
                  className={styles.avatar}
                >
                  {user?.name ? user.name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'U'}
                </Avatar>
              )}
            </div>
            <div className={styles.nameSection}>
              <Typography.Title level={1} className={styles.userName}>
                {isEditing ? (
                  <Input
                    size="large"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Name"
                    className={styles.nameInput}
                  />
                ) : (
                  user?.name || formData.name || 'User'
                )}
              </Typography.Title>
              <Typography.Text className={styles.brandName}>
                {isEditing ? (
                  <Input
                    size="large"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="Brand name"
                    className={styles.brandInput}
                  />
                ) : (
                  user?.brandName || formData.brandName || 'Brand name'
                )}
              </Typography.Text>
            </div>
          </div>
          <div className={styles.editButtonSection}>
            {isEditing ? (
              <Space>
                <Button
                  icon={<CloseOutlined />}
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={loading}
                >
                  Save
                </Button>
              </Space>
            ) : (
              <Space direction="vertical" size="middle">
                <Button icon={<EditOutlined />} onClick={handleEdit}>
                  Edit
                </Button>
                {isLocalAuthUser && (
                  <Button 
                    icon={<LockOutlined />} 
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Change Password
                  </Button>
                )}
              </Space>
            )}
          </div>
        </div>

        <Row gutter={[24, 24]} className={styles.cardRow}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className={styles.infoCard}>
              <Typography.Title level={5} className={styles.cardTitle}>
                Phone number
              </Typography.Title>
              {renderField('Phone number', formData.phone, 'phone')}
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className={styles.infoCard}>
              <Typography.Title level={5} className={styles.cardTitle}>
                Birthday
              </Typography.Title>
              {renderField('Birthday', formData.birthday, 'birthday')}
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className={styles.infoCard}>
              <Typography.Title level={5} className={styles.cardTitle}>
                E-mail
              </Typography.Title>
              <Typography.Text className={styles.fieldValue} type="secondary">
                {user?.email || formData.email || '—'}
              </Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className={styles.infoCard}>
              <Typography.Title level={5} className={styles.cardTitle}>
                Gender
              </Typography.Title>
              {renderField('Gender', formData.gender, 'gender')}
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12}>
            <Card className={styles.infoCard}>
              <Typography.Title level={5} className={styles.cardTitle}>
                Address
              </Typography.Title>
              {renderField('Address', formData.address, 'address')}
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12}>
            <Card className={styles.infoCard}>
              <Typography.Title level={5} className={styles.cardTitle}>
                About me
              </Typography.Title>
              {renderField('About me', formData.aboutMe, 'aboutMe', true)}
            </Card>
          </Col>
        </Row>

        {/* Change Password Modal */}
        <Modal
          title="Change Password"
          open={showPasswordModal}
          onOk={handlePasswordChange}
          onCancel={() => {
            setShowPasswordModal(false)
            setNewPassword('')
            setConfirmPassword('')
          }}
          confirmLoading={passwordLoading}
          okText="Change Password"
          cancelText="Cancel"
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Typography.Text strong>New Password</Typography.Text>
              <Input.Password
                size="large"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                style={{ marginTop: 8 }}
              />
              <Typography.Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
                Password must be at least 6 characters long
              </Typography.Text>
            </div>
            <div>
              <Typography.Text strong>Confirm Password</Typography.Text>
              <Input.Password
                size="large"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                style={{ marginTop: 8 }}
                onPressEnter={handlePasswordChange}
              />
            </div>
          </Space>
        </Modal>
      </div>
    </Modal>
  )
}

