# 实施计划（Tasks）

> 文件路径：`docs/spec/tasks.md`
> 版本：1.0.0 · 日期：2026-05-29

执行时须严格遵循 `docs/spec/requirements.md` 中对应需求的验收标准。
每项任务通过 `_需求:` 引用相关需求编号，通过 `_测试类型:` 关联 QA 执行章节，不在任务中重复需求细节。

---

## 任务清单

### Module 1: 项目基础建设与数据库初始化

- [ ] **TASK-001 · 初始化 Next.js 开发环境与 Drizzle ORM Schema**
  - [ ] 初始化 package.json 并声明核心依赖（next, react, drizzle-orm, pg 等）
  - [ ] 配置 tsconfig.json、eslint、drizzle.config.ts
  - [ ] 编写 db/schema.ts，声明 NextAuth 核心认证表和 novels、novel_profiles、chapters 等业务表
  - [ ] 配置 Husky 和 lint-staged，在 Git 提交前强制执行代码格式化与 lint 检查
  - [ ] 创建 GitHub Actions 工作流 `.github/workflows/ci.yml`，集成自动化代码审计与依赖安全扫描任务

  **验证方式：**
  ```bash
  # 验证 ts 编译
  npx tsc --noEmit
  # 确认 husky 的 pre-commit 与 github workflow 配置文件存在
  test -f .husky/pre-commit && test -f .github/workflows/ci.yml
  ```
  **验收证据：** 终端无报错，项目能成功运行 TypeScript 类型检测；项目中包含可用的 pre-commit 钩子，且 CI 工作流中包含依赖审计（pnpm audit）与安全扫描步骤。
  _需求: `constitution.md`
  _测试类型: Unit

- [ ] **TASK-002 · 数据库连接客户端与 Schema 结构推送**
  - [ ] 编写 db/index.ts 导出 Drizzle 客户端连接
  - [ ] 创建 .env.example 模板，声明 `DATABASE_URL` 等
  - [ ] 运行 Drizzle push 将 schemas 推送到本地 Postgres 数据库，验证表结构创建

  **验证方式：**
  ```bash
  # 运行 Drizzle-kit 验证是否成功连接并推送
  pnpm drizzle-kit push
  ```
  **验收证据：** CLI 输出数据库迁移/推送成功信息，并在 Postgres 管理端能够查看到生成的全部 8 张数据库表。
  _需求: `design.md` §数据库设计
  _测试类型: Manual

---

### Module 2: 认证模块与数据隔离 (NextAuth.js)

- [ ] **TASK-003 · NextAuth.js 配置与轻量邮箱登录/注册**
  - [ ] 安装 next-auth 依赖
  - [ ] 编写 lib/auth.ts 配置 DrizzleAdapter，使用 Credentials 提供商（支持邮箱加密码或魔法无密码极简校验进行开发阶段的快捷测试）
  - [ ] 编写 app/api/auth/[...nextauth]/route.ts
  - [ ] 实现自定义极简登录页面 app/login/page.tsx

  **验证方式：**
  ```bash
  # 运行并检测 auth 路由是否可用
  curl -I http://localhost:3000/api/auth/session
  ```
  **验收证据：** 返回 200 HTTP 响应，登录页面可通过表单顺利进行测试用户的邮箱凭据注册与登录。
  _需求: `requirements.md` 中 REQ-001
  验收标准：REQ-001-AC-001
  _测试类型: E2E

- [ ] **TASK-004 · 认证拦截中间件与多租户隔离**
  - [ ] 编写 middleware.ts 拦截非 /login、/api/auth 的路由，重定向至登录页
  - [ ] 在后端 Route Handlers 中获取当前 session，针对所有增删改查均加入 `where(eq(novels.userId, session.user.id))` 过滤

  **验证方式：**
  ```bash
  # 模拟未登录用户访问受保护接口
  curl -i http://localhost:3000/api/preferences
  ```
  **验收证据：** 未携带 Cookie 访问敏感 API 均重定向至登录页或返回 HTTP 401。
  _需求: `requirements.md` 中 REQ-001
  验收标准：REQ-001-AC-001
  _测试类型: API

