# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-019-AC.md`
> 任务编号：TASK-019
> 执行日期：2026-06-01
> 执行人：Codex

---

## 验收结果

| TASK ID  | AC ID      | QA 类型 | 实际结果摘要                                                                                                           | 状态 | 证据                                                                                                                                                                                                                                                                                                                                                         | 错误详情 |
| -------- | ---------- | :-----: | ---------------------------------------------------------------------------------------------------------------------- | :--: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| TASK-019 | TS-019-001 |   E2E   | `auth-and-planning.spec.ts` 覆盖登录页输入、偏好卡检测、新建向导推进、标题确认后进入规划页，并验证章节提纲可编辑保存。 | PASS | `e2e/auth-and-planning.spec.ts`; 关键截图：`test-results/auth-and-planning-auth-and-planning：登录页到大纲编辑旅程-chromium/task-019-login.png`, `test-results/auth-and-planning-auth-and-planning：登录页到大纲编辑旅程-chromium/task-019-planning.png`; QA 串联页：`app/qa/task-013/page.tsx`, `app/qa/task-014/page.tsx`, `app/qa/task-019/plan/page.tsx` | —        |
| TASK-019 | TS-019-002 |   E2E   | `writing-fault-retry.spec.ts` 覆盖确认写作、故障挂起、点击重试恢复完成，并验证导出下载文件内容。                       | PASS | `e2e/writing-fault-retry.spec.ts`; 重试截图：`test-results/writing-fault-retry-writing-fault-retry：故障暂停、重试恢复与导出下载-chromium/task-019-retry-complete.png`; 导出文件：`test-results/writing-fault-retry-writing-fault-retry：故障暂停、重试恢复与导出下载-chromium/qa-task-019.md`; QA 导出路由：`app/qa/task-019/export/download/route.ts`      | —        |
| TASK-019 | TS-019-003 |   E2E   | Playwright 无头执行通过，`test-results/` 目录生成步骤截图与下载产物，满足任务验收中“关键步骤快照可查看”的要求。        | PASS | `playwright.config.ts`（`testDir=e2e`, `webServer`, `chromium` 项目）；执行结果：`pnpm exec playwright test` -> `2 passed`; 产物目录：`test-results/`。                                                                                                                                                                                                      | —        |

---

## 测试命令与输出

```bash
pnpm exec playwright test
```

```text
Running 2 tests using 2 workers
  ok auth-and-planning：登录页到大纲编辑旅程
  ok writing-fault-retry：故障暂停、重试恢复与导出下载
2 passed
```
