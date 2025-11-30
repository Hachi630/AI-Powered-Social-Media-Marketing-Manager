import { Button, Card, Col, Layout, Row, Space, Typography } from 'antd'
import {
  MessageOutlined,
  ShopOutlined,
  CalendarOutlined,
  PictureOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  RocketOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
  TeamOutlined,
  UserOutlined,
  FileTextOutlined,
  BulbOutlined,
} from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import AuthModal from '../components/AuthModal'
import { MELO_LOGO } from '../constants/assets'
import styles from './HomePage.module.css'
import { User } from '../services/authService'

const { Content, Footer } = Layout
const { Title, Paragraph } = Typography

interface HomePageProps {
  isLoggedIn?: boolean
  onLoginSuccess?: (user: User) => void
  onLogout?: () => void
  user?: User | null
}

export default function HomePage({
  isLoggedIn = false,
  onLoginSuccess,
  onLogout,
  user,
}: HomePageProps) {
  const navigate = useNavigate()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate('/dashboard')
    } else {
      setIsAuthModalOpen(true)
    }
  }

  const handleLoginSuccess = (user: User) => {
    onLoginSuccess?.(user)
    setIsAuthModalOpen(false)
    navigate('/dashboard')
  }

  const products = [
    {
      icon: <MessageOutlined className={styles.productIcon} />,
      title: 'AI Chat Interface',
      description: 'Intelligent conversation assistant powered by advanced AI to help you create compelling marketing content and strategies.',
    },
    {
      icon: <ShopOutlined className={styles.productIcon} />,
      title: 'Brand Profile',
      description: 'Configure your brand voice, target audience, and knowledge base to ensure consistent messaging across all channels.',
    },
    {
      icon: <CalendarOutlined className={styles.productIcon} />,
      title: 'Smart Calendar',
      description: 'Schedule and manage your marketing campaigns with an intuitive calendar interface that keeps you organized.',
    },
    {
      icon: <PictureOutlined className={styles.productIcon} />,
      title: 'Image Generation',
      description: 'Generate stunning visuals for your marketing campaigns using AI-powered image generation technology.',
    },
  ]

  const advantages = [
    {
      icon: <ThunderboltOutlined className={styles.advantageIcon} />,
      title: 'AI-Powered',
      description: 'Leverage cutting-edge AI technology to automate and optimize your marketing workflows.',
    },
    {
      icon: <SafetyOutlined className={styles.advantageIcon} />,
      title: 'Brand-Customized',
      description: 'Every piece of content is tailored to match your brand voice and target audience.',
    },
    {
      icon: <RocketOutlined className={styles.advantageIcon} />,
      title: 'Easy to Use',
      description: 'Intuitive interface that requires no technical expertise - get started in minutes.',
    },
    {
      icon: <ClockCircleOutlined className={styles.advantageIcon} />,
      title: 'Time-Saving',
      description: 'Reduce content creation time by up to 80% while maintaining quality and brand consistency.',
    },
  ]

  const outcomes = [
    {
      icon: <LineChartOutlined className={styles.outcomeIcon} />,
      title: 'Increased Efficiency',
      description: 'Streamline your marketing operations and reduce manual work with AI automation.',
      metric: '80%',
      metricLabel: 'Time Saved',
    },
    {
      icon: <SafetyOutlined className={styles.outcomeIcon} />,
      title: 'Brand Consistency',
      description: 'Maintain a unified brand voice across all marketing channels and touchpoints.',
      metric: '100%',
      metricLabel: 'Consistency',
    },
    {
      icon: <ClockCircleOutlined className={styles.outcomeIcon} />,
      title: 'Faster Content Creation',
      description: 'Generate high-quality marketing content in minutes instead of hours.',
      metric: '10x',
      metricLabel: 'Faster',
    },
    {
      icon: <LineChartOutlined className={styles.outcomeIcon} />,
      title: 'Better Engagement',
      description: 'Create content that resonates with your audience and drives meaningful engagement.',
      metric: '3x',
      metricLabel: 'More Engagement',
    },
  ]

  const targetAudiences = [
    {
      icon: <TeamOutlined className={styles.audienceIcon} />,
      title: 'Small & Medium Businesses',
      description: 'Perfect for SMBs looking to scale their marketing efforts without scaling their team.',
    },
    {
      icon: <UserOutlined className={styles.audienceIcon} />,
      title: 'Marketing Teams',
      description: 'Empower your marketing team with AI tools that enhance creativity and productivity.',
    },
    {
      icon: <FileTextOutlined className={styles.audienceIcon} />,
      title: 'Brand Managers',
      description: 'Maintain brand consistency and streamline content approval processes.',
    },
    {
      icon: <BulbOutlined className={styles.audienceIcon} />,
      title: 'Content Creators',
      description: 'Boost your content creation workflow with AI assistance and smart scheduling.',
    },
  ]

  return (
    <Layout className={styles.layout}>
      <Header
        isLoggedIn={isLoggedIn}
        onLoginSuccess={onLoginSuccess}
        onLogout={onLogout}
        user={user}
        showBrandName={false}
        logoSrc={MELO_LOGO}
      />
      <Content className={styles.content}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <Title level={1} className={styles.heroTitle}>
            Transform Your Marketing with AI-Powered Solutions
          </Title>
          <Paragraph className={styles.heroSubtitle}>
            Melo helps businesses create, manage, and optimize their social media content and
            marketing strategies with the power of artificial intelligence.
          </Paragraph>
          <Space size="large" className={styles.heroButtons}>
            <Button type="primary" size="large" onClick={handleGetStarted}>
              Get Started
            </Button>
            <Button size="large" onClick={() => navigate('/dashboard')}>
              Learn More
            </Button>
          </Space>
        </section>

        {/* Products Section */}
        <section className={styles.section}>
          <Title level={2} className={styles.sectionTitle}>
            Our Products
          </Title>
          <Paragraph className={styles.sectionDescription}>
            Comprehensive tools to power your marketing success
          </Paragraph>
          <Row gutter={[24, 24]} className={styles.productsRow}>
            {products.map((product, index) => (
              <Col xs={24} sm={12} md={12} lg={6} xl={6} key={index}>
                <Card className={styles.productCard} hoverable>
                  <div className={styles.productIconWrapper}>{product.icon}</div>
                  <Title level={4} className={styles.productTitle}>
                    {product.title}
                  </Title>
                  <Paragraph className={styles.productDescription}>{product.description}</Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Advantages Section */}
        <section className={styles.section}>
          <Title level={2} className={styles.sectionTitle}>
            Why Choose Melo
          </Title>
          <Paragraph className={styles.sectionDescription}>
            Discover what makes our platform the best choice for your marketing needs
          </Paragraph>
          <Row gutter={[24, 24]} className={styles.advantagesRow}>
            {advantages.map((advantage, index) => (
              <Col xs={24} sm={12} md={12} lg={6} xl={6} key={index}>
                <Card className={styles.advantageCard} hoverable>
                  <div className={styles.advantageIconWrapper}>{advantage.icon}</div>
                  <Title level={4} className={styles.advantageTitle}>
                    {advantage.title}
                  </Title>
                  <Paragraph className={styles.advantageDescription}>
                    {advantage.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Outcomes Section */}
        <section className={styles.section}>
          <Title level={2} className={styles.sectionTitle}>
            Proven Results
          </Title>
          <Paragraph className={styles.sectionDescription}>
            See the impact Melo can have on your marketing performance
          </Paragraph>
          <Row gutter={[24, 24]} className={styles.outcomesRow}>
            {outcomes.map((outcome, index) => (
              <Col xs={24} sm={12} md={12} lg={6} xl={6} key={index}>
                <Card className={styles.outcomeCard} hoverable>
                  <div className={styles.outcomeIconWrapper}>{outcome.icon}</div>
                  <div className={styles.outcomeMetric}>
                    <span className={styles.metricValue}>{outcome.metric}</span>
                    <span className={styles.metricLabel}>{outcome.metricLabel}</span>
                  </div>
                  <Title level={4} className={styles.outcomeTitle}>
                    {outcome.title}
                  </Title>
                  <Paragraph className={styles.outcomeDescription}>{outcome.description}</Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Target Audience Section */}
        <section className={styles.section}>
          <Title level={2} className={styles.sectionTitle}>
            Built for Everyone
          </Title>
          <Paragraph className={styles.sectionDescription}>
            Melo is designed to serve diverse marketing needs across industries
          </Paragraph>
          <Row gutter={[24, 24]} className={styles.audienceRow}>
            {targetAudiences.map((audience, index) => (
              <Col xs={24} sm={12} md={12} lg={6} xl={6} key={index}>
                <Card className={styles.audienceCard} hoverable>
                  <div className={styles.audienceIconWrapper}>{audience.icon}</div>
                  <Title level={4} className={styles.audienceTitle}>
                    {audience.title}
                  </Title>
                  <Paragraph className={styles.audienceDescription}>
                    {audience.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <Title level={2} className={styles.ctaTitle}>
            Ready to Transform Your Marketing?
          </Title>
          <Paragraph className={styles.ctaDescription}>
            Join thousands of businesses already using Melo to streamline their marketing operations
          </Paragraph>
          <Button type="primary" size="large" onClick={handleGetStarted} className={styles.ctaButton}>
            Get Started Free
          </Button>
        </section>
      </Content>
      <Footer className={styles.footer}>
        <div className={styles.footerContent}>
          <Paragraph className={styles.footerText}>© 2025 Melo. All rights reserved.</Paragraph>
          <Space size="large">
            <Button type="link" className={styles.footerLink}>
              Privacy Policy
            </Button>
            <Button type="link" className={styles.footerLink}>
              Terms of Service
            </Button>
            <Button type="link" className={styles.footerLink}>
              Contact Us
            </Button>
          </Space>
        </div>
      </Footer>
      <AuthModal
        open={isAuthModalOpen}
        onCancel={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </Layout>
  )
}