---

### Module 3: 小说写手核心逻辑层 (lib/writer)

- [ ] **TASK-005 · 编写 LLM 客户端适配器 (lib/llm.ts)**
  - [ ] 封装 Google Gemini / OpenAI 兼容 SDK 客户端
  - [ ] 实现非流式文本调用接口（用于大纲、标题、诊断信息）
  - [ ] 实现流式 SSE 文本输出接口，支持 `for await (const chunk of stream)` 迭代（用于正文流式写作）

  **验证方式：**
  ```bash
  # 运行 llm.ts 单测模拟调用接口
  pnpm vitest run lib/llm.test.ts
  ```
  **验收证据：** 单元测试通过，适配器成功返回流式块，支持根据配置切换大模型。
  _需求: `design.md` §技术选型
  _测试类型: Unit

- [ ] **TASK-006 · 编写大纲规划与人物档案生成解析逻辑 (lib/writer/planner.ts)**
  - [ ] 编写 planner.ts 模块，根据表单 Q1-Q8 的 JSON 数据组装 Prompt，请求 LLM 生成大纲 Markdown 和人设 JSON
  - [ ] 解析 LLM 回包，提取 `# 大纲` 块及人设角色字段以格式化落库

  **验证方式：**
  ```bash
  # 运行 planner 单测，断言返回的规范 Markdown 与人设格式
  pnpm vitest run lib/writer/planner.test.ts
  ```
  **验收证据：** 单测通过，测试用例中的 AI 大纲可以被正确解析为大纲和人物档案数据模型。
  _需求: `requirements.md` 中 REQ-002, REQ-003
  验收标准：REQ-002-AC-002, REQ-003-AC-001
  _测试类型: Unit

- [ ] **TASK-007 · 编写字数与悬念质量校验模块 (lib/writer/validator.ts)**
  - [ ] 编写 validator.ts，检查生成的章节字数是否介于 3000-5000 字
  - [ ] 调用 LLM 专门识别正文末尾 300 字是否含有“悬念钩子/留白”，返回 boolean
  - [ ] 校验失败时返回详细的诊断日志（如：“字数 2500，少于标准，请在此剧情基础上扩充写 1000 字并增强冲突……”）

  **验证方式：**
  ```bash
  # 运行 validator 单测
  pnpm vitest run lib/writer/validator.test.ts
  ```
  **验收证据：** 测试案例能够根据过短的文本断言为校验失败并产生合理的扩写诊断意见。
  _需求: `requirements.md` 中 REQ-005
  验收标准：REQ-005-AC-001
  _测试类型: Unit

- [ ] **TASK-008 · 编写串行写作状态机 (lib/writer/generator.ts)**
  - [ ] 编写 generator.ts 业务类，按串行顺序遍历章节骨架
  - [ ] 启动单章写作，并将流式正文传输给 SSE 容器
  - [ ] 写完单章触发校验器。校验不合格则携带诊断意见重写，累加 `retryCount` 达到 3 轮未通过或遭遇 LLM 连接异常报错时，抛出致命错误，并将小说及当前章状态修改为 `failed` 挂起任务

  **验证方式：**
  ```bash
  # 测试 generator 串行控制与重试退火逻辑的单测
  pnpm vitest run lib/writer/generator.test.ts
  ```
  **验收证据：** 单测模拟了 3 次校验失败均触发重新请求，以及第 4 次发生异常阻断的正常退出。
  _需求: `requirements.md` 中 REQ-004, REQ-005
  验收标准：REQ-004-AC-002, REQ-005-AC-002, REQ-005-AC-003
  _测试类型: Unit

---

### Module 4: 后端 API (Route Handlers)

