import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Typography,
  Card,
  Checkbox,
  Radio,
  TimePicker,
  DatePicker,
  Switch,
  Divider,
  Tag,
  Spin,
  Tabs,
  List,
  Popconfirm,
  Empty,
  Collapse,
  Badge,
} from "antd";
import {
  ThunderboltOutlined,
  EyeOutlined,
  RocketOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PlayCircleFilled,
  CheckCircleFilled,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import {
  createSchedule,
  previewJobHuntPost,
  listSchedules,
  updateSchedule,
  deleteSchedule,
  listScheduleItems,
  runScheduleNow,
  type PreviewPost,
  type SchedulePayload,
  type JobHuntTone,
  type RecurrenceType,
  type RecurringSchedule,
  type GeneratedItem,
} from "../services/jobHuntService";

const { Text, Paragraph } = Typography;

interface JobHuntPostModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SUB_DOMAIN_OPTIONS = [
  "LLMs",
  "RAG",
  "AI Agents",
  "MLOps",
  "System Design",
  "Backend",
  "Frontend",
  "DevOps",
  "Open Source",
  "Distributed Systems",
];

const DAY_OPTIONS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

const DAY_LABEL: Record<number, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

function statusBadge(status: GeneratedItem["status"]) {
  if (status === "published")
    return (
      <Tag icon={<CheckCircleFilled />} color="success">
        Published
      </Tag>
    );
  if (status === "scheduled")
    return (
      <Tag icon={<ClockCircleOutlined />} color="processing">
        Scheduled / In progress
      </Tag>
    );
  return <Tag>{status}</Tag>;
}

function ScheduleItemsView({
  schedule,
  items,
  onReload,
}: {
  schedule: RecurringSchedule;
  items?: GeneratedItem[];
  onReload: () => void;
}) {
  if (!items) {
    return (
      <div style={{ padding: 12 }}>
        <Spin /> Loading generated posts…
      </div>
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 8 }}>
        <Button size="small" icon={<ReloadOutlined />} onClick={onReload}>
          Refresh
        </Button>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {schedule.hotTopics.length > 0
            ? `Hot topics: ${schedule.hotTopics.join(", ")}`
            : "No hot topics set — posts will pick general subdomain trends"}
        </Text>
      </Space>

      {items.length === 0 ? (
        <Empty
          description="No posts generated yet. Hit 'Run Now' or wait for the next scheduled run."
          imageStyle={{ height: 40 }}
        />
      ) : (
        <List
          dataSource={items}
          renderItem={(it) => (
            <List.Item style={{ display: "block", padding: "12px 0" }}>
              <Space style={{ marginBottom: 6 }} wrap>
                {statusBadge(it.status)}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {dayjs(it.date).format("YYYY-MM-DD")}
                  {it.time && ` ${it.time}`}
                </Text>
                <Text strong>{it.title}</Text>
              </Space>
              {it.imageUrl && (
                <img
                  src={
                    it.imageUrl.startsWith("http")
                      ? it.imageUrl
                      : `${import.meta.env.VITE_API_URL || ""}${it.imageUrl}`
                  }
                  alt=""
                  style={{
                    maxWidth: 240,
                    borderRadius: 6,
                    display: "block",
                    marginBottom: 6,
                  }}
                />
              )}
              <Paragraph
                style={{
                  whiteSpace: "pre-wrap",
                  marginBottom: 0,
                  fontSize: 13,
                  background: "#fafafa",
                  padding: 8,
                  borderRadius: 6,
                }}
                ellipsis={{ rows: 6, expandable: true, symbol: "Show more" }}
              >
                {it.content}
              </Paragraph>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}

export default function JobHuntPostModal({
  open,
  onClose,
  onSuccess,
}: JobHuntPostModalProps) {
  const [form] = Form.useForm();
  const [tab, setTab] = useState<"create" | "manage">("create");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("weekly");
  const [includeImage, setIncludeImage] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<PreviewPost | null>(null);
  const [schedules, setSchedules] = useState<RecurringSchedule[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [itemsByScheduleId, setItemsByScheduleId] = useState<Record<string, GeneratedItem[]>>({});
  const [runningId, setRunningId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  useEffect(() => {
    if (open && tab === "manage") {
      refreshSchedules();
    }
  }, [open, tab]);

  async function refreshSchedules() {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoadingList(true);
    try {
      const res = await listSchedules(token);
      if (res.success && res.schedules) {
        setSchedules(res.schedules);
      }
    } catch (err: any) {
      message.error(err.message || "Failed to load schedules");
    } finally {
      setLoadingList(false);
    }
  }

  function buildPayload(): SchedulePayload | null {
    const values = form.getFieldsValue();
    if (!values.name || !values.tone || !values.timeOfDay) {
      return null;
    }
    const pattern: SchedulePayload["recurrencePattern"] = {
      type: recurrenceType,
      timeOfDay: (values.timeOfDay as Dayjs).format("HH:mm"),
    };
    if (recurrenceType === "weekly") {
      pattern.daysOfWeek = values.daysOfWeek || [];
    }
    return {
      name: values.name.trim(),
      subDomains: values.subDomains || [],
      tone: values.tone as JobHuntTone,
      hotTopics: values.hotTopics || [],
      recurrencePattern: pattern,
      includeImage,
      imageStyle: values.imageStyle || "clean tech illustration",
      endDate: values.endDate ? (values.endDate as Dayjs).toISOString() : null,
    };
  }

  async function handlePreview() {
    try {
      await form.validateFields([
        "name",
        "tone",
        "timeOfDay",
        ...(recurrenceType === "weekly" ? ["daysOfWeek"] : []),
      ]);
    } catch {
      return;
    }
    const payload = buildPayload();
    if (!payload) return;

    const token = localStorage.getItem("token");
    if (!token) {
      message.error("Please log in first");
      return;
    }

    setPreviewing(true);
    setPreview(null);
    try {
      const res = await previewJobHuntPost(token, payload);
      if (res.success && res.post) {
        setPreview(res.post);
      } else {
        message.error(res.message || "Preview failed");
      }
    } catch (err: any) {
      message.error(err.message || "Preview failed");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleActivate() {
    try {
      await form.validateFields();
    } catch {
      return;
    }
    const payload = buildPayload();
    if (!payload) {
      message.error("Please fill all required fields");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      message.error("Please log in first");
      return;
    }

    setSaving(true);
    try {
      const res = await createSchedule(token, payload);
      if (res.success) {
        message.success(
          "Schedule activated! Switch to 'My Schedules' to manage it."
        );
        form.resetFields();
        setPreview(null);
        onSuccess?.();
        // Switch to manage tab so user can see what they just created
        setTab("manage");
      } else {
        message.error(res.message || "Failed to activate schedule");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to activate schedule");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSchedule(s: RecurringSchedule) {
    const token = localStorage.getItem("token");
    if (!token) return;
    const newStatus = s.status === "active" ? "paused" : "active";
    try {
      const res = await updateSchedule(token, s._id, { status: newStatus });
      if (res.success) {
        message.success(newStatus === "active" ? "Resumed" : "Paused");
        refreshSchedules();
      } else {
        message.error(res.message || "Failed");
      }
    } catch (err: any) {
      message.error(err.message || "Failed");
    }
  }

  async function loadItems(scheduleId: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await listScheduleItems(token, scheduleId);
      if (res.success && res.items) {
        setItemsByScheduleId((prev) => ({ ...prev, [scheduleId]: res.items! }));
      }
    } catch (err: any) {
      message.error(err.message || "Failed to load generated posts");
    }
  }

  function onExpand(keys: string | string[]) {
    const arr = Array.isArray(keys) ? keys : [keys];
    setExpandedIds(arr);
    // Lazy-load items for newly expanded schedules
    arr.forEach((id) => {
      if (!itemsByScheduleId[id]) loadItems(id);
    });
  }

  async function runNow(scheduleId: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setRunningId(scheduleId);
    try {
      const res = await runScheduleNow(token, scheduleId);
      if (res.success) {
        message.success("Generated a fresh post. Publishing to LinkedIn now…");
        // Refresh items + refresh schedules (lastGeneratedAt etc.)
        await loadItems(scheduleId);
        await refreshSchedules();
        // Ensure this schedule is expanded so user sees the result
        setExpandedIds((prev) =>
          prev.includes(scheduleId) ? prev : [...prev, scheduleId]
        );
      } else {
        message.error(res.message || "Run now failed");
      }
    } catch (err: any) {
      message.error(err.message || "Run now failed");
    } finally {
      setRunningId(null);
    }
  }

  async function removeSchedule(id: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await deleteSchedule(token, id);
      if (res.success) {
        message.success("Deleted");
        refreshSchedules();
      } else {
        message.error(res.message || "Failed");
      }
    } catch (err: any) {
      message.error(err.message || "Failed");
    }
  }

  function describeRecurrence(s: RecurringSchedule): string {
    const p = s.recurrencePattern;
    if (p.type === "daily") return `Daily at ${p.timeOfDay}`;
    const days = (p.daysOfWeek || []).map((d) => DAY_LABEL[d]).join("/");
    return `Weekly ${days} at ${p.timeOfDay}`;
  }

  const createTab = (
    <>
      <Paragraph type="secondary">
        Auto-generate LinkedIn posts for your AI/SE job hunt on a recurring
        schedule. Each post is generated fresh from your hot topics and posted
        to your connected LinkedIn account.
      </Paragraph>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          tone: "technical",
          timeOfDay: dayjs("09:00", "HH:mm"),
          daysOfWeek: [1, 3, 5],
          imageStyle: "clean tech illustration",
        }}
      >
        <Form.Item
          name="name"
          label="Schedule Name"
          rules={[{ required: true, message: "Give this schedule a name" }]}
        >
          <Input placeholder="e.g. AI/SE Weekly Posts" maxLength={80} />
        </Form.Item>

        <Form.Item name="subDomains" label="AI/SE Focus Areas">
          <Checkbox.Group options={SUB_DOMAIN_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="hotTopics"
          label="Hot Topics / Keywords"
          tooltip="Cutting-edge topics or keywords you want each post to anchor on. Type and press Enter."
        >
          <Select
            mode="tags"
            placeholder="e.g. DeepSeek V4, MCP, RAG 2.0"
            tokenSeparators={[","]}
          />
        </Form.Item>

        <Form.Item name="tone" label="Tone" rules={[{ required: true }]}>
          <Radio.Group>
            <Radio.Button value="technical">Technical</Radio.Button>
            <Radio.Button value="storytelling">Storytelling</Radio.Button>
            <Radio.Button value="achievement">Achievement</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="Include AI-generated image with each post">
          <Switch checked={includeImage} onChange={setIncludeImage} />
        </Form.Item>

        {includeImage && (
          <Form.Item name="imageStyle" label="Image Style">
            <Input placeholder="e.g. minimalist tech illustration, isometric infographic" />
          </Form.Item>
        )}

        <Divider plain>Schedule</Divider>

        <Form.Item label="Recurrence">
          <Radio.Group
            value={recurrenceType}
            onChange={(e) => setRecurrenceType(e.target.value)}
          >
            <Radio.Button value="weekly">Weekly</Radio.Button>
            <Radio.Button value="daily">Daily</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {recurrenceType === "weekly" && (
          <Form.Item
            name="daysOfWeek"
            label="Days of Week"
            rules={[
              {
                required: true,
                message: "Pick at least one day",
                type: "array",
                min: 1,
              },
            ]}
          >
            <Checkbox.Group options={DAY_OPTIONS} />
          </Form.Item>
        )}

        <Form.Item
          name="timeOfDay"
          label="Time of Day"
          rules={[{ required: true }]}
        >
          <TimePicker format="HH:mm" minuteStep={5} />
        </Form.Item>

        <Form.Item name="endDate" label="End Date (optional)">
          <DatePicker />
        </Form.Item>

        <Space>
          <Button
            icon={<EyeOutlined />}
            loading={previewing}
            onClick={handlePreview}
          >
            Preview a post
          </Button>
          <Button
            type="primary"
            icon={<RocketOutlined />}
            loading={saving}
            onClick={handleActivate}
          >
            Activate Schedule
          </Button>
        </Space>
      </Form>

      {previewing && (
        <Card style={{ marginTop: 16 }}>
          <Spin /> Generating preview... (Gemini takes ~10s for text + image)
        </Card>
      )}

      {preview && !previewing && (
        <Card
          style={{ marginTop: 16 }}
          title={
            <Space>
              <Tag color="blue">Preview</Tag>
              <span>{preview.title}</span>
            </Space>
          }
        >
          {preview.imageUrl && (
            <img
              src={
                preview.imageUrl.startsWith("http")
                  ? preview.imageUrl
                  : `${import.meta.env.VITE_API_URL || ""}${preview.imageUrl}`
              }
              alt="preview"
              style={{
                width: "100%",
                maxHeight: 300,
                objectFit: "cover",
                borderRadius: 8,
                marginBottom: 12,
              }}
            />
          )}
          {!preview.imageUrl && preview.imageError && (
            <Tag color="warning" style={{ marginBottom: 12 }}>
              Image generation failed: {preview.imageError}
            </Tag>
          )}
          <Paragraph style={{ whiteSpace: "pre-wrap" }}>
            {preview.content}
          </Paragraph>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Each scheduled run will generate a fresh post like this.
          </Text>
        </Card>
      )}
    </>
  );

  const manageTab = (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button
          icon={<ReloadOutlined />}
          onClick={refreshSchedules}
          loading={loadingList}
        >
          Refresh
        </Button>
        <Text type="secondary">
          Scheduled posts also appear on the Calendar page once generated.
        </Text>
      </Space>

      {loadingList ? (
        <Spin />
      ) : schedules.length === 0 ? (
        <Empty description="No schedules yet. Create one in the other tab." />
      ) : (
        <Collapse
          accordion={false}
          activeKey={expandedIds}
          onChange={onExpand}
          items={schedules.map((s) => ({
            key: s._id,
            label: (
              <Space direction="vertical" size={2} style={{ width: "100%" }}>
                <Space>
                  <strong>{s.name}</strong>
                  <Tag color={s.status === "active" ? "green" : "default"}>
                    {s.status}
                  </Tag>
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {describeRecurrence(s)} · Next run:{" "}
                  {dayjs(s.nextRunAt).format("YYYY-MM-DD HH:mm")}
                </Text>
              </Space>
            ),
            extra: (
              <Space onClick={(e) => e.stopPropagation()}>
                <Button
                  size="small"
                  type="primary"
                  icon={<PlayCircleFilled />}
                  loading={runningId === s._id}
                  onClick={() => runNow(s._id)}
                >
                  Run Now
                </Button>
                <Button
                  size="small"
                  icon={
                    s.status === "active" ? (
                      <PauseCircleOutlined />
                    ) : (
                      <PlayCircleOutlined />
                    )
                  }
                  onClick={() => toggleSchedule(s)}
                >
                  {s.status === "active" ? "Pause" : "Resume"}
                </Button>
                <Popconfirm
                  title="Delete this schedule?"
                  description="Already-generated CalendarItems will remain."
                  onConfirm={() => removeSchedule(s._id)}
                  okText="Delete"
                  cancelText="Cancel"
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
            children: (
              <ScheduleItemsView
                schedule={s}
                items={itemsByScheduleId[s._id]}
                onReload={() => loadItems(s._id)}
              />
            ),
          }))}
        />
      )}
    </>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <ThunderboltOutlined />
          <span>Schedule Job Hunt Posts</span>
        </Space>
      }
      width={720}
      footer={null}
      destroyOnClose
    >
      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as "create" | "manage")}
        items={[
          { key: "create", label: "Create New", children: createTab },
          { key: "manage", label: "My Schedules", children: manageTab },
        ]}
      />
    </Modal>
  );
}
