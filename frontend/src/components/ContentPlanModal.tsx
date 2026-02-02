import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Space,
  message,
  List,
  Typography,
  Card,
  Divider,
  Tag,
  Row,
  Col,
  Badge,
  Spin,
} from "antd";
import {
  CalendarOutlined,
  RocketOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { Dayjs } from "dayjs";
import { useState, useEffect } from "react";
import { PLATFORMS } from "./CalendarItemModal";
import { isDemoMode } from "../demo/demoMode";
import { demoChat } from "../demo/demoServices";
import { parseCampaignText, ParsedCampaignDay } from "../utils/campaignParser";
import dayjs from "dayjs";

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

interface ContentPlanModalProps {
  open: boolean;
  goal?: string;
  messageText?: string; // Optional message text to parse
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContentPlanModal({
  open,
  goal: initialGoal,
  messageText,
  onClose,
  onSuccess,
}: ContentPlanModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any[]>([]);
  const [planGenerated, setPlanGenerated] = useState(false);

  // Inject calendar styles for scrollable and compact date picker
  useEffect(() => {
    const styleId = 'contentPlanDatePicker-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
      /* ContentPlan DatePicker - Compact and Scrollable */
      .contentPlanDatePicker.ant-picker-dropdown {
        z-index: 1050 !important;
        max-height: 400px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-panel-container {
        z-index: 1050 !important;
        max-height: 400px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
      }
      
      /* Smaller calendar cells */
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-cell {
        width: auto !important;
        height: 28px !important;
        padding: 0 !important;
        line-height: 28px !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-cell-inner {
        width: 28px !important;
        height: 28px !important;
        line-height: 28px !important;
        font-size: 13px !important;
        margin: 0 auto !important;
        border-radius: 4px !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-content tbody tr {
        height: 28px !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-week-panel-row th {
        width: auto !important;
        height: 28px !important;
        padding: 0 4px !important;
        line-height: 28px !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        color: #666 !important;
      }
      
      /* Compact spacing */
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-content {
        width: 100% !important;
        padding: 8px !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-body {
        padding: 8px !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-header {
        padding: 8px 12px !important;
        min-height: 40px !important;
        border-bottom: 1px solid #f0f0f0 !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-header-view {
        font-size: 16px !important;
        font-weight: 500 !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-prev-icon,
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-next-icon,
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-super-prev-icon,
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-super-next-icon {
        font-size: 12px !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-panel {
        width: 280px !important;
      }
      
      /* Scrollbar styling */
      .contentPlanDatePicker.ant-picker-dropdown::-webkit-scrollbar {
        width: 8px !important;
        display: block !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown::-webkit-scrollbar-track {
        background: #f1f1f1 !important;
        border-radius: 4px !important;
        margin: 4px 0 !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown::-webkit-scrollbar-thumb {
        background: #c1c1c1 !important;
        border-radius: 4px !important;
        min-height: 20px !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8 !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-panel-container::-webkit-scrollbar {
        width: 8px !important;
        display: block !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-panel-container::-webkit-scrollbar-track {
        background: #f1f1f1 !important;
        border-radius: 4px !important;
        margin: 4px 0 !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-panel-container::-webkit-scrollbar-thumb {
        background: #c1c1c1 !important;
        border-radius: 4px !important;
        min-height: 20px !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-panel-container::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8 !important;
      }
      
      /* Firefox scrollbar */
      .contentPlanDatePicker.ant-picker-dropdown {
        scrollbar-width: thin !important;
        scrollbar-color: #c1c1c1 #f1f1f1 !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-panel-container {
        scrollbar-width: thin !important;
        scrollbar-color: #c1c1c1 #f1f1f1 !important;
      }
      
      /* Hover and selection styles */
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-cell:hover .ant-picker-cell-inner {
        background-color: #f5f5f5 !important;
        border-radius: 4px !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-cell-selected .ant-picker-cell-inner {
        background-color: #AE906E !important;
        color: #ffffff !important;
        border-color: #AE906E !important;
        border-radius: 4px !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-cell-selected:hover .ant-picker-cell-inner {
        background-color: #AE906E !important;
        color: #ffffff !important;
      }
      
      /* Today's date - hide default Ant Design pseudo-elements to avoid double border */
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-cell-today .ant-picker-cell-inner::before,
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-cell-today .ant-picker-cell-inner::after {
        display: none !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-cell-today .ant-picker-cell-inner {
        border: 1px solid #AE906E !important;
        border-radius: 4px !important;
        position: relative !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-cell-today:not(.ant-picker-cell-selected) .ant-picker-cell-inner {
        border: 1px solid #AE906E !important;
        background-color: transparent !important;
        color: inherit !important;
      }
      
      .contentPlanDatePicker.ant-picker-dropdown .ant-picker-cell-today:hover .ant-picker-cell-inner {
        border-color: #AE906E !important;
        background-color: rgba(174, 144, 110, 0.1) !important;
      }
    `;

    return () => {
      // Cleanup on unmount
      const style = document.getElementById(styleId);
      if (style) {
        style.remove();
      }
    };
  }, []);

  // Parse message text when modal opens
  useEffect(() => {
    if (open && messageText) {
      const parsedDays = parseCampaignText(messageText);
      if (parsedDays.length > 0) {
        // Convert parsed days to plan format
        const plan = parsedDays.map((day: ParsedCampaignDay) => ({
          date: day.date,
          platform: day.platform,
          title: day.title,
          content: day.content,
          time: day.time,
        }));
        setGeneratedPlan(plan);
        setPlanGenerated(true);
        message.success(`Parsed ${plan.length} days from campaign text`);
      }
    }
  }, [open, messageText]);

  // Pre-fill form in demo mode
  useEffect(() => {
    if (open && isDemoMode()) {
      form.setFieldsValue({
        goal: "I want a 7-day Valentine's campaign for my cake shop. Warm and playful tone.",
        dateRange: [dayjs("2026-02-08"), dayjs("2026-02-14")],
        platforms: [PLATFORMS.INSTAGRAM, PLATFORMS.FACEBOOK, PLATFORMS.TWITTER, PLATFORMS.LINKEDIN],
      });
    }
  }, [open, form]);

  const platformOptions = [
    { value: PLATFORMS.INSTAGRAM, label: "Instagram" },
    { value: PLATFORMS.FACEBOOK, label: "Facebook" },
    { value: PLATFORMS.TWITTER, label: "Twitter/X" },
    { value: PLATFORMS.LINKEDIN, label: "LinkedIn" },
  ];

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields([
        "goal",
        "dateRange",
        "platforms",
      ]);
      setLoading(true);

      const [startDate, endDate] = values.dateRange as [Dayjs, Dayjs];

      if (isDemoMode()) {
        const demo = await demoChat.generatePlan();
        if (demo.success) {
          setGeneratedPlan(demo.plan || []);
          setPlanGenerated(true);
          message.success(`Generated ${demo.plan?.length || 0} content items`);
          return;
        }
      }

      // Use BASE_API_URL if set (production), otherwise use relative path (development with vite proxy)
      const BASE_API_URL = import.meta.env.VITE_API_URL || '';
      const API_URL = BASE_API_URL 
        ? `${BASE_API_URL}/api/chat/generate-plan`
        : '/api/chat/generate-plan';

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated. Please login first.");
      }

      console.log('Making request to:', API_URL);
      console.log('Token exists:', !!token);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goal: values.goal,
          startDate: startDate.format("YYYY-MM-DD"),
          endDate: endDate.format("YYYY-MM-DD"),
          platforms: values.platforms,
        }),
      });

      if (!response.ok) {
        // Try to parse error message
        let errorMessage = "Failed to generate content plan";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to generate content plan");
      }

      setGeneratedPlan(data.plan || []);
      setPlanGenerated(true);
      message.success(`Generated ${data.plan?.length || 0} content items`);
    } catch (error: any) {
      console.error("Generate plan error:", error);
      const BASE_API_URL = import.meta.env.VITE_API_URL || '';
      const API_URL = BASE_API_URL 
        ? `${BASE_API_URL}/api/chat/generate-plan`
        : '/api/chat/generate-plan';
      
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        API_URL: API_URL,
      });
      
      // Check if it's a network error
      if (error.message === "Failed to fetch" || error.name === "TypeError" || error.message?.includes("NetworkError")) {
        const isDev = !import.meta.env.VITE_API_URL;
        const backendPort = import.meta.env.VITE_BACKEND_PORT || '5000';
        const errorMsg = isDev 
          ? `Cannot connect to backend server (port ${backendPort}). Please check: 1) Backend is running on port ${backendPort}, 2) Frontend dev server is running, 3) Check browser console for details`
          : "Network error: Cannot connect to backend server. Please check your network connection and backend service status.";
        message.error(errorMsg, 8);
      } else {
        message.error(error.message || "Failed to generate content plan");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendToCalendar = async () => {
    if (generatedPlan.length === 0) {
      message.warning("Please generate a plan first");
      return;
    }

    try {
      setLoading(true);

      if (isDemoMode()) {
        const demo = await demoChat.sendToCalendar();
        if (demo.success) {
          message.success(`Successfully added ${demo.count || 0} items to calendar`);
          onSuccess();
          handleClose();
          return;
        }
      }

      // Use BASE_API_URL if set (production), otherwise use relative path (development with vite proxy)
      const BASE_API_URL = import.meta.env.VITE_API_URL || '';
      const API_URL = BASE_API_URL 
        ? `${BASE_API_URL}/api/chat/send-to-calendar`
        : '/api/chat/send-to-calendar';

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          items: generatedPlan,
          campaignId: form.getFieldValue("campaignId") || null,
        }),
      });

      if (!response.ok) {
        // Try to parse error message
        let errorMessage = "Failed to send items to calendar";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to send items to calendar");
      }

      message.success(
        `Successfully added ${data.count || 0} items to calendar`
      );
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Send to calendar error:", error);
      // Check if it's a network error
      if (error.message === "Failed to fetch" || error.name === "TypeError") {
        const isDev = !import.meta.env.VITE_API_URL;
        const backendPort = import.meta.env.VITE_BACKEND_PORT || '5000';
        const errorMsg = isDev 
          ? `Cannot connect to backend server (port ${backendPort}). Please run: cd backend && npm run dev`
          : "Network error: Cannot connect to backend server. Please check your network connection and backend service status.";
        message.error(errorMsg, 8);
      } else {
        message.error(error.message || "Failed to send items to calendar");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setGeneratedPlan([]);
    setPlanGenerated(false);
    onClose();
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      instagram: "#E4405F",
      instagram_post: "#E4405F", // Backward compatibility
      instagram_story: "#E4405F", // Backward compatibility
      instagram_reels: "#E4405F", // Backward compatibility
      facebook: "#1877F2",
      twitter: "#1DA1F2",
      linkedin: "#0A66C2",
    };
    return colors[platform] || "#AE906E";
  };

  const getPlatformLabel = (platform: string) => {
    return platformOptions.find((opt) => opt.value === platform)?.label || platform;
  };

  return (
    <Modal
      title={
        <Space>
          <RocketOutlined style={{ color: "#AE906E", fontSize: 20 }} />
          <Title level={4} style={{ margin: 0 }}>
            Generate Content Plan
          </Title>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={900}
      styles={{
        body: { padding: "24px", maxHeight: "80vh", overflowY: "auto" },
      }}
    >
      <div data-demo-id="plan-modal">
        <Form
          form={form}
          layout="vertical"
          initialValues={{ goal: initialGoal }}
          requiredMark={true}
        >
        <Card
          size="small"
          style={{
            marginBottom: 24,
            border: "1px solid #f0f0f0",
            borderRadius: 8,
          }}
        >
          <Form.Item
            name="goal"
            label={
              <Space>
                <BulbOutlined style={{ color: "#AE906E" }} />
                <Text strong>Marketing Goal</Text>
              </Space>
            }
            rules={[
              { required: true, message: "Please enter your marketing goal" },
            ]}
            style={{ marginBottom: 0 }}
          >
            <TextArea
              rows={4}
              placeholder="Describe your marketing campaign goals, target audience, key messages, and any specific requirements..."
              showCount
              maxLength={10000}
              style={{ fontSize: 14 }}
            />
          </Form.Item>
        </Card>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="dateRange"
              label={
                <Space>
                  <CalendarOutlined style={{ color: "#AE906E" }} />
                  <Text strong>Campaign Date Range</Text>
                </Space>
              }
              rules={[{ required: true, message: "Please select date range" }]}
            >
              <RangePicker
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
                size="large"
                placeholder={["Start date", "End date"]}
                popupClassName="contentPlanDatePicker"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="platforms"
              label={
                <Space>
                  <GlobalOutlined style={{ color: "#AE906E" }} />
                  <Text strong>Platforms</Text>
                </Space>
              }
              rules={[
                {
                  required: true,
                  message: "Please select at least one platform",
                },
              ]}
            >
              <Select
                mode="multiple"
                placeholder="Select platforms"
                size="large"
                maxTagCount="responsive"
                showArrow
              >
                {platformOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="campaignId"
          label={<Text type="secondary">Campaign ID (Optional)</Text>}
        >
          <Input
            placeholder="Enter campaign ID if linking to existing campaign"
            size="large"
          />
        </Form.Item>

        <Divider style={{ margin: "24px 0" }} />

        <Form.Item style={{ marginBottom: 0 }}>
          <Space size="middle" style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button size="large" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              onClick={handleGenerate}
              loading={loading}
              style={{
                backgroundColor: "#AE906E",
                borderColor: "#AE906E",
                minWidth: 140,
              }}
            >
              Generate Plan
            </Button>
          </Space>
        </Form.Item>

        {planGenerated && generatedPlan.length > 0 && (
          <>
            <Divider style={{ margin: "24px 0" }}>
              <Space>
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
                <Text strong style={{ fontSize: 16 }}>
                  Generated Plan Preview ({generatedPlan.length} items)
                </Text>
              </Space>
            </Divider>

            <Card
              style={{
                marginTop: 16,
                maxHeight: 400,
                overflowY: "auto",
                border: "1px solid #e8e8e8",
              }}
              bodyStyle={{ padding: "16px" }}
            >
              <List
                dataSource={generatedPlan}
                renderItem={(item: any, index: number) => (
                  <List.Item
                    style={{
                      padding: "16px",
                      marginBottom: 12,
                      border: "1px solid #f0f0f0",
                      borderRadius: 8,
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <Space
                      direction="vertical"
                      style={{ width: "100%" }}
                      size="small"
                    >
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Space>
                            <Badge
                              count={index + 1}
                              style={{
                                backgroundColor: "#AE906E",
                              }}
                            />
                            <Tag
                              color={getPlatformColor(item.platform)}
                              style={{
                                margin: 0,
                                padding: "4px 12px",
                                borderRadius: 4,
                                fontWeight: 500,
                              }}
                            >
                              {getPlatformLabel(item.platform)}
                            </Tag>
                            {item.time && (
                              <Space>
                                <ClockCircleOutlined />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {item.time}
                                </Text>
                              </Space>
                            )}
                          </Space>
                        </Col>
                        <Col>
                          <Tag color="blue" style={{ borderRadius: 4 }}>
                            {item.date}
                          </Tag>
                        </Col>
                      </Row>

                      <div style={{ marginTop: 8 }}>
                        <Text strong style={{ fontSize: 15, display: "block", marginBottom: 4 }}>
                          {item.title}
                        </Text>
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 13,
                            lineHeight: 1.6,
                            display: "block",
                            maxHeight: "3.2em",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.content}
                        </Text>
                      </div>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>

            <div style={{ marginTop: 24, textAlign: "right" }}>
              <Button
                type="primary"
                size="large"
                icon={<CalendarOutlined />}
                onClick={handleSendToCalendar}
                loading={loading}
                style={{
                  backgroundColor: "#52c41a",
                  borderColor: "#52c41a",
                  minWidth: 180,
                }}
              >
                Send to Calendar
              </Button>
            </div>
          </>
        )}

        {loading && !planGenerated && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Generating your content plan...</Text>
            </div>
          </div>
        )}
        </Form>
      </div>
    </Modal>
  );
}
