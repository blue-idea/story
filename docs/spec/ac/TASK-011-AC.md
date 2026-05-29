# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-011-AC.md`
> 任务编号：TASK-011
> 执行日期：2026-05-29
> 执行人：Codex

---

## 验收结果

| TASK ID  | AC ID          | QA 类型 | 实际结果摘要                                                                             | 状态 | 证据                                                                             | 错误详情 |
| -------- | -------------- | :-----: | ---------------------------------------------------------------------------------------- | :--: | -------------------------------------------------------------------------------- | -------- |
| TASK-011 | REQ-003-AC-003 |   API   | `POST /api/novel/[id]/start-writing` 成功将小说切换为 `in_progress` 并初始化章节写作状态 | PASS | `tests/task-011.spec.ts` 路由用例；`lib/novels/writing-service.test.ts` 服务用例 | —        |
| TASK-011 | REQ-004-AC-001 |   API   | `GET /api/novel/[id]/write/stream` 以 `text/event-stream` 返回串行写作事件流             | PASS | `tests/task-011.spec.ts` 路由用例；`lib/novels/writing-service.test.ts` 服务用例 | —        |
| TASK-011 | REQ-005-AC-003 |   API   | 写作失败时 SSE 输出 `error` 事件并带 `failed` 状态与错误消息                             | PASS | `lib/novels/writing-service.test.ts` 失败分支用例                                | —        |

---

## 测试命令与输出

```bash
pnpm test -- lib/novels/writing-service.test.ts tests/task-011.spec.ts
```

```text
Test Files  2 passed (2)
Tests       7 passed (7)
```
