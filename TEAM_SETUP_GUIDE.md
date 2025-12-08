# 👥 队友设置指南 - LinkedIn 连接修复

## 📝 本次修改内容

### 修改的文件

1. **`frontend/src/components/LinkedInDashboard.tsx`**

   - **修复内容**：修复了 "Connect LinkedIn" 按钮不跳转的问题
   - **技术细节**：将按钮从使用 `href` 属性改为使用 `onClick` 事件处理器 + `window.location.href`，确保正确跳转到 LinkedIn 授权页面
   - **影响**：现在点击按钮会正确跳转到 LinkedIn OAuth 授权页面

2. **`LINKEDIN_QUICK_FIX.md`** (新增文档)
   - 包含 LinkedIn 连接问题的排查指南

## 🚀 队友运行步骤

### 1. 拉取最新代码

```bash
# 切换到 Tazw 分支（或你正在使用的分支）
git checkout Tazw

# 拉取最新代码
git pull origin Tazw

# 或者如果是第一次拉取这个分支
git fetch origin Tazw
git checkout Tazw
```

### 2. 安装依赖（如果需要）

```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

### 3. 配置环境变量

#### 后端环境变量 (`backend/.env`)

**必须添加以下 LinkedIn 相关配置：**

```env
# LinkedIn API 配置（必需）
LI_CLIENT_ID=your_linkedin_client_id
LI_CLIENT_SECRET=your_linkedin_client_secret
LI_REDIRECT_URI=http://localhost:5000/linkedin/callback
CLIENT_URL=http://localhost:3000

# 其他必需的环境变量（如果还没有）
PORT=5000
MONGODB_URI=mongodb://localhost:27017/melo
JWT_SECRET=your_secret_key
# ... 其他配置
```

**⚠️ 重要说明：**

- **选项 A：使用共享的 LinkedIn 应用**

  - 如果团队共享同一个 LinkedIn 应用，可以直接使用相同的 `LI_CLIENT_ID` 和 `LI_CLIENT_SECRET`
  - 需要确保 LinkedIn Developer Portal 中的重定向 URI 包含 `http://localhost:5000/linkedin/callback`

- **选项 B：使用自己的 LinkedIn 应用**
  - 每个开发者可以创建自己的 LinkedIn 应用
  - 访问 [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
  - 创建新应用后，获取 Client ID 和 Client Secret
  - 在应用的 "Auth" 标签中添加重定向 URI：`http://localhost:5000/linkedin/callback`
  - 在 "Products" 标签中启用：
    - ✅ Sign In with LinkedIn using OpenID Connect
    - ✅ Share on LinkedIn

#### 前端环境变量 (`frontend/.env`)

```env
VITE_BACKEND_PORT=5000
# 如果使用不同的后端端口，修改这个值
```

### 4. 运行应用

```bash
# 终端 1：启动后端
cd backend
npm run dev
# 应该看到：Server is running on http://localhost:5000

# 终端 2：启动前端
cd frontend
npm run dev
# 应该看到：Local: http://localhost:3000/
```

### 5. 测试 LinkedIn 连接

1. 访问 `http://localhost:3000`
2. **确保已登录**（必须有有效的用户 ID）
3. 导航到 `http://localhost:3000/socialdashboard`
4. 点击 "Connect LinkedIn" 按钮
5. 应该会跳转到 LinkedIn 授权页面

## ✅ 验证清单

运行前请确认：

- [ ] 已拉取最新代码
- [ ] 后端 `.env` 文件包含所有 LinkedIn 相关配置
- [ ] 前端 `.env` 文件包含 `VITE_BACKEND_PORT=5000`
- [ ] LinkedIn Developer Portal 中已配置重定向 URI
- [ ] LinkedIn 应用已启用必要的产品权限
- [ ] MongoDB 正在运行（如果使用本地 MongoDB）
- [ ] 前后端服务都已启动

## 🔍 常见问题

### 问题 1：点击按钮后没有反应

**检查：**

- 浏览器控制台（F12）是否有错误
- 用户是否已登录（`userId` 不为空）
- 后端是否正在运行

### 问题 2：跳转到 LinkedIn 但显示 "Invalid redirect_uri"

**解决方案：**

- 在 LinkedIn Developer Portal 中检查重定向 URI 是否完全匹配
- 确保使用 `http://localhost:5000/linkedin/callback`（不是 `https://`）
- 如果使用不同的端口，需要更新 LinkedIn 应用中的重定向 URI

### 问题 3：授权后没有跳转回应用

**解决方案：**

- 检查 `CLIENT_URL` 是否正确设置为 `http://localhost:3000`
- 检查前端是否运行在 3000 端口

## 📚 相关文档

- `LINKEDIN_SETUP.md` - 详细的 LinkedIn 集成设置指南
- `LINKEDIN_QUICK_FIX.md` - 快速问题排查指南
- `README.md` - 项目总体说明

## 💡 提示

- 如果修改了环境变量，需要**重启后端服务**才能生效
- 建议使用无痕模式测试，避免缓存问题
- 如果使用共享的 LinkedIn 应用，确保所有开发者都使用相同的配置

## 🆘 需要帮助？

如果遇到问题：

1. 检查浏览器控制台（F12）的错误信息
2. 检查后端终端的日志
3. 参考 `LINKEDIN_SETUP.md` 和 `LINKEDIN_QUICK_FIX.md` 文档
4. 确认所有环境变量都已正确配置