- [ ] **TASK-009 · 实现 /api/preferences (偏好与项目续写检测接口)**
  - [ ] 从 userPreferences 表加载历史设置
  - [ ] 扫描 novels 表中属于当前用户的且状态为 `in_progress` 或 `planning` 的最新小说，若有则提取小说名称及当前已生成章节数

  **验证方式：**
  ```bash
  # 请求接口
  curl -b cookie.txt http://localhost:3000/api/preferences
  ```
  **验收证据：** 返回的 JSON 包含 `hasPreferences` 与 `unfinishedProject` 节点且内容与数据库记录吻合。
  _需求: `requirements.md` 中 REQ-001
  验收标准：REQ-001-AC-002
  _测试类型: API

- [ ] **TASK-010 · 实现三层问答创建及大纲管理 API**
  - [ ] 编写 /api/novel/create：接收 Q1-Q8 选项，创建状态为 `draft` 的小说，调用 AI 提取并生成候选标题，返回 novelId 和 candidateTitles
  - [ ] 编写 /api/novel/[id]/confirm-title：确认标题并修改状态为 `planning`，异步触发大纲生成
  - [ ] 编写 /api/novel/[id]/plan (GET/PUT)：用于获取完整规划人设大纲，并支持针对单章的提纲编辑修改

  **验证方式：**
  ```bash
  # 测试新建草稿
  curl -X POST -H "Content-Type: application/json" -d '{"coreConfig":{},"customConfig":{}}' http://localhost:3000/api/novel/create
  ```
  **验收证据：** 各接口返回 200 HTTP 响应，数据库对应的字段状态发生正确更新。
  _需求: `requirements.md` 中 REQ-002, REQ-003
  验收标准：REQ-002-AC-002, REQ-003-AC-002
  _测试类型: API

- [ ] **TASK-011 · 实现流式写作启动及 SSE 接口**
  - [ ] 编写 /api/novel/[id]/start-writing：启动并将章节初始化为 pending
  - [ ] 编写 /api/novel/[id]/write/stream (GET)：初始化 SSE Header，保持长连接。绑定 generator.ts 的事件回调，流式推送：`chapter_start`, `content_chunk`, `validation_start`, `validation_result`, `chapter_complete`, `error`, `novel_complete`

  **验证方式：**
  ```bash
  # 使用 curl 监控 SSE 长连接的推送
  curl -N http://localhost:3000/api/novel/[id]/write/stream
  ```
  **验收证据：** 控制台实时以 Event Stream 格式流式输出 AI 正文块和校验状态包。
  _需求: `requirements.md` 中 REQ-004, REQ-005
  验收标准：REQ-004-AC-001, REQ-005-AC-003
  _测试类型: API

- [ ] **TASK-012 · 实现阅读、保存修改与打包下载 API**
  - [ ] 编写 /api/novel/[id]/chapters：获取章节列表
  - [ ] 编写 /api/novel/[id]/chapter/[chapterNumber] (PUT)：修改指定章节正文并重新计算字数落库
  - [ ] 编写 /api/novel/[id]/export：组合大纲、人设和已完结正文生成 Markdown，添加 `Content-Disposition` 附件下载响应头

  **验证方式：**
  ```bash
  # 测试获取章节列表与下载
  curl http://localhost:3000/api/novel/[id]/export
  ```
  **验收证据：** 接口输出规范拼接好的完整 Markdown 文本。
  _需求: `requirements.md` 中 REQ-006
  验收标准：REQ-006-AC-001, REQ-006-AC-002
  _测试类型: API

---

### Module 5: 前端页面与 WOW 交互 UI (CSS + Component)

- [ ] **TASK-013 · 首页与快捷续写卡片 UI 开发**
  - [ ] 开发首页，加载用户认证与偏好
  - [ ] 美化界面，提供“继续上次创作”的渐显大卡片（包含标题、进度百分比、最后编辑日期）
  - [ ] 提供“开启新小说”按钮，增加磨砂玻璃炫目微动效

  **验证方式：**
  ```bash
  # 运行 Next.js 并在开发浏览器中查看
  pnpm dev
  ```
  **验收证据：** 页面视觉优美，符合暗黑科技风设计，未登录时访问自动拦截到登录。
  _需求: `requirements.md` 中 REQ-001
  验收标准：REQ-001-AC-003
  _测试类型: E2E

