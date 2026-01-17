# Demo Presenter（PPT翻页式演示）实施计划 — Maya 蛋糕店主场景

> 目标：做一个“像 PPT 一样 Next 翻页”的可控演示流，覆盖除真实登录/真实后端以外的功能；所有数据固定/可复位；每一步带聚光灯高亮与重点放大。
> 约束：新用户表单=注册登录后自动弹出的 onboarding 表单；出图=Dashboard 内生成图片；定时发布=Calendar 内设置时间即定时发布。

---

## 1. 交付物（DoD / 验收标准）

- 进入 Demo 演示模式后，右下角常驻控制条：`Back / Next / Restart / Exit`（支持键盘 ←/→/Esc）。
- 每一步自动把用户带到正确页面/打开正确弹窗，并聚焦高亮指定区域（遮罩挖洞 + 描边 + 轻微放大/脉冲）。
- 演示全程不依赖真实后端：Dashboard 出图、生成计划、推送 Calendar、定时发布状态、Analytics、Messaging 都返回固定结果（带可控“假加载 300–800ms”）。
- `Restart` 一键恢复到第 1 步并重置演示数据；`Exit` 清理 demo 状态，回到正常流程。
- 页面上有明显的 `Demo Mode` 标识（避免被误认为真实线上）。

---

## 2. Demo 模式开关与入口

### 2.1 开关策略（防止污染正式）
- Demo 模式只在特定 build/环境下出现入口（例如 `VITE_DEMO=1` 之类的编译期开关）。
- 即使入口被手动打开，也必须有“只读/假数据”的明显提示。

### 2.2 入口（建议）
- Dashboard 顶部（或全局 Header）出现 `Demo` 按钮（仅 Demo build 可见）。
- 点击后：
  - 设置 `demoMode=true`（localStorage/sessionStorage）。
  - 写入一个固定 demo user（Maya）为“已登录态”（绕过真实登录校验）。
  - 自动进入第 1 步（Onboarding 表单）。

---

## 3. 技术方案（Presenter 架构，不写具体代码但给落点）

### 3.1 Presenter 三件套
1) **Step Registry（步骤配置表）**
- 每一步定义：`id / title / route / spotlightTarget / action / narration / nextGuard`
- spotlightTarget 不要用脆弱的 CSS 结构选择器；建议在关键 UI 元素上加稳定标记：`data-demo-id="..."`

2) **Overlay（遮罩聚光灯）**
- 全屏遮罩（除聚焦区域挖洞外全暗）
- 聚焦框：描边 + drop-shadow
- “重点放大”：聚焦框内整体 `scale(1.03~1.06)` 或加轻微脉冲动画

3) **Runner（步骤执行器）**
- `Next`：执行“到达页面/打开弹窗/预填/触发生成/等待结果”后，渲染 spotlight
- `Back`：回到上一步并恢复该步需要的 UI 状态
- `Guard`：目标元素未出现时禁用 Next，并显示“正在准备演示...”状态

### 3.2 演示假数据（Demo Data Source）
- service 层统一分流：Demo → mock；Normal → real API
- mock 数据要求：
  - 固定且可复位（Restart/Exit 清空）
  - 允许“看起来可编辑”：新增/修改/定时发布改变状态，但仅写入内存或 localStorage

---

## 4. Maya 演示脚本（按 Next 翻页）

> 总步数建议 12 步，8–10 分钟；每步都给出需要加的 `data-demo-id` 与自动动作。

### Step 0 — 封面/进入演示
- route：当前页覆盖即可
- spotlight：控制条本身 + “开始演示”
- action：初始化 demo 数据（Maya 用户、空 onboarding、固定图片与计划草稿）
- narration：Maya 是蛋糕店主，今天用 Melo 从内容想法到定时发布再到分析与消息闭环。

### Step 1 — 新用户表单（注册登录后看到的 onboarding）
- route：登录后触发 onboarding 的页面/弹窗
- 需要标记：
  - `data-demo-id="onboarding-form"`
  - `data-demo-id="onboarding-submit"`
- action：
  - 自动打开 onboarding（如果本来就是自动弹出则只确保可见）
  - 预填：店名 `Maya’s Cake Studio`，行业 `Bakery`，目标 `提高门店预订`
- spotlight：表单主体 + Submit 按钮
- narration：30 秒完成新用户信息，让系统知道她的业务与目标。
- nextGuard：Submit 按钮可点击

### Step 2 — 选择 AI Robot 形象
- route：如果形象选择在设置/个人页，则自动跳转并打开该选择区域
- 需要标记：
  - `data-demo-id="robot-picker"`
  - `data-demo-id="robot-apply"`
- action：默认选中一个推荐形象并展示“已应用”
- spotlight：形象选择卡片
- narration：选择更贴合品牌气质的助手形象，增强使用体验。

### Step 3 — Dashboard：输入问题（为出图做准备）
- route：`/dashboard`
- 需要标记：
  - `data-demo-id="dashboard-imagegen-panel"`
  - `data-demo-id="imagegen-prompt"`
  - `data-demo-id="imagegen-generate"`
- action：预填 prompt：
  - “情人节草莓奶油蛋糕海报，温暖俏皮，粉白配色，门店预订 CTA”
- spotlight：生成图片区域（prompt + generate）
- narration：Maya 直接描述要做的海报，交给 AI 出图。

