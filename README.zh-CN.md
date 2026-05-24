# 🚀 Melo — AI 驱动的社交媒体与营销助手

**🌐 语言**: [English](./README.md) · **中文**

Melo 是一个 AI 驱动的社交媒体与营销管理平台，帮助小品牌和精简营销团队创建、规划、发布内容，并自动管理多平台社交账号。

## 📋 目录

- [核心功能](#-核心功能)
- [技术栈](#-技术栈)
- [项目结构](#-项目结构)
- [快速开始](#-快速开始)
- [环境变量](#-环境变量)
- [Twitter/X 集成](#-twitterx-集成)
- [LinkedIn 集成](#-linkedin-集成)
- [Job Hunt 定时自动发帖](#-job-hunt-定时自动发帖)
- [部署](#-部署)
- [常见问题](#-常见问题)

## ✨ 核心功能

- **用户系统**：邮箱注册/登录，基于 JWT
- **品牌资料**：配置品牌语气、目标受众、知识库，作为 AI 上下文
- **AI 聊天**：基于 Gemini 的对话式内容创作，支持图片/PDF/DOCX 输入
- **AI 配图**：基于文字 prompt 生成图片
- **智能日历**：日/周/年视图，多平台事件（Instagram / TikTok / Facebook / X / LinkedIn）
- **多平台直连**：LinkedIn / Twitter / Facebook / Instagram OAuth 接入，一键发帖
- **内容计划生成**：输入目标 + 时间范围 + 平台，AI 一次性产出多平台内容计划
- **活动管理**：把日历项目分组到 Campaign 下统一管理
- **多公司支持**：单账号最多 10 个公司，每个独立品牌资料
- **项目文件夹**：聊天会话按文件夹整理
- **消息编辑**：编辑历史对话并重新生成 AI 回复
- **文件上传与处理**：PDF / DOCX 自动文本提取
- **自动发布调度器**：每 5 分钟检查到点的定时帖子并自动发布
- **Job Hunt LinkedIn 定时发帖**（新）：按周/日规则**自动生成新内容**并发布。专为 AI/SE 求职场景调优，但通用
- **ELO Live2D 助手**：可拖拽的 Live2D 小助手，含智能引导
- **Demo 模式**：13 步交互式产品导览
- **暗色模式 / 响应式设计**

## 🛠 技术栈

**前端**：React 18 · TypeScript · Vite · Ant Design 6 · React Router · CSS Modules · dayjs

**后端**：Node.js (20+) · Express · TypeScript · MongoDB / Mongoose · JWT · multer · Google Gemini API · node-cron

## 📁 项目结构

```
Melo/
├── frontend/   React + Vite 前端
│   └── src/
│       ├── components/     UI 组件（ChatBox / JobHuntPostModal / ContentPlanModal ...）
│       ├── pages/          HomePage / Calendar / BrandProfile / ContactUs ...
│       ├── services/       API 客户端（authService / jobHuntService ...）
│       └── App.tsx
├── backend/    Express + TypeScript 后端
│   └── src/
│       ├── models/         RecurringSchedule / CalendarItem / User ...
│       ├── routes/         jobHunt / linkedin / chat / calendar ...
│       ├── services/       jobHuntPromptService / schedulerService / geminiService ...
│       ├── middleware/     JWT 鉴权
│       └── index.ts
├── docs/       部署 & 保活文档
└── README.md / README.zh-CN.md
```

## 🚀 快速开始

### 前置要求

- **Node.js 20+**（`pdf-parse` 需要 20+，18 会报 `DOMMatrix is not defined`）
- MongoDB（本地或 Atlas）
- npm

### 安装与启动

```bash
# 后端
cd backend
npm install

# 前端（另开一个终端）
cd frontend
npm install

# 复制环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env，至少填上 MONGODB_URI / JWT_SECRET / GEMINI_API_KEY

# 启动后端（端口 5000）
cd backend && npm run dev

# 启动前端（端口 3000）
cd frontend && npm run dev
```

打开 `http://localhost:3000`。

## 🔐 环境变量

### 后端最小配置 (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/melo
JWT_SECRET=随便一个长字符串
JWT_EXPIRE=7d

# Gemini（聊天 + 生图）
GEMINI_API_KEY=你的 Gemini Key
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image-preview

# 前端地址（生产环境填 Vercel 域名）
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### 可选 OAuth 凭据

按需添加：
- LinkedIn: `LI_CLIENT_ID` / `LI_CLIENT_SECRET` / `LI_REDIRECT_URI`
- Twitter: `TWITTER_API_KEY` / `TWITTER_API_SECRET` / `TWITTER_CALLBACK_URL`
- Facebook / Instagram: `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET`
- AWS S3（可选，不配置则文件落本地）: `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET_NAME` / `AWS_REGION`

### 前端环境变量 (`frontend/.env` — 仅生产)

```env
VITE_API_URL=https://你的后端地址.onrender.com
VITE_GOOGLE_CLIENT_ID=你的 Google OAuth Client ID（可选）
```

## 🐦 Twitter/X 集成

1. 在 [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) 创建 App
2. 启用 OAuth 1.0a，权限设为 **Read and write**
3. Callback URL 填 `http://localhost:5000/api/twitter/callback`
4. 把 API Key/Secret 填到 `.env`

接口：
- `GET /api/twitter/auth?userId=<id>` — 发起授权
- `GET /api/twitter/callback` — 回调
- `GET /api/twitter/status` — 连接状态
- `DELETE /api/twitter/disconnect` — 解除连接

## 🔗 LinkedIn 集成

1. 在 [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) 创建 App
2. **Products** 标签启用：
   - ✅ Sign In with LinkedIn using OpenID Connect
   - ✅ Share on LinkedIn
3. **Auth** 标签 → Authorized Redirect URLs 添加：
   - 本地：`http://localhost:5000/linkedin/callback`
   - 生产：`https://<你的后端>.onrender.com/linkedin/callback`
4. 把 Client ID/Secret 填到 `.env`，其中 `LI_REDIRECT_URI` 要和上面注册的**完全一致**

接口位于 `/linkedin/*`（注意没有 `/api` 前缀，是历史原因）。

## 🤖 Job Hunt 定时自动发帖

基于 LinkedIn 集成的**真正 recurring 自动发帖**。用户配一个 **RecurringSchedule**（每周一三五 09:00 / 每天 18:00 等），后端按规则反复生成新内容并发布。

### 工作流程

1. 内部 cron 每 5 分钟扫一次 `RecurringSchedule.find({ status: 'active', nextRunAt <= now })`。
2. 对每一条到期的 schedule：
   - 调 Gemini 用配置好的子领域 + 热点关键词 + 语气生成新 LinkedIn post
   - 如开启了配图，再调 Gemini 生图，落 S3 或本地
   - 创建 `CalendarItem`，`status='scheduled'`，`recurringScheduleId` 指回 schedule
3. 同一轮 cron 接着跑 `checkAndPublishScheduledItems`，看到刚才那条 CalendarItem 到点了就发到 LinkedIn。
4. `nextRunAt` 推进到下一个匹配的日期/时间；若超过 `endDate` 就把 schedule 置为 `paused`。

### 怎么用

ChatBox 里点 **+** → **"Schedule Job Hunt Posts"**，弹出 Modal：

- **Create New** Tab：填表 → **Preview a post**（实时生成一篇样例，不入库）→ **Activate Schedule** 保存
- **My Schedules** Tab：列出当前用户所有 schedule，每条有
  - **Run Now**：立刻生成 + 立刻发布（不用等 cron）
  - **Pause / Resume**：暂停/恢复
  - **Delete**：删除（已生成的 CalendarItem 不影响）
  - 展开可看历史生成记录（带状态、配图、文案）

### Prompt 设计要点

`backend/src/services/jobHuntPromptService.ts` 中的系统提示词强制：

- **自然口吻**，不准用 AI influencer 套话（如 "Stop doing X"、"Most engineers don't understand…"）
- **不准编造数据**（benchmark、百分比、雇主、"in production at scale" 等）
- IELTS 6.5–7 语言难度，120–180 词
- **结尾不准是问号**（兜底层会强制把问号结尾的行删掉）
- 不准出现 em-dash / en-dash（被替换为逗号）
- 最后一行 3–5 个 hashtag，必含 `#OpenToWork`，不含 `#hiring`
- **正文绝口不提求职**，求职信号只通过 `#OpenToWork` 标签传达

### 字段说明

| 字段 | 是否必填 | 说明 |
|------|---------|------|
| `name` | 是 | schedule 名字 |
| `subDomains` | 否 | `LLMs` / `RAG` / `AI Agents` / `MLOps` / `System Design` / `Backend` / `Frontend` / `DevOps` / `Open Source` / `Distributed Systems` 多选 |
| `hotTopics` | 否 | 自由 tag，如 `DeepSeek V4`、`MCP`、`RAG 2.0`。每篇 post 只挑一个 |
| `tone` | 是 | `technical` / `storytelling` / `achievement` |
| `recurrencePattern` | 是 | `{ type: 'weekly' \| 'daily', daysOfWeek?: number[], timeOfDay: 'HH:mm' }` |
| `includeImage` | 否 | 默认 `true`，是否生成配图 |
| `imageStyle` | 否 | 默认 `clean tech illustration`，追加到生图 prompt 后 |
| `endDate` | 否 | 过期日，到日自动暂停 |

### Render 免费版保活

Render 免费实例 15 分钟没请求就休眠，会导致内部 cron 停摆。免费解决方案见 [`docs/RENDER_KEEP_ALIVE.md`](./docs/RENDER_KEEP_ALIVE.md)：

1. 注册 [cron-job.org](https://cron-job.org)（免费）
2. 添加任务：URL = `https://<你的后端>.onrender.com/api/health`，间隔 **10 分钟**
3. Render 一直保持唤醒，cron 稳定运行

### REST 接口（全部需要 JWT）

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/job-hunt/schedules` | 新建 schedule |
| `GET` | `/api/job-hunt/schedules` | 列出当前用户的 schedules |
| `PATCH` | `/api/job-hunt/schedules/:id` | 修改（暂停/恢复/改话题等） |
| `DELETE` | `/api/job-hunt/schedules/:id` | 删除 schedule |
| `POST` | `/api/job-hunt/preview` | 一次性预览（不入库） |
| `GET` | `/api/job-hunt/schedules/:id/items` | 该 schedule 历史生成的 CalendarItem |
| `POST` | `/api/job-hunt/schedules/:id/run-now` | 立刻生成 + 立刻发布 |

### 关键文件

- `backend/src/models/RecurringSchedule.ts` — 数据模型
- `backend/src/services/jobHuntPromptService.ts` — Gemini 调用 + 图片持久化
- `backend/src/services/schedulerService.ts` — `processRecurringSchedules` 函数
- `backend/src/routes/jobHunt.ts` — 7 个 REST 接口
- `frontend/src/components/JobHuntPostModal.tsx` — Modal 主体
- `frontend/src/services/jobHuntService.ts` — 前端 API 客户端

## 🚀 部署

### 后端（Render 或类似）

- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- 环境变量按上面后端 `.env` 配置，注意：
  - `NODE_ENV=production`
  - `MONGODB_URI` 用 Atlas 连接串（注意 URL 编码密码中的特殊字符）
  - `CLIENT_URL` / `FRONTEND_URL` 填 Vercel 前端域名（**末尾不要带 `/`**）
  - `LI_REDIRECT_URI` 填生产环境回调地址，**LinkedIn Developer Portal 的白名单必须同步添加**
- 配上 cron-job.org 保活（见 Job Hunt 章节）

### 前端（Vercel）

- **Root Directory**: `frontend`
- **Framework**: Vite（自动识别）
- 环境变量：
  - `VITE_API_URL` = `https://<你的后端>.onrender.com`（**末尾不要带 `/`**）
- 加完环境变量必须**重新部署**才生效

### CORS 注意

后端 `src/index.ts` 的 CORS 白名单已经放行所有 `*.vercel.app` 子域名，但 production 模式下仍然只允许 `CLIENT_URL` / `FRONTEND_URL` 和 vercel.app 域。如果遇到 CORS 报 500，多半是这两个变量没填或末尾带了斜杠。

## 🔧 常见问题

| 问题 | 解决 |
|------|------|
| `DOMMatrix is not defined` | 升级 Node.js 到 20+ |
| LinkedIn 连接报 `redirect_uri does not match` | 检查 `LI_REDIRECT_URI` 和 Developer Portal 注册的 URL 是否**完全一致**（包括 http/https） |
| `ERR_EMPTY_RESPONSE` on `/api/chat/generate-image` | 旧版后端用错 Gemini API 格式。重启后端，新版本会自动尝试多种 modality 写法 |
| 生产环境图片不显示 | Vercel 没配 `VITE_API_URL`，或配了但没重新部署 |
| LinkedIn 自动发帖到点没发 | Render 服务休眠了，配 cron-job.org 保活 |
| LinkedIn post 字数超长 / 含问号结尾 | 已通过 prompt + 后处理双重保护，若仍出现请反馈 |

完整故障排查见 [English README](./README.md#-troubleshooting)。

## 📄 许可证

详见 [English README](./README.md#-license)。

## 📞 反馈

- 提 Issue: [GitHub Issues](https://github.com/Hachi630/AI-Powered-Social-Media-Marketing-Manager/issues)
