# 可追溯性矩阵（Traceability）

> 文件路径：`docs/spec/traceability.md`
> 创建步骤：STEP 5（拆分任务，生成初始骨架）
> 更新步骤：STEP 6（每项 TASK 完成后更新状态）

---

## 矩阵说明

| 字段       | 含义                                                 |
| ---------- | ---------------------------------------------------- |
| `TASK ID`  | 任务编号，对应 `tasks.md`                            |
| `REQ / AC` | 关联需求编号和验收标准编号                           |
| `状态`     | `待开始` / `进行中` / `done` / `BLOCKED` / `WONTFIX` |
| `实现文件` | 主要实现代码的文件路径（完成后填写）                 |
| `测试文件` | 对应测试文件路径（完成后填写）                       |
| `AC 报告`  | 验收矩阵文件路径，如 `docs/spec/ac/TASK-XXX-AC.md`   |
| `完成日期` | 任务关闭日期                                         |

---

## 追溯矩阵

| TASK ID     | 任务名称                                     | REQ / AC                               |  状态  | 实现文件                                                                                                                                                                                                          | 测试文件                                                | AC 报告                          | 完成日期   |
| ----------- | -------------------------------------------- | -------------------------------------- | :----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------- | ---------- |
| TASK-001    | 初始化 Next.js 开发环境与 Drizzle ORM Schema | `constitution.md`                      |  done  | `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `drizzle.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `db/schema.ts`, `.husky/pre-commit`, `.github/workflows/ci.yml` | `tests/task-001.spec.ts`                                | `docs/spec/ac/TASK-001-AC.md`    | 2026-05-29 |
| TASK-002    | 数据库连接客户端与 Schema 结构推送           | `design.md`                            |  done  | `db/index.ts`, `.env.example`                                                                                                                                                                                     | `tests/task-002.spec.ts`                                | `docs/spec/ac/TASK-002-AC.md`    | 2026-05-29 |
| TASK-003    | NextAuth.js 配置与轻量邮箱登录/注册          | REQ-001 / AC-001                       |  done  | `package.json`, `db/schema.ts`, `lib/auth.ts`, `types/next-auth.d.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/api/auth/session/route.ts`, `app/login/page.tsx`, `app/login/login-form.tsx`, `.env.example`   | `tests/task-003.spec.ts`, `tests/auth-password.spec.ts` | `docs/spec/ac/TASK-003-AC.md`    | 2026-05-29 |
| TASK-004    | 认证拦截中间件与多租户隔离                   | REQ-001 / AC-001                       |  done  | `middleware.ts`, `app/api/preferences/route.ts`                                                                                                                                                                   | `tests/task-004.spec.ts`                                | `docs/spec/ac/TASK-004-AC.md`    | 2026-05-29 |
| TASK-005    | 编写 LLM 客户端适配器 (lib/llm.ts)           | `design.md`                            |  done  | `lib/llm.ts`                                                                                                                                                                                                      | `lib/llm.test.ts`                                       | `docs/spec/ac/TASK-005-AC.md`    | 2026-05-29 |
| TASK-006    | 编写大纲规划与人设生成解析逻辑               | REQ-002/AC-002, REQ-003/AC-001         |  done  | `lib/writer/planner.ts`                                                                                                                                                                                           | `lib/writer/planner.test.ts`                            | `docs/spec/ac/TASK-006-AC.md`    | 2026-05-29 |
| TASK-006R   | 建立 prompts/ 目录与 lib/prompts 加载器      | `prompts-design.md`, REQ-003, REQ-004  |  done  | `prompts/**`, `config/prompts.ts`, `lib/prompts/loader.ts`, `lib/prompts/types.ts`, `lib/prompts/index.ts`                                                                                                        | `lib/prompts/loader.test.ts`                            | `docs/spec/ac/TASK-006R-AC.md`   | 2026-05-29 |
| TASK-006R-b | 重构 planner 对齐 Phase 2 两次 LLM           | REQ-002, REQ-003                       |  done  | `lib/writer/planner.ts`, `lib/writer/parse-outline.ts`                                                                                                                                                            | `lib/writer/planner.test.ts`                            | `docs/spec/ac/TASK-006R-b-AC.md` | 2026-05-29 |
| TASK-007    | 编写字数与悬念质量校验模块                   | REQ-005 / AC-001                       |  done  | `lib/writer/validator.ts`                                                                                                                                                                                         | `lib/writer/validator.test.ts`                          | `docs/spec/ac/TASK-007-AC.md`    | 2026-05-29 |
| TASK-008    | 编写串行写作状态机                           | REQ-004/AC-002, REQ-005/AC-002, AC-003 |  done  | `lib/writer/generator.ts`                                                                                                                                                                                         | `lib/writer/generator.test.ts`                          | `docs/spec/ac/TASK-008-AC.md`    | 2026-05-29 |
| TASK-009    | 实现 /api/preferences 偏好与项目检测接口     | REQ-001 / AC-002                       |  done  | `app/api/preferences/route.ts`                                                                                                                                                                                    | `tests/api-preferences.spec.ts`                         | `docs/spec/ac/TASK-009-AC.md`    | 2026-05-29 |
| TASK-010    | 实现三层问答创建及大纲管理 API               | REQ-002/AC-002, REQ-003/AC-002         | 待开始 | —                                                                                                                                                                                                                 | —                                                       | —                                | —          |
| TASK-011    | 实现流式写作启动及 SSE 接口                  | REQ-004/AC-001, REQ-005/AC-003         | 待开始 | —                                                                                                                                                                                                                 | —                                                       | —                                | —          |
| TASK-012    | 实现阅读、保存修改与打包下载 API             | REQ-006 / AC-001, AC-002               | 待开始 | —                                                                                                                                                                                                                 | —                                                       | —                                | —          |
| TASK-013    | 首页与快捷续写卡片 UI 开发                   | REQ-001 / AC-003                       | 待开始 | —                                                                                                                                                                                                                 | —                                                       | —                                | —          |
| TASK-014    | 三层渐进式问答表单页面 UI 开发               | REQ-002 / AC-001, AC-003               | 待开始 | —                                                                                                                                                                                                                 | —                                                       | —                                | —          |
| TASK-015    | 大纲规划与人设调整确认页面开发               | REQ-003 / AC-001, AC-003               | 待开始 | —                                                                                                                                                                                                                 | —                                                       | —                                | —          |
| TASK-016    | SSE 流式写作监控工作台开发                   | REQ-004/AC-001, REQ-005/AC-004         | 待开始 | —                                                                                                                                                                                                                 | —                                                       | —                                | —          |
| TASK-017    | 完稿阅读、内容修饰与打包导出页面开发         | REQ-006 / AC-001                       | 待开始 | —                                                                                                                                                                                                                 | —                                                       | —                                | —          |
| TASK-018    | 编写 Vitest 单元与 API 接口集成测试          | `test_strategy.md`                     | 待开始 | —                                                                                                                                                                                                                 | —                                                       | —                                | —          |
| TASK-019    | 编写 Playwright UI 端到端用户旅程测试        | `test_strategy.md`                     | 待开始 | —                                                                                                                                                                                                                 | —                                                       | —                                | —          |

---

## 变更记录

| 日期       | 变更内容                   | 原因                    |
| ---------- | -------------------------- | ----------------------- |
| 2026-05-29 | 初始化矩阵（共 19 项任务） | STEP 5 任务拆分完成     |
| 2026-05-29 | 新增 TASK-006R 完成记录    | STEP 6 执行 TASK-006R   |
| 2026-05-29 | 新增 TASK-006R-b 完成记录  | STEP 6 执行 TASK-006R-b |