### Step 4 — Dashboard：生成图片结果（选择重点放大）
- route：`/dashboard`
- 需要标记：
  - `data-demo-id="imagegen-result-grid"`
  - `data-demo-id="imagegen-result-2"`（推荐那张）
  - `data-demo-id="imagegen-use-selected"`
- action：
  - 触发假加载 → 展示 4 张固定图
  - 默认高亮第 2 张
- spotlight：推荐图 + Use 按钮（放大）
- narration：选择最适合“预订转化”的构图，一键采用。

### Step 5 — Dashboard：生成计划（7 天内容计划）
- route：仍在 dashboard（或计划页面/模块）
- 需要标记：
  - `data-demo-id="plangen-panel"`
  - `data-demo-id="plangen-generate"`
- action：点击生成 → 输出固定 7 天计划（含平台/发布时间建议/文案要点）
- spotlight：计划摘要区域
- narration：从一张图扩展成 7 天内容节奏，避免临时想不到发什么。

### Step 6 — Push 到 Calendar（确认推送）
- route：dashboard 内确认弹窗/抽屉
- 需要标记：
  - `data-demo-id="push-calendar-confirm"`
- action：确认创建 7 条日程（写入 demo calendar store）
- spotlight：Confirm
- narration：计划直接落到日历里，团队排期一眼清晰。

### Step 7 — Calendar：月视图验证已推送
- route：`/calendar`
- 需要标记：
  - `data-demo-id="calendar-grid"`
  - `data-demo-id="calendar-event-maya-1"`（挑一条）
- action：定位到包含事件的那一周/月
- spotlight：事件条目（放大）
- narration：所有内容已经排进日历，接下来设置发布时间即可定时发布。

### Step 8 — Calendar：定时发布（设置时间 -> Scheduled）
- route：`/calendar`
- 需要标记：
  - `data-demo-id="calendar-event-modal"`
  - `data-demo-id="calendar-time-picker"`
  - `data-demo-id="calendar-schedule-cta"`
  - `data-demo-id="calendar-status-badge"`
- action：
  - 打开某个 event 详情
  - 设置时间为 “明天 10:00”
  - 状态从 Draft → Scheduled（演示数据）
- spotlight：时间选择 + 状态变化
- narration：只要设定时间，就会定时发布（演示模式下用固定返回模拟）。

### Step 9 — Brand Profile：补充品牌信息
- route：`/settings`（Brand Profile）
- 需要标记：
  - `data-demo-id="brandprofile-form"`
  - `data-demo-id="brandprofile-save"`
- action：预填并保存：
  - 受众：附近 3km 上班族/情侣
  - 语气：温暖俏皮
  - 卖点：当天现做、可定制祝福语、到店自取
- spotlight：关键字段 + Save
- narration：补齐品牌约束，让后续生成更一致。

### Step 10 — Analytics：看结果（固定 KPI + 亮点）
- route：`/analytics`
- 需要标记：
  - `data-demo-id="analytics-kpi-cards"`
  - `data-demo-id="analytics-best-time"`
- action：展示固定 KPI（例如预订点击 +18%），并高亮“最佳发布时间”
- spotlight：KPI 卡片
- narration：Maya 能看到哪些内容带来更多预订线索。

### Step 11 — Messaging：消息闭环（模板回复）
- route：`/messaging`
- 需要标记：
  - `data-demo-id="messaging-thread-maya-1"`
  - `data-demo-id="messaging-ai-reply"`
  - `data-demo-id="messaging-send"`
- action：自动选中一个询价对话 → 展示“AI 建议回复（固定文本）”→ 发送后状态变已回复
- spotlight：建议回复 + Send
- narration：最后把咨询转成订单：快速、统一、可追踪。

### Step 12 — 总结页 / 退出演示
- 画面：覆盖层总结 checklist
- spotlight：Exit / Restart
- narration：从 onboarding 到定时发布再到分析与消息闭环，一条链路跑通。

---

## 5. 需要在现有页面补的“稳定锚点”（data-demo-id 清单）
- Onboarding：form、submit
- Robot 选择：picker、apply
- Dashboard：imagegen panel/prompt/generate/result grid/recommended/use、plangen panel/generate、push calendar confirm
- Calendar：grid、event item、event modal、time picker、schedule cta、status badge
- Brand Profile：form、save
- Analytics：kpi cards、best time
- Messaging：thread item、ai reply、send

> 原则：不改 UI 结构，只加标记与少量可控入口，让 spotlight 永远找得到。

---

## 6. 实施任务拆解（给 Codex 执行顺序）
1) 加 Demo 模式开关与入口（Demo 按钮、Demo Mode 标识、Exit/Restart）
2) 建 Demo 数据源与 service 分流（calendar/analytics/messaging/imagegen/plangen）
3) 做 Presenter Overlay（遮罩挖洞、聚焦框、放大动画、定位/滚动）
4) 做 Step Runner（路由跳转、自动打开弹窗、预填、假加载、guard）
5) 在各页面补 `data-demo-id` 锚点（按清单）
6) 按 Step 0–12 串联、联调演示节奏（确保 Next 不会卡住）
7) 加“跳到第 X 步”的隐藏菜单（容错）

---

## 7. 风险与规避
- 目标元素找不到导致卡步：必须用 `data-demo-id`，并做 guard + fallback（提示“正在准备...”）。
- 页面异步加载：每步 action 必须“等待 ready”再渲染 spotlight。
- 误入真实模式：入口只在 demo build；并且显著显示 Demo Mode。

---
