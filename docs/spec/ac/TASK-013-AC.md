# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-013-AC.md`
> 任务编号：TASK-013
> 执行日期：2026-05-31
> 执行人：Codex

---

## 验收结果

| TASK ID  | AC ID          | QA 类型 | 实际结果摘要                                                                                                       | 状态 | 证据                                                                                                                                                                                                                                               | 错误详情 |
| -------- | -------------- | :-----: | ------------------------------------------------------------------------------------------------------------------ | :--: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| TASK-013 | REQ-001-AC-001 |   E2E   | 未登录访问 `/` 时，浏览器真实跳转到 `/login?callbackUrl=%2F`。                                                     | PASS | Playwright MCP `evaluate` 返回 `href: http://localhost:3001/login?callbackUrl=%2F`；截图 `C:/Users/blue/Downloads/task-013-root-redirect-login-2026-05-31T13-42-17-767Z.png`                                                                       | —        |
| TASK-013 | REQ-001-AC-002 |   E2E   | 首页加载偏好摘要（题材、语气、章节目标），并渲染 “Start New Novel” 按钮。                                          | PASS | `tests/task-013.spec.ts`；实现文件 `app/page.tsx`, `components/home/home-dashboard.tsx`, `lib/home/home-service.ts`；视觉截图 `C:/Users/blue/Downloads/task-013-qa-home-2026-05-31T13-41-59-479Z.png`                                              | —        |
| TASK-013 | REQ-001-AC-003 |   E2E   | 检测到未完成项目时渲染 “Continue Writing” 快捷续写卡片，包含标题、进度、最后编辑时间，按钮目标指向项目工作区路径。 | PASS | `tests/task-013.spec.ts`（断言 `Continue Writing`、`/novel/{id}/write`、进度与最后编辑文案）；`config/home.ts` 与 `lib/home/home-service.ts`（`planning -> /plan`、`in_progress -> /write`）；截图 `task-013-qa-home-2026-05-31T13-41-59-479Z.png` | —        |

---

## 测试命令与输出

```bash
pnpm test tests/task-013.spec.ts
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

```text
tests/task-013.spec.ts: 3 passed
Test Files  23 passed (23)
Tests       92 passed (92)
typecheck: passed
lint: passed
build: passed
```

```text
Playwright MCP:
1) navigate http://localhost:3001/qa/task-013
   screenshot => C:\Users\blue\Downloads\task-013-qa-home-2026-05-31T13-41-59-479Z.png
2) navigate http://localhost:3001/
   evaluate => href: http://localhost:3001/login?callbackUrl=%2F
   screenshot => C:\Users\blue\Downloads\task-013-root-redirect-login-2026-05-31T13-42-17-767Z.png
```