- [ ] **TASK-014 · 三层渐进式问答表单页面 UI 开发**
  - [ ] 编写 FormSteps.tsx，实现第一层“核心定位”（题材、主角、冲突）和第二层“深度配置”（世界观、字数等）的选项卡
  - [ ] 添加单选⭐的推荐标记动效（基于用户历史偏好）
  - [ ] 第三阶段展示候选标题发光卡片，支持打字输入自定义标题，提交后加载动效转场

  **验证方式：**
  ```bash
  # 运行开发服务器人工操作表单
  pnpm dev
  ```
  **验收证据：** 表单过渡动画顺滑无突变，提交选项后成功渲染 5 个候选发光卡片标题。
  _需求: `requirements.md` 中 REQ-002
  验收标准：REQ-002-AC-001, REQ-002-AC-003
  _测试类型: E2E

- [ ] **TASK-015 · 大纲规划与人设调整确认页面开发**
  - [ ] 展示生成的大纲 Markdown 块及左右分栏的人物卡片
  - [ ] 列表展示各章节提纲，支持点击编辑图标展开文本框修改，局部保存更新大纲
  - [ ] 提供炫酷按钮“确认规划并开启写作”，点击后酷炫动画转入工作台

  **验证方式：**
  ```bash
  # 打开 /novel/[id]/plan 查看渲染与局部编辑保存
  pnpm dev
  ```
  **验收证据：** 人物档案与章节提纲布局合理，编辑章节概要能实时同步到后端数据库。
  _需求: `requirements.md` 中 REQ-003
  验收标准：REQ-003-AC-001, REQ-003-AC-003
  _测试类型: E2E

- [ ] **TASK-016 · SSE 流式写作监控工作台开发**
  - [ ] 编写 StreamTerminal.tsx 工作台，使用 EventSource 连接 /api/novel/[id]/write/stream
  - [ ] 正文生成区域添加打字机逐字吐出动效，并有实时跳动的字数计数器
  - [ ] 侧边栏展示章节校验面板（字数进度条、悬念钩子检测状态、重试轮次仪表盘）
  - [ ] 发生 error 事件挂起时，终端红字打印故障，展现渐显发光的“重试本章写作”大按钮，点击后清除错误并向后重新建立 SSE 流恢复写作

  **验证方式：**
  ```bash
  # 打开 /novel/[id]/write 模拟流式生成
  pnpm dev
  ```
  **验收证据：** 打字机流式输出流畅，字数动态更新；模拟网络断开时，系统确实安全暂停并出现“重试”按钮，点击重试后连接恢复并续写。
  _需求: `requirements.md` 中 REQ-004, REQ-005
  验收标准：REQ-004-AC-001, REQ-005-AC-004
  _测试类型: E2E

- [ ] **TASK-017 · 完稿阅读、内容修饰与打包导出页面开发**
  - [ ] 小说完结后跳转至阅读界面，提供舒适流畅的双栏或单栏极简读书排版
  - [ ] 允许在段落上直接双击或点击“修改”更新文本，提供“保存修改”按钮
  - [ ] 顶部提供明显的“导出 Markdown”发光按钮，点击后触发整本打包下载

  **验证方式：**
  ```bash
  # 查看 /novel/[id]/read 页面及下载
  pnpm dev
  ```
  **验收证据：** 页面排版舒适，文字可编辑保存，点击导出成功下载出排版整洁的小说 Markdown 文件。
  _需求: `requirements.md` 中 REQ-006
  验收标准：REQ-006-AC-001
  _测试类型: E2E

---

### Module 6: 测试与质量验收

