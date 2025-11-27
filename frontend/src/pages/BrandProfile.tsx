import { CloseOutlined, PlusOutlined, UploadOutlined, FileOutlined, FilePdfOutlined, FileExcelOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  Input,
  Layout,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  message,
  Upload,
} from 'antd'
import type { UploadFile } from 'antd'
import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { MELO_LOGO } from '../constants/assets'
import styles from './BrandProfile.module.css'
import { User, authService } from '../services/authService'

const { Content } = Layout

const toneButtons = [
  { key: 'calm', label: 'Calm', color: '#6750a4' },
  { key: 'warm', label: 'Warm', color: '#cab4ff' },
  { key: 'mindful', label: 'Mindful', color: '#b2b2b2' },
]

const initialKnowledgeProducts = ['Lavender Candle', 'Succulent Pot']

const industryOptions = [
  { value: 'home-decor', label: 'Home Decor' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'food', label: 'Food & Restaurant' },
  { value: 'custom', label: '✏️ Custom / Other' },
]

const initialAudience = ['Yoga lovers', 'Interior design enthusiast']

interface BrandProfileProps {
  isLoggedIn: boolean
  onLoginSuccess: (user: User) => void
  onLogout: () => void
  user?: User | null
}

export default function BrandProfile({
  isLoggedIn,
  onLoginSuccess,
  onLogout,
  user: propUser,
}: BrandProfileProps) {
  const [user, setUser] = useState<User | null>(propUser || null)
  const [brandName, setBrandName] = useState('')
  const [industry, setIndustry] = useState('')
  const [selectedTone, setSelectedTone] = useState('calm')
  const [customTone, setCustomTone] = useState('')
  const [showCustomToneInput, setShowCustomToneInput] = useState(false)
  const [audienceTags, setAudienceTags] = useState<string[]>([])
  const [keyword, setKeyword] = useState('')
  const [knowledgeProducts, setKnowledgeProducts] = useState<string[]>([])
  const [showAddProductInput, setShowAddProductInput] = useState(false)
  const [newProduct, setNewProduct] = useState('')
  const [loading, setLoading] = useState(false)
  const [companyDescription, setCompanyDescription] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([])
  const [customIndustry, setCustomIndustry] = useState('')
  const [showCustomIndustryInput, setShowCustomIndustryInput] = useState(false)

  // Load user data on mount and when propUser changes
  useEffect(() => {
    const loadUser = async () => {
      if (isLoggedIn) {
        const currentUser = await authService.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          setBrandName(currentUser.brandName || '')
          // Check if industry is a custom value (not in predefined list)
          const savedIndustry = currentUser.industry || ''
          const isCustomIndustry = savedIndustry && !industryOptions.some((opt) => opt.value === savedIndustry && opt.value !== 'custom')
          if (isCustomIndustry) {
            setIndustry('custom')
            setCustomIndustry(savedIndustry)
            setShowCustomIndustryInput(true)
          } else {
            setIndustry(savedIndustry)
            setCustomIndustry('')
            setShowCustomIndustryInput(false)
          }
          const toneOfVoice = currentUser.toneOfVoice || 'calm'
          // Check if tone is a custom tone (not in predefined list)
          const isCustomTone = !toneButtons.some((tone) => tone.key === toneOfVoice)
          if (isCustomTone && toneOfVoice) {
            setSelectedTone('custom')
            setCustomTone(toneOfVoice)
            setShowCustomToneInput(true)
          } else {
            setSelectedTone(toneOfVoice)
            setCustomTone('')
            setShowCustomToneInput(false)
          }
          setKnowledgeProducts(currentUser.knowledgeProducts || [])
          setAudienceTags(currentUser.targetAudience || [])
        }
      }
    }
    loadUser()
  }, [isLoggedIn, propUser])

  const addAudienceTag = () => {
    if (!keyword.trim()) {
      return
    }
    if (!audienceTags.includes(keyword.trim())) {
      setAudienceTags([...audienceTags, keyword.trim()])
    }
    setKeyword('')
  }

  const removeAudienceTag = (tag: string) => {
    setAudienceTags(audienceTags.filter((item) => item !== tag))
  }

  const handleAddProduct = () => {
    if (newProduct.trim() && !knowledgeProducts.includes(newProduct.trim())) {
      setKnowledgeProducts([...knowledgeProducts, newProduct.trim()])
      setNewProduct('')
      setShowAddProductInput(false)
    }
  }

  const handleRemoveProduct = (productToRemove: string) => {
    setKnowledgeProducts(knowledgeProducts.filter((product) => product !== productToRemove))
  }

  const handleToneSelect = (toneKey: string) => {
    if (toneKey === 'custom') {
      setShowCustomToneInput(true)
      setSelectedTone('custom')
    } else {
      setShowCustomToneInput(false)
      setSelectedTone(toneKey)
      setCustomTone('')
    }
  }

  const handleIndustryChange = (value: string) => {
    setIndustry(value)
    if (value === 'custom') {
      setShowCustomIndustryInput(true)
    } else {
      setShowCustomIndustryInput(false)
      setCustomIndustry('')
    }
  }

  // Get file icon based on file type
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />
    if (ext === 'xlsx' || ext === 'xls') return <FileExcelOutlined style={{ color: '#52c41a', fontSize: 24 }} />
    return <FileOutlined style={{ color: '#1890ff', fontSize: 24 }} />
  }

  // Handle file upload (frontend only - just store file info)
  const handleFileUpload = (file: File) => {
    const newFile: UploadFile = {
      uid: `${Date.now()}-${file.name}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'done',
    }
    setUploadedFiles((prev) => [...prev, newFile])
    message.success(`${file.name} added successfully`)
    return false // Prevent default upload behavior
  }

  // Remove uploaded file
  const handleRemoveFile = (uid: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.uid !== uid))
    message.info('File removed')
  }

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      // Use custom tone if custom is selected and has value, otherwise use selected tone
      const toneOfVoice = selectedTone === 'custom' && customTone.trim() ? customTone.trim() : selectedTone
      // Use custom industry if custom is selected and has value, otherwise use selected industry
      const finalIndustry = industry === 'custom' && customIndustry.trim() ? customIndustry.trim() : industry

      const response = await authService.updateProfile({
        brandName,
        industry: finalIndustry,
        toneOfVoice,
        knowledgeProducts,
        targetAudience: audienceTags,
      })

      if (response.success && response.user) {
        setUser(response.user)
        onLoginSuccess(response.user)
        message.success('Profile saved successfully')
      } else {
        message.error(response.message || 'Failed to save profile')
      }
    } catch (error) {
      message.error('An error occurred while saving profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout className={styles.layout}>
      <Header
        isLoggedIn={isLoggedIn}
        showBrandName={false}
        logoSrc={MELO_LOGO}
        onLoginSuccess={onLoginSuccess}
        onLogout={onLogout}
        user={user}
      />
      <Content className={styles.content}>
        <div className={styles.headerSection}>
          <Typography.Title level={1} className={styles.pageTitle}>
            Brand Profile
          </Typography.Title>
          <Typography.Text className={styles.userName}>
            {user?.name || user?.brandName || 'User'}
          </Typography.Text>
          <Button
            type="primary"
            size="large"
            onClick={handleSaveProfile}
            loading={loading}
            className={styles.saveButton}
          >
            Save Profile
          </Button>
        </div>

        <div className={styles.gridContainer}>
          {/* Basic Info */}
          <Card className={`${styles.card} ${styles.basicInfo}`}>
            <div className={styles.cardHeader}>
              <Typography.Title level={4} className={styles.cardTitle}>Basic Info</Typography.Title>
            </div>
            <Space direction="vertical" size="large" className={styles.fullWidth}>
              <div>
                <Typography.Text className={styles.fieldLabel}>Brand Name</Typography.Text>
                <Input
                  size="large"
                  placeholder="Enter your brand name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>
              <div>
                <Typography.Text className={styles.fieldLabel}>Industry</Typography.Text>
                <Select
                  size="large"
                  placeholder="Select your industry"
                  value={industry}
                  onChange={handleIndustryChange}
                  options={industryOptions}
                  className={styles.fullWidth}
                />
                {showCustomIndustryInput && (
                  <Input
                    size="large"
                    placeholder="Enter your industry (e.g., Tech & SaaS, Healthcare, Multiple industries...)"
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    className={styles.customIndustryInput}
                  />
                )}
              </div>
            </Space>
          </Card>

          {/* Tone of Voice */}
          <Card className={`${styles.card} ${styles.toneOfVoice}`}>
            <div className={styles.cardHeader}>
              <Typography.Title level={4} className={styles.cardTitle}>Tone of Voice</Typography.Title>
              <Typography.Text type="secondary" className={styles.cardSubtitle}>How should the AI sound?</Typography.Text>
            </div>
            <Space direction="vertical" size="middle" className={styles.fullWidth}>
              <div className={styles.toneButtonsGrid}>
                {toneButtons.map((tone) => (
                  <Button
                    key={tone.key}
                    size="large"
                    shape="round"
                    className={`${styles.toneButton} ${selectedTone === tone.key ? styles.toneButtonActive : ''}`}
                    type={selectedTone === tone.key ? 'primary' : 'default'}
                    style={
                      selectedTone === tone.key
                        ? { backgroundColor: tone.color, borderColor: tone.color }
                        : undefined
                    }
                    onClick={() => handleToneSelect(tone.key)}
                  >
                    {tone.label}
                  </Button>
                ))}
                <Button
                  size="large"
                  shape="round"
                  className={`${styles.toneButton} ${selectedTone === 'custom' ? styles.toneButtonActive : ''}`}
                  type={selectedTone === 'custom' ? 'primary' : 'default'}
                  onClick={() => handleToneSelect('custom')}
                >
                  Custom
                </Button>
              </div>
              {showCustomToneInput && (
                <div className={styles.customToneInput}>
                  <Input
                    size="large"
                    placeholder="e.g., professional, friendly, casual..."
                    value={customTone}
                    onChange={(e) => setCustomTone(e.target.value)}
                  />
                </div>
              )}
            </Space>
          </Card>

          {/* Target Knowledge Base */}
          <Card className={`${styles.card} ${styles.knowledgeBase}`}>
            <div className={styles.cardHeader}>
              <Typography.Title level={4} className={styles.cardTitle}>Knowledge Base</Typography.Title>
              <Typography.Text type="secondary" className={styles.cardSubtitle}>Products AI has learned</Typography.Text>
            </div>
            <div className={styles.productList}>
              {knowledgeProducts.map((product) => (
                <div key={product} className={styles.productItem}>
                  <span>{product}</span>
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    size="small"
                    onClick={() => handleRemoveProduct(product)}
                    className={styles.removeButton}
                  />
                </div>
              ))}
            </div>
            {!showAddProductInput ? (
              <Button
                icon={<PlusOutlined />}
                type="dashed"
                block
                onClick={() => setShowAddProductInput(true)}
                className={styles.addButton}
              >
                Add New Product
              </Button>
            ) : (
              <Space direction="vertical" className={styles.fullWidth}>
                <Input
                  placeholder="Enter product name"
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  onPressEnter={handleAddProduct}
                />
                <Space>
                  <Button type="primary" size="small" onClick={handleAddProduct}>Add</Button>
                  <Button size="small" onClick={() => { setShowAddProductInput(false); setNewProduct(''); }}>Cancel</Button>
                </Space>
              </Space>
            )}
          </Card>

          {/* Target Audience */}
          <Card className={`${styles.card} ${styles.targetAudience}`}>
            <div className={styles.cardHeader}>
              <Typography.Title level={4} className={styles.cardTitle}>Target Audience</Typography.Title>
              <Typography.Text type="secondary" className={styles.cardSubtitle}>Who are your customers?</Typography.Text>
            </div>
            <Space direction="vertical" size="middle" className={styles.fullWidth}>
              <div className={styles.tagInputRow}>
                <Input
                  placeholder="Add audience keyword"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onPressEnter={addAudienceTag}
                  className={styles.tagInput}
                />
                <Button type="primary" onClick={addAudienceTag}>Add</Button>
              </div>
              <div className={styles.tagsContainer}>
                {audienceTags.map((tag) => (
                  <Tag key={tag} color="purple" closable onClose={() => removeAudienceTag(tag)} className={styles.audienceTag}>
                    {tag}
                  </Tag>
                ))}
              </div>
            </Space>
          </Card>

          {/* Company Description */}
          <Card className={`${styles.card} ${styles.companyDescription}`}>
            <div className={styles.cardHeader}>
              <Typography.Title level={4} className={styles.cardTitle}>Company Description</Typography.Title>
              <Typography.Text type="secondary" className={styles.cardSubtitle}>Tell us about your business</Typography.Text>
            </div>
            <Input.TextArea
              placeholder="Describe your company's mission, values, products/services, and what makes it unique..."
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              className={styles.descriptionTextarea}
              maxLength={2000}
              showCount
            />
          </Card>

          {/* Upload Database */}
          <Card className={`${styles.card} ${styles.uploadDatabase}`}>
            <div className={styles.cardHeader}>
              <Typography.Title level={4} className={styles.cardTitle}>Upload Database</Typography.Title>
              <Typography.Text type="secondary" className={styles.cardSubtitle}>Annual reports, documents</Typography.Text>
            </div>
            <Upload.Dragger
              accept=".pdf,.xlsx,.xls,.doc,.docx,.csv,.txt"
              multiple
              showUploadList={false}
              beforeUpload={handleFileUpload}
              className={styles.uploadDragger}
            >
              <UploadOutlined className={styles.uploadIcon} />
              <p className={styles.uploadText}>Click or drag files</p>
              <p className={styles.uploadHint}>PDF, Excel, Word, CSV, TXT</p>
            </Upload.Dragger>

            {uploadedFiles.length > 0 && (
              <div className={styles.fileList}>
                {uploadedFiles.map((file) => (
                  <div key={file.uid} className={styles.fileItem}>
                    <div className={styles.fileInfo}>
                      {getFileIcon(file.name)}
                      <div className={styles.fileDetails}>
                        <Typography.Text ellipsis className={styles.fileName}>{file.name}</Typography.Text>
                        <Typography.Text type="secondary" className={styles.fileSize}>{formatFileSize(file.size)}</Typography.Text>
                      </div>
                    </div>
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => handleRemoveFile(file.uid)} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </Content>
    </Layout>
  )
}
