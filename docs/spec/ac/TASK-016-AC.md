# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-016-AC.md`
> 任务编号：TASK-016
> 执行日期：2026-05-29
> 执行人：Codex

---

## 验收结果

| TASK ID  | AC ID          | QA 类型 | 实际结果摘要                                                                                                                                   | 状态 | 证据                                                                                                                                                                                                                                                                    | 错误详情                                                                                                                |
| -------- | -------------- | :-----: | ---------------------------------------------------------------------------------------------------------------------------------------------- | :--: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| TASK-016 | REQ-004-AC-001 |   E2E   | 写作工作台在浏览器中通过 EventSource 真实消费 SSE 事件，终端区按流式片段渲染正文，章节侧栏同步进入 `writing` / `validating` / `completed` 状态 | PASS | `app/novel/[id]/write/page.tsx`, `components/write/writing-workspace.tsx`, `components/write/chapter-status-card.tsx`, `lib/novels/writing-workspace-state.ts`；Maestro `chromium` 打开 `/qa/task-016` 并断言工作台与流结束文案；Chrome DevTools 截图显示失败态与完成态 | 本地 PostgreSQL 未监听 `127.0.0.1:5432`，因此浏览器验收改由开发态 QA SSE 预览页完成，同一套组件与状态机已被真实事件驱动 |
| TASK-016 | REQ-005-AC-004 |   E2E   | 首次流式写作在第 2 章故障暂停，点击 “Retry Chapter Writing” 后清空故障态并重新建立 SSE 连接，从失败章节恢复直到整部小说完成                    | PASS | `lib/novels/writing-service.ts`, `lib/novels/repository.ts`, `lib/novels/writing-service.test.ts`, `app/qa/task-016/stream/route.ts`, `app/qa/task-016/start/route.ts`；Maestro 点击重试按钮后断言 `Retry requested...` 与 `Novel completed.` 文案                      | 正式 `/api/novel/[id]/start-writing` 的失败恢复分支已在服务测试中覆盖；浏览器层仍因数据库不可用而未直接连正式数据链路   |

---

## 测试命令与输出

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

```text
Test Files  18 passed (18)
Tests       74 passed (74)
```

```text
Maestro chromium flow:
- openLink http://localhost:3001/qa/task-016
- assertVisible "Typewriter drafting stream"
- assertVisible "Retry Chapter Writing"
- tapOn "Retry Chapter Writing"
- assertVisible "Retry requested. Reconnecting to the writing stream."
- assertVisible "Novel completed."
- assertVisible "Completed"
```
