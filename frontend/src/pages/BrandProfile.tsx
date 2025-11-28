import { CloseOutlined, PlusOutlined, UploadOutlined, FileTextOutlined, FilePdfOutlined, FileExcelOutlined, FileUnknownOutlined, DeleteOutlined } from '@ant-design/icons'
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
import type { UploadFile, UploadProps } from 'antd'
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

  // Load user data on mount and when propUser changes
  useEffect(() => {
    const loadUser = async () => {
      if (isLoggedIn) {
        const currentUser = await authService.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          setBrandName(currentUser.brandName || '')
          setIndustry(currentUser.industry || '')
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

  // Get file icon based on file type
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['pdf'].includes(ext || '')) return <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) return <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />
    if (['doc', 'docx', 'txt'].includes(ext || '')) return <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
    return <FileUnknownOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />
  }

  // Handle file upload
  const handleFileUpload: UploadProps['onChange'] = ({ fileList }) => {
    setUploadedFiles(fileList)
  }

  // Handle file removal
  const handleRemoveFile = (file: UploadFile) => {
    setUploadedFiles(uploadedFiles.filter(f => f.uid !== file.uid))
  }

  // Format file size
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      // Use custom tone if custom is selected and has value, otherwise use selected tone
      const toneOfVoice = selectedTone === 'custom' && customTone.trim() ? customTone.trim() : selectedTone

      const response = await authService.updateProfile({
        brandName,
        industry,
        toneOfVoice,
        knowledgeProducts,
        targetAudience: audienceTags,
        companyDescription,
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
        <Typography.Title level={1} className={styles.pageTitle}>
          Brand Profile ({user?.name || user?.brandName || 'User'})
        </Typography.Title>

        <div className={styles.gridContainer}>
          {/* Row 1: Basic Info + Company Description + Tone of Voice */}
          <Card title="Basic Info" className={`${styles.card} ${styles.basicInfo}`}>
            <Space direction="vertical" size="large" className={styles.fullWidth}>
              <div>
                <Typography.Text className={styles.fieldLabel}>Brand Name</Typography.Text>
                <Input
                  size="large"
                  placeholder="Brand Name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>
              <div>
                <Typography.Text className={styles.fieldLabel}>Industry</Typography.Text>
                <Select
                  size="large"
                  value={industry}
                  onChange={(value) => setIndustry(value)}
                  options={industryOptions}
                  className={styles.fullWidth}
                  placeholder="Select industry"
                />
              </div>
            </Space>
          </Card>

          <Card title="Company Description" className={`${styles.card} ${styles.companyDesc}`}>
            <Space direction="vertical" size="middle" className={styles.fullWidth}>
              <Typography.Text type="secondary">
                Describe your company, products, services, and unique value proposition
              </Typography.Text>
              <Input.TextArea
                size="large"
                placeholder="Tell us about your company... (e.g., mission, vision, history, products, services)"
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                rows={6}
                maxLength={2000}
                showCount
                className={styles.textArea}
              />
            </Space>
          </Card>

          <Card
            title="Tone of Voice"
            className={`${styles.card} ${styles.toneOfVoice}`}
          >
            <Space direction="vertical" size="middle" className={styles.fullWidth}>
              <Typography.Text type="secondary">
                How should the AI sound?
              </Typography.Text>
              <Space size="middle" wrap>
                {toneButtons.map((tone) => (
                  <Button
                    key={tone.key}
                    size="large"
                    shape="round"
                    className={styles.toneButton}
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
                  className={styles.toneButton}
                  type={selectedTone === 'custom' ? 'primary' : 'default'}
                  onClick={() => handleToneSelect('custom')}
                >
                  Custom
                </Button>
              </Space>
              {showCustomToneInput && (
                <div>
                  <Input
                    size="large"
                    placeholder="Enter custom tone (e.g., professional, friendly)"
                    value={customTone}
                    onChange={(e) => setCustomTone(e.target.value)}
                    onPressEnter={() => {
                      if (customTone.trim()) {
                        setSelectedTone('custom')
                      }
                    }}
                  />
                  <Typography.Text type="secondary" className={styles.helperText}>
                    Describe how you want the AI to communicate
                  </Typography.Text>
                </div>
              )}
            </Space>
          </Card>

          {/* Row 2: Upload Database + Target Knowledge Base + Target Audience */}
          <Card title="Upload Database" className={`${styles.card} ${styles.uploadDatabase}`}>
            <Space direction="vertical" size="middle" className={styles.fullWidth}>
              <Typography.Text type="secondary">
                Upload annual reports, financial data, product catalogs, or any business documents
              </Typography.Text>
              <Upload.Dragger
                multiple
                fileList={uploadedFiles}
                onChange={handleFileUpload}
                beforeUpload={() => false}
                accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.txt"
                className={styles.uploadDragger}
              >
                <p className={styles.uploadIcon}>
                  <UploadOutlined />
                </p>
                <p className={styles.uploadText}>Click or drag files to upload</p>
                <p className={styles.uploadHint}>
                  Supports PDF, Excel, CSV, Word, TXT
                </p>
              </Upload.Dragger>
              {uploadedFiles.length > 0 && (
                <div className={styles.fileList}>
                  {uploadedFiles.map((file) => (
                    <div key={file.uid} className={styles.fileItem}>
                      <div className={styles.fileInfo}>
                        {getFileIcon(file.name)}
                        <div className={styles.fileDetails}>
                          <Typography.Text ellipsis className={styles.fileName}>
                            {file.name}
                          </Typography.Text>
                          <Typography.Text type="secondary" className={styles.fileSize}>
                            {file.size ? formatFileSize(file.size) : ''}
                          </Typography.Text>
                        </div>
                      </div>
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveFile(file)}
                        className={styles.deleteFileBtn}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Space>
          </Card>

          <Card title="Target Knowledge Base" className={`${styles.card} ${styles.knowledgeBase}`}>
            <Typography.Paragraph type="secondary">
              AI has learned about these products
            </Typography.Paragraph>
            <ul className={styles.list}>
              {knowledgeProducts.map((product) => (
                <li key={product}>
                  <span className={styles.productName}>{product}</span>
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    size="small"
                    onClick={() => handleRemoveProduct(product)}
                    className={styles.removeButton}
                  />
                </li>
              ))}
            </ul>
            {!showAddProductInput ? (
              <Button
                icon={<PlusOutlined />}
                type="dashed"
                block
                onClick={() => setShowAddProductInput(true)}
              >
                Add New Product
              </Button>
            ) : (
              <Space direction="vertical" className={styles.fullWidth}>
                <Input
                  placeholder="Enter new product name"
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  onPressEnter={handleAddProduct}
                />
                <Space>
                  <Button type="primary" onClick={handleAddProduct}>
                    Add
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddProductInput(false)
                      setNewProduct('')
                    }}
                  >
                    Cancel
                  </Button>
                </Space>
              </Space>
            )}
          </Card>

          <Card title="Target Audience" className={`${styles.card} ${styles.targetAudience}`}>
            <Space direction="vertical" size="large" className={styles.fullWidth}>
              <Input
                size="large"
                placeholder="Add Keywords"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onPressEnter={addAudienceTag}
              />
              <div className={styles.tagsContainer}>
                {audienceTags.map((tag) => (
                  <Tag key={tag} color="blue" closable onClose={() => removeAudienceTag(tag)}>
                    {tag}
                  </Tag>
                ))}
              </div>
              <Button type="primary" onClick={addAudienceTag}>
                Add Keyword
              </Button>
            </Space>
          </Card>

          {/* Save Button */}
          <div className={styles.saveButtonContainer}>
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
        </div>
      </Content>
    </Layout>
  )
}
