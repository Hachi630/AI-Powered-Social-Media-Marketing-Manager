import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Modal, Input, Button, Checkbox, Upload, Progress, Space, Typography, message, App, Row, Col } from 'antd';
import { UploadOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { authService } from '../services/authService';
import { uploadService } from '../services/uploadService';
import { useAppSettings } from '../contexts/AppSettingsContext';
import styles from './OnboardingModal.module.css';
import { isDemoMode } from '../demo/demoMode';

// Lazy load Live2DWidget for preview
const Live2DWidgetLazy = lazy(() => import('./Live2DWidget'));

const { Title, Text } = Typography;

interface OnboardingModalProps {
  open: boolean;
  onComplete: (user: any) => void;
}

// Step 2 - Target Audience Options
const TARGET_AUDIENCE_OPTIONS = [
  'all groups',
  'Children (0–12)',
  'Teenagers (13–18)',
  'Young Adults (18–30)',
  'Adults (30–50)',
  'Seniors (50+)',
  'Students',
  'Working Professionals',
  'Parents / Families',
  'Businesses (B2B)',
  'Other',
];

// Step 3 - Product Types Options
const PRODUCT_TYPES_OPTIONS = [
  'Clothing',
  'Hats',
  'Shoes',
  'Accessories',
  'Beauty & Cosmetics',
  'Home & Living',
  'Food & Beverage',
  'Electronics',
  'Toys',
  'Books',
  'Digital Products (eBooks, courses, apps)',
  'Services (e.g. tutoring, consulting)',
  'Other',
];

// Step 5 - Melo Goals Options
const MELO_GOALS_OPTIONS = [
  'Generate marketing copy faster',
  'Grow my social media presence',
  'Attract more customers',
  'Improve brand consistency',
  'Save time on content creation',
  'Optimize marketing strategy',
  'Understand what content works best',
  'Other',
];

// Step 6 - Publishing Platforms Options
const PUBLISHING_PLATFORMS_OPTIONS = [
  'Instagram',
  'Facebook',
  'X (Twitter)',
  'TikTok',
  'LinkedIn',
  'Pinterest',
  'Other',
];

// Step 7 - Content Types Options
const CONTENT_TYPES_OPTIONS = [
  'Social media posts',
  'Product descriptions',
  'Promotional content',
  'Brand storytelling',
  'Educational content',
  'Campaign content',
  'Other',
];

// Character options for Step 8
const CHARACTER_OPTIONS = [
  { name: "Umiushi", path: "/umiushi/うみうしモデル.model3.json", color: "#8ecae6" },
  { name: "Kurage", path: "/kurage/クラゲモデル.model3.json", color: "#219ebc" },
  { name: "Kurione", path: "/kurione/クリオネモデル.model3.json", color: "#023047" },
  { name: "Mendako", path: "/mendako/めんだこモデル.model3.json", color: "#ffb703" },
];

export default function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const { message: messageApi } = App.useApp();
  const { updatePendingSettings, applySettings } = useAppSettings();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Step 1: Brand Name
  const [brandName, setBrandName] = useState('');

  // Step 2: Target Audience
  const [selectedTargetAudience, setSelectedTargetAudience] = useState<string[]>([]);
  const [otherTargetAudience, setOtherTargetAudience] = useState('');

  // Step 3: Product Types
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [otherProductType, setOtherProductType] = useState('');

  // Step 4: Product Images
  const [productImages, setProductImages] = useState<string[]>([]);

  // Step 5: Melo Goals
  const [selectedMeloGoals, setSelectedMeloGoals] = useState<string[]>([]);
  const [otherMeloGoal, setOtherMeloGoal] = useState('');

  // Step 6: Publishing Platforms
  const [selectedPublishingPlatforms, setSelectedPublishingPlatforms] = useState<string[]>([]);
  const [otherPublishingPlatform, setOtherPublishingPlatform] = useState('');

  // Step 7: Content Types
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [otherContentType, setOtherContentType] = useState('');

  // Step 8: Character Selection
  const [selectedCharacter, setSelectedCharacter] = useState<string>(CHARACTER_OPTIONS[0].path);

  // Reset all form data when modal opens
  useEffect(() => {
    if (open) {
      // Reset to step 1
      setCurrentStep(1);
      // Reset all form fields
      setBrandName('');
      setSelectedTargetAudience([]);
      setOtherTargetAudience('');
      setSelectedProductTypes([]);
      setOtherProductType('');
      setProductImages([]);
      setSelectedMeloGoals([]);
      setOtherMeloGoal('');
      setSelectedPublishingPlatforms([]);
      setOtherPublishingPlatform('');
      setSelectedContentTypes([]);
      setOtherContentType('');
      setSelectedCharacter(CHARACTER_OPTIONS[0].path);
      setLoading(false);
      setUploading(false);
      if (isDemoMode()) {
        setBrandName("Maya’s Cake Studio");
        setSelectedTargetAudience(["Working Professionals", "Parents / Families"]);
        setSelectedProductTypes(["Food & Beverage"]);
        setSelectedMeloGoals(["Attract more customers", "Save time on content creation"]);
        setSelectedPublishingPlatforms(["Instagram", "Facebook"]);
        setSelectedContentTypes(["Social media posts"]);
      }
    }
  }, [open]);

  useEffect(() => {
    const handleDemoStep = (event: CustomEvent) => {
      const step = event.detail?.step;
      if (typeof step === "number") {
        setCurrentStep(step);
      }
    };
    window.addEventListener(
      "demo-onboarding-step",
      handleDemoStep as EventListener
    );
    return () => {
      window.removeEventListener(
        "demo-onboarding-step",
        handleDemoStep as EventListener
      );
    };
  }, []);

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!brandName.trim()) {
        messageApi.error('Please enter your brand name');
        return;
      }
    } else if (currentStep === 2) {
      const finalTargetAudience = selectedTargetAudience.includes('Other')
        ? [...selectedTargetAudience.filter((item) => item !== 'Other'), otherTargetAudience.trim()].filter(Boolean)
        : selectedTargetAudience;
      if (finalTargetAudience.length === 0) {
        messageApi.error('Please select at least one target audience');
        return;
      }
    } else if (currentStep === 3) {
      const finalProductTypes = selectedProductTypes.includes('Other')
        ? [...selectedProductTypes.filter((item) => item !== 'Other'), otherProductType.trim()].filter(Boolean)
        : selectedProductTypes;
      if (finalProductTypes.length === 0) {
        messageApi.error('Please select at least one product type');
        return;
      }
    } else if (currentStep === 5) {
      const finalMeloGoals = selectedMeloGoals.includes('Other')
        ? [...selectedMeloGoals.filter((item) => item !== 'Other'), otherMeloGoal.trim()].filter(Boolean)
        : selectedMeloGoals;
      if (finalMeloGoals.length === 0) {
        messageApi.error('Please select at least one goal');
        return;
      }
    } else if (currentStep === 6) {
      const finalPublishingPlatforms = selectedPublishingPlatforms.includes('Other')
        ? [...selectedPublishingPlatforms.filter((item) => item !== 'Other'), otherPublishingPlatform.trim()].filter(Boolean)
        : selectedPublishingPlatforms;
      if (finalPublishingPlatforms.length === 0) {
        messageApi.error('Please select at least one publishing platform');
        return;
      }
    } else if (currentStep === 7) {
      const finalContentTypes = selectedContentTypes.includes('Other')
        ? [...selectedContentTypes.filter((item) => item !== 'Other'), otherContentType.trim()].filter(Boolean)
        : selectedContentTypes;
      if (finalContentTypes.length === 0) {
        messageApi.error('Please select at least one content type');
        return;
      }
    }

    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleImageUpload: UploadProps['onChange'] = async (info) => {
    const file = info.file.originFileObj || (info.file as any).originFileObj || info.file;
    
    if (file && file instanceof File) {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        messageApi.error('Only image files are allowed');
        return;
      }
      
      // Validate file size (10MB)
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        messageApi.error('Image size must be less than 10MB');
        return;
      }

      setUploading(true);
      try {
        const response = await uploadService.uploadImage(file);
        if (response.success && response.imageUrl) {
          setProductImages((prev) => [...prev, response.imageUrl!]);
          messageApi.success('Image uploaded successfully');
        } else {
          messageApi.error(response.message || 'Failed to upload image');
        }
      } catch (error) {
        messageApi.error('Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    // Validate step 7
    const finalContentTypes = selectedContentTypes.includes('Other')
      ? [...selectedContentTypes.filter((item) => item !== 'Other'), otherContentType.trim()].filter(Boolean)
      : selectedContentTypes;
    
    if (finalContentTypes.length === 0) {
      messageApi.error('Please select at least one content type');
      return;
    }

    setLoading(true);
    try {
      // Prepare data
      const finalTargetAudience = selectedTargetAudience.includes('Other')
        ? [...selectedTargetAudience.filter((item) => item !== 'Other'), otherTargetAudience.trim()].filter(Boolean)
        : selectedTargetAudience;

      const finalProductTypes = selectedProductTypes.includes('Other')
        ? [...selectedProductTypes.filter((item) => item !== 'Other'), otherProductType.trim()].filter(Boolean)
        : selectedProductTypes;

      const finalMeloGoals = selectedMeloGoals.includes('Other')
        ? [...selectedMeloGoals.filter((item) => item !== 'Other'), otherMeloGoal.trim()].filter(Boolean)
        : selectedMeloGoals;

      const finalPublishingPlatforms = selectedPublishingPlatforms.includes('Other')
        ? [...selectedPublishingPlatforms.filter((item) => item !== 'Other'), otherPublishingPlatform.trim()].filter(Boolean)
        : selectedPublishingPlatforms;

      const onboardingData = {
        brandName: brandName.trim(),
        targetAudience: finalTargetAudience,
        productTypes: finalProductTypes,
        productImages: productImages,
        meloGoals: finalMeloGoals,
        publishingPlatforms: finalPublishingPlatforms,
        contentTypes: finalContentTypes,
      };

      const response = await authService.completeOnboarding(onboardingData);
      
      if (response.success && response.user) {
        // Save character selection to AppSettings directly
        // Use applySettings with overrideSettings to ensure it's applied immediately
        applySettings({ live2dModel: selectedCharacter });
        
        // Also directly save to localStorage to ensure it persists
        // This ensures the setting is saved even if React state update is delayed
        try {
          const STORAGE_KEY = "melo_app_settings";
          const saved = localStorage.getItem(STORAGE_KEY);
          let currentSettings = saved ? JSON.parse(saved) : {};
          currentSettings.live2dModel = selectedCharacter;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
        } catch (error) {
          console.error("Failed to save live2d model to localStorage:", error);
        }
        
        messageApi.success('Profile completed successfully!');
        // Use setTimeout to ensure settings are applied before closing modal
        setTimeout(() => {
          onComplete(response.user);
        }, 100);
      } else {
        messageApi.error(response.message || 'Failed to save, please try again');
      }
    } catch (error) {
      messageApi.error('Failed to save, please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleTargetAudienceChange = (checkedValues: string[]) => {
    setSelectedTargetAudience(checkedValues);
    if (!checkedValues.includes('Other')) {
      setOtherTargetAudience('');
    }
  };

  const handleProductTypesChange = (checkedValues: string[]) => {
    setSelectedProductTypes(checkedValues);
    if (!checkedValues.includes('Other')) {
      setOtherProductType('');
    }
  };

  const handleMeloGoalsChange = (checkedValues: string[]) => {
    setSelectedMeloGoals(checkedValues);
    if (!checkedValues.includes('Other')) {
      setOtherMeloGoal('');
    }
  };

  const handlePublishingPlatformsChange = (checkedValues: string[]) => {
    setSelectedPublishingPlatforms(checkedValues);
    if (!checkedValues.includes('Other')) {
      setOtherPublishingPlatform('');
    }
  };

  const handleContentTypesChange = (checkedValues: string[]) => {
    setSelectedContentTypes(checkedValues);
    if (!checkedValues.includes('Other')) {
      setOtherContentType('');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <Title level={4}>What is your brand name?</Title>
            <Input
              placeholder="Enter your brand name"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              size="large"
              style={{ marginTop: 16 }}
            />
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent}>
            <Title level={4}>Who are your primary target customers? (You can select multiple)</Title>
            <Checkbox.Group
              value={selectedTargetAudience}
              onChange={handleTargetAudienceChange}
              style={{ width: '100%', marginTop: 16 }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {TARGET_AUDIENCE_OPTIONS.map((option) => (
                  <Checkbox key={option} value={option}>
                    {option}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
            {selectedTargetAudience.includes('Other') && (
              <Input
                placeholder="Enter other target audience"
                value={otherTargetAudience}
                onChange={(e) => setOtherTargetAudience(e.target.value)}
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        );

      case 3:
        return (
          <div className={styles.stepContent}>
            <Title level={4}>What products does your brand mainly provide?</Title>
            <Checkbox.Group
              value={selectedProductTypes}
              onChange={handleProductTypesChange}
              style={{ width: '100%', marginTop: 16 }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {PRODUCT_TYPES_OPTIONS.map((option) => (
                  <Checkbox key={option} value={option}>
                    {option}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
            {selectedProductTypes.includes('Other') && (
              <Input
                placeholder="Enter other product type"
                value={otherProductType}
                onChange={(e) => setOtherProductType(e.target.value)}
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        );

      case 4:
        return (
          <div className={styles.stepContent}>
            <Title level={4}>Upload your product images (Optional)</Title>
            <Text type="secondary" style={{ display: 'block', marginTop: 8, marginBottom: 16 }}>
              Uploading images helps Melo generate more accurate and relevant content.
            </Text>
            <Upload
              onChange={handleImageUpload}
              showUploadList={false}
              accept="image/*"
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />} loading={uploading} disabled={uploading}>
                Upload Image
              </Button>
            </Upload>
            {productImages.length > 0 && (
              <div className={styles.imagePreviewContainer} style={{ marginTop: 16 }}>
                {productImages.map((url, index) => (
                  <div key={index} className={styles.imagePreview}>
                    <img src={url} alt={`Product ${index + 1}`} />
                    <Button
                      type="text"
                      danger
                      size="small"
                      onClick={() => handleRemoveImage(index)}
                      style={{ position: 'absolute', top: 4, right: 4 }}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className={styles.stepContent}>
            <Title level={4}>What are your main goals with Melo? (Select all that apply)</Title>
            <Checkbox.Group
              value={selectedMeloGoals}
              onChange={handleMeloGoalsChange}
              style={{ width: '100%', marginTop: 16 }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {MELO_GOALS_OPTIONS.map((option) => (
                  <Checkbox key={option} value={option}>
                    {option}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
            {selectedMeloGoals.includes('Other') && (
              <Input
                placeholder="Enter other goal"
                value={otherMeloGoal}
                onChange={(e) => setOtherMeloGoal(e.target.value)}
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        );

      case 6:
        return (
          <div className={styles.stepContent}>
            <Title level={4}>Where do you plan to publish your content?</Title>
            <Text type="secondary" style={{ display: 'block', marginTop: 8, marginBottom: 16 }}>
              This helps Melo tailor content style and tone for each platform.
            </Text>
            <Checkbox.Group
              value={selectedPublishingPlatforms}
              onChange={handlePublishingPlatformsChange}
              style={{ width: '100%', marginTop: 16 }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {PUBLISHING_PLATFORMS_OPTIONS.map((option) => (
                  <Checkbox key={option} value={option}>
                    {option}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
            {selectedPublishingPlatforms.includes('Other') && (
              <Input
                placeholder="Enter other publishing platform"
                value={otherPublishingPlatform}
                onChange={(e) => setOtherPublishingPlatform(e.target.value)}
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        );

      case 7:
        return (
          <div className={styles.stepContent}>
            <Title level={4}>What type of content do you want to create?</Title>
            <Checkbox.Group
              value={selectedContentTypes}
              onChange={handleContentTypesChange}
              style={{ width: '100%', marginTop: 16 }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {CONTENT_TYPES_OPTIONS.map((option) => (
                  <Checkbox key={option} value={option}>
                    {option}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
            {selectedContentTypes.includes('Other') && (
              <Input
                placeholder="Enter other content type"
                value={otherContentType}
                onChange={(e) => setOtherContentType(e.target.value)}
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        );

      case 8:
        return (
          <div className={styles.stepContent}>
            <Title level={4}>Choose your own elo</Title>
            <Text type="secondary" style={{ display: 'block', marginTop: 8, marginBottom: 16 }}>
              Select your character companion for your dashboard
            </Text>
            <Row gutter={24} style={{ marginTop: 16 }}>
              <Col xs={24} sm={24} md={12} lg={12}>
                <Space size="middle" wrap style={{ width: '100%' }}>
                  {CHARACTER_OPTIONS.map((character) => (
                    <Button
                      key={character.name}
                      size="large"
                      shape="round"
                      type={selectedCharacter === character.path ? "primary" : "default"}
                      onClick={() => setSelectedCharacter(character.path)}
                      style={{
                        minWidth: '120px',
                        borderColor: selectedCharacter === character.path ? undefined : character.color,
                        color: selectedCharacter === character.path ? undefined : character.color,
                      }}
                    >
                      {character.name}
                    </Button>
                  ))}
                </Space>
              </Col>
              <Col xs={24} sm={24} md={12} lg={12}>
                <div className={styles.characterPreview} data-demo-id="onboarding-live2d">
                  <Text type="secondary" style={{ display: 'block', marginBottom: 8, textAlign: 'center' }}>
                    Preview
                  </Text>
                  <div className={styles.previewContainer}>
                    <Suspense fallback={<div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
                      <Live2DWidgetLazy
                        modelPath={selectedCharacter}
                        isPreview={true}
                      />
                    </Suspense>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      open={open}
      closable={false}
      maskClosable={false}
      footer={null}
      width={600}
      className={styles.onboardingModal}
    >
      <div className={styles.modalContent} data-demo-id="onboarding-form">
        <div className={styles.progressSection}>
          <Progress
            percent={(currentStep / 8) * 100}
            showInfo={false}
            strokeColor="#1890ff"
          />
          <Text type="secondary" style={{ marginTop: 8, display: 'block', textAlign: 'center' }}>
            Step {currentStep} / 8
          </Text>
        </div>

        <div className={styles.contentSection}>
          {renderStepContent()}
        </div>

        <div className={styles.footerSection}>
          <Space>
            {currentStep > 1 && (
              <Button icon={<LeftOutlined />} onClick={handlePrevious}>
                Previous
              </Button>
            )}
            {currentStep < 8 ? (
              <Button type="primary" icon={<RightOutlined />} onClick={handleNext} data-demo-id="onboarding-submit">
                Next
              </Button>
            ) : (
              <Button type="primary" loading={loading} onClick={handleComplete} data-demo-id="onboarding-submit">
                Complete
              </Button>
            )}
          </Space>
        </div>
      </div>
    </Modal>
  );
}
