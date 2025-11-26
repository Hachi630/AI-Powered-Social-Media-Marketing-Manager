import { CloseOutlined, PlusOutlined } from '@ant-design/icons'
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
} from 'antd'
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
  const [audienceTags, setAudienceTags] = useState<string[]>([])
  const [keyword, setKeyword] = useState('')
  const [knowledgeProducts, setKnowledgeProducts] = useState<string[]>([])
  const [showAddProductInput, setShowAddProductInput] = useState(false)
  const [newProduct, setNewProduct] = useState('')
  const [loading, setLoading] = useState(false)

  // Load user data on mount and when propUser changes
  useEffect(() => {
    const loadUser = async () => {
      if (isLoggedIn) {
        const currentUser = await authService.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          setBrandName(currentUser.brandName || '')
          setIndustry(currentUser.industry || '')
          setSelectedTone(currentUser.toneOfVoice || 'calm')
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

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      const response = await authService.updateProfile({
        brandName,
        industry,
        toneOfVoice: selectedTone,
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
        <Typography.Title level={1} className={styles.pageTitle}>
          Brand Profile ({user?.name || user?.brandName || 'User'})
        </Typography.Title>

        <Row gutter={[150, 100]} className={styles.row}>
          <Col xs={24} md={8}>
            <Card title="Basic Info" className={styles.card}>
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
                  />
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={11}>
            <Card
              title="Tone of Voice"
              extra={<Typography.Text type="secondary">How should the AI sound?</Typography.Text>}
              className={styles.card}
            >
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
                    onClick={() => setSelectedTone(tone.key)}
                  >
                    {tone.label}
                  </Button>
                ))}
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={5}>
            <Button
              type="primary"
              block
              size="large"
              onClick={handleSaveProfile}
              loading={loading}
            >
              Save Profile
            </Button>
          </Col>
        </Row>

        <Row gutter={[150, 100]} className={styles.row}>
          <Col xs={24} md={8}>
            <Card title="Target Knowledge Base" className={styles.card}>
              <Typography.Paragraph type="secondary">
                AI has learned about these products
              </Typography.Paragraph>
              <ul className={styles.list}>
                {knowledgeProducts.map((product) => (
                  <li key={product}>
                    {product}
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
          </Col>
          <Col xs={24} md={11}>
            <Card title="Target Audience" className={styles.card}>
              <Space direction="vertical" size="large" className={styles.fullWidth}>
                <Input
                  size="large"
                  placeholder="Add Keywords"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onPressEnter={addAudienceTag}
                />
                <Space wrap>
                  {audienceTags.map((tag) => (
                    <Tag key={tag} color="blue" closable onClose={() => removeAudienceTag(tag)}>
                      {tag}
                    </Tag>
                  ))}
                </Space>
                <Button type="primary" onClick={addAudienceTag}>
                  Add Keyword
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  )
}
