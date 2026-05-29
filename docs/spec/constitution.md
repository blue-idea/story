# 项目宪法（Constitution）

> 文件路径：`docs/spec/constitution.md`
> 版本：1.0.0 · 日期：2026-05-29

---

## 项目说明

本项目为 Novelist 写作网站。基于 `chinese-novelist` 的小说创作技能流程，采用表单和选项式的渐进式问答，引导用户逐步确定小说题材、世界观、人物设定和大纲，并支持串行/并行自动写作，并在界面中流式展现正文创作以及自动化的字数和质量校验/修复过程。

---

## 技术栈

- **主语言**：TypeScript（版本：5.x）
- **运行时 / 框架**：Next.js 14+ (App Router) + Node.js (v18+)
- **包管理器**：pnpm
- **样式方案**：Tailwind CSS (3.x 或 4.x) + Vanilla CSS 动效
- **数据库与 ORM**：PostgreSQL + Drizzle ORM (Drizzle Kit 迁移工具)

### TypeScript 规范

- 启用严格模式（`strict: true`）
- 禁止使用 `any` 和 `unknown` 类型，除非在极个别无法推导的外部第三方库交互中（需有详细注释）
- 禁止使用 `as` 强行断言，除非为确定的测试 Mock 或者是只读配置类型转换
- 禁止编写带 `as any` 或 lint 抑制注释的不安全代码
- 任务完成后自动执行 `pnpm tsc --noEmit` 检查以确保无类型错误

---

## 包管理规范

1. 使用**稳定版**包版本，禁止使用任何 beta / rc / alpha 版本（除非该包没有稳定版且为必需）。
2. 锁文件（`pnpm-lock.yaml`）必须提交到版本控制。
3. 依赖安装一律使用 `pnpm add <pkg>`，开发依赖使用 `pnpm add -D <pkg>`。

---

## 编码安全

### 行级安全（RLS）与数据过滤

- 当前开发版本作为个人或单用户独立部署工具，不强制启用 PostgreSQL 物理 RLS 策略，但所有涉及小说和章节的表均包含 `user_id` 或 `session_id` 字段，并在数据查询（Drizzle query）中强过滤，为后续多租户扩展做准备。

### Rate Limiting

- 所有 AI 写作生成相关的 API 路由须限制每 IP 每小时 60 次请求（主要防止高昂的 AI 额度超支），其他静态数据接口限制每 IP 每小时 200 次请求。超限时返回 HTTP 429 和清晰的错误提示信息。

### API 密钥管理

- 所有密钥（包括 `DATABASE_URL`，`GEMINI_API_KEY` 或 `OPENAI_API_KEY`）必须存储在本地 `.env` 或 `.env.local` 文件中。
- 代码中通过 `process.env.XXX` 引用，禁止硬编码。
- `.env` 文件必须加入 `.gitignore`。

---

## 质量基线

- 代码无明显 Lint 错误和编译错误。
- 提交代码前必须在本地运行并检查编译无误。
- 测试框架：使用 **Vitest** 运行单元测试与后端逻辑测试，使用 **Playwright** 运行 UI 功能与 E2E 流程测试。

---

## 文档结构

```
docs/spec/
├── constitution.md     # 本文件（项目宪法）
├── requirements.md     # 需求与 EARS 验收标准
├── design.md           # 技术设计概览
├── data.md             # 数据库设计
├── api.md              # API 接口设计
├── tasks.md            # 任务拆分清单
├── info.md             # 测试账号与测试数据
├── traceability.md     # 可追溯性矩阵
└── ac/                 # 各任务 AC 验收矩阵
    └── TASK-XXX-AC.md
```