- [ ] **TASK-018 · 编写 Vitest 单元与 API 接口集成测试**
  - [ ] 编写 planner.test.ts、validator.test.ts、generator.test.ts 涵盖核心处理单元与故障重试挂起状态机
  - [ ] 编写 Route Handlers 的 API 契约和数据过滤隔离单测，断言非拥有者访问小说接口返回越权

  **验证方式：**
  ```bash
  # 执行 vitest
  pnpm test
  ```
  **验收证据：** 控制台显示 100% 通过，且行覆盖率达到 80% 以上。
  _需求: `test_strategy.md`
  _测试类型: Unit

- [ ] **TASK-019 · 编写 Playwright UI 端到端用户旅程测试**
  - [ ] 编写 auth-and-planning.spec.ts 覆盖用户邮箱登录、偏好检测、新建小说、生成并修改大纲的全旅程
  - [ ] 编写 writing-fault-retry.spec.ts 覆盖点击写作、模拟拦截报错使写作 failed 挂起、点击重试完成写作、最后导出打包下载的自愈用户旅程，并在运行中保存关键步骤截图

  **验证方式：**
  ```bash
  # 执行 Playwright
  pnpm playwright test
  ```
  **验收证据：** 无头测试全部通过，并在 test-results/ 目录下能正常查看到步骤快照。
  _需求: `test_strategy.md`
  _测试类型: E2E

---

## 进度汇总

| TASK ID | 名称 | 测试类型 | 状态 | 关联需求 |
|---|---|:---:|:---:|---|
| TASK-001 | 初始化 Next.js 开发环境与 Drizzle ORM Schema | Unit | ⬜ 待开始 | `constitution.md` |
| TASK-002 | 数据库连接客户端与 Schema 结构推送 | Manual | ⬜ 待开始 | `design.md` |
| TASK-003 | NextAuth.js 配置与轻量邮箱登录/注册 | E2E | ⬜ 待开始 | REQ-001 |
| TASK-004 | 认证拦截中间件与多租户隔离 | API | ⬜ 待开始 | REQ-001 |
| TASK-005 | 编写 LLM 客户端适配器 (lib/llm.ts) | Unit | ⬜ 待开始 | `design.md` |
| TASK-006 | 编写大纲规划与人物档案生成解析逻辑 (lib/writer/planner.ts) | Unit | ⬜ 待开始 | REQ-002, REQ-003 |
| TASK-007 | 编写字数与悬念质量校验模块 (lib/writer/validator.ts) | Unit | ⬜ 待开始 | REQ-005 |
| TASK-008 | 编写串行写作状态机 (lib/writer/generator.ts) | Unit | ⬜ 待开始 | REQ-004, REQ-005 |
| TASK-009 | 实现 /api/preferences (偏好与项目续写检测接口) | API | ⬜ 待开始 | REQ-001 |
| TASK-010 | 实现三层问答创建及大纲管理 API | API | ⬜ 待开始 | REQ-002, REQ-003 |
| TASK-011 | 实现流式写作启动及 SSE 接口 | API | ⬜ 待开始 | REQ-004, REQ-005 |
| TASK-012 | 实现阅读、保存修改与打包下载 API | API | ⬜ 待开始 | REQ-006 |
| TASK-013 | 首页与快捷续写卡片 UI 开发 | E2E | ⬜ 待开始 | REQ-001 |
| TASK-014 | 三层渐进式问答表单页面 UI 开发 | E2E | ⬜ 待开始 | REQ-002 |
| TASK-015 | 大纲规划与人设调整确认页面开发 | E2E | ⬜ 待开始 | REQ-003 |
| TASK-016 | SSE 流式写作监控工作台开发 | E2E | ⬜ 待开始 | REQ-004, REQ-005 |
| TASK-017 | 完稿阅读、内容修饰与打包导出页面开发 | E2E | ⬜ 待开始 | REQ-006 |
| TASK-018 | 编写 Vitest 单元与 API 接口集成测试 | Unit | ⬜ 待开始 | `test_strategy.md` |
| TASK-019 | 编写 Playwright UI 端到端用户旅程测试 | E2E | ⬜ 待开始 | `test_strategy.md` |
