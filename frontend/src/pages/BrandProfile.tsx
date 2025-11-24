import { PlusOutlined } from '@ant-design/icons'
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
} from 'antd'
import { useState } from 'react'
import Header from '../components/Header'
import { MELO_LOGO } from '../constants/assets'
import styles from './BrandProfile.module.css'

const { Content } = Layout

const toneButtons = [
  { key: 'calm', label: 'Calm', color: '#6750a4' },
  { key: 'warm', label: 'Warm', color: '#cab4ff' },
  { key: 'mindful', label: 'Mindful', color: '#b2b2b2' },
]

const knowledgeProducts = ['Lavender Candle', 'Succulent Pot']

const industryOptions = [
  { value: 'home-decor', label: 'Home Decor' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'beauty', label: 'Beauty' },
]

const initialAudience = ['Yoga lovers', 'Interior design enthusiast']

export default function BrandProfile() {
  const [selectedTone, setSelectedTone] = useState('calm')
  const [audienceTags, setAudienceTags] = useState(initialAudience)
  const [keyword, setKeyword] = useState('')

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

  return (
    <Layout className={styles.layout}>
      <Header isLoggedIn={false} showBrandName={false} logoSrc={MELO_LOGO} />
      <Content className={styles.content}>
        <Typography.Title level={1} className={styles.pageTitle}>
          Brand Profile (Maya’s CalmNest)
        </Typography.Title>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card title="Basic Info" className={styles.card}>
              <Space direction="vertical" size="large" className={styles.fullWidth}>
                <div>
                  <Typography.Text className={styles.fieldLabel}>Brand Name</Typography.Text>
                  <Input size="large" placeholder="Brand Name" defaultValue="ClamNest" />
                </div>
                <div>
                  <Typography.Text className={styles.fieldLabel}>Industry</Typography.Text>
                  <Select
                    size="large"
                    defaultValue="home-decor"
                    options={industryOptions}
                    className={styles.fullWidth}
                  />
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={10}>
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

          <Col xs={24} md={6}>
            <Card className={styles.card}>
              <Button type="primary" block size="large">
                Save Profile
              </Button>
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card title="Target Knowledge Base" className={styles.card}>
              <Typography.Paragraph type="secondary">
                AI has learned about these products
              </Typography.Paragraph>
              <ul className={styles.list}>
                {knowledgeProducts.map((product) => (
                  <li key={product}>{product}</li>
                ))}
              </ul>
              <Button icon={<PlusOutlined />} type="dashed" block>
                Add New Product
              </Button>
            </Card>
          </Col>
          <Col xs={24} md={10}>
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
                    <Tag
                      key={tag}
                      color="blue"
                      closable
                      onClose={() => removeAudienceTag(tag)}
                    >
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

