# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-010-AC.md`
> 任务编号：TASK-010
> 执行日期：2026-05-29
> 执行人：Codex

---

## 验收结果

| TASK ID  | AC ID           | QA 类型 | 实际结果摘要                                                                         | 状态 | 证据                                                                            | 错误详情 |
| -------- | --------------- | :-----: | ------------------------------------------------------------------------------------ | :--: | ------------------------------------------------------------------------------- | -------- |
| TASK-010 | REQ-002-AC-002c |   API   | `confirm-config`、`titles` 与 `wizard` 分步链路按预期保存 `draft` 配置并返回候选标题 | PASS | `tests/task-010.spec.ts` 路由用例；`lib/novels/wizard-service.test.ts` 服务用例 | —        |
| TASK-010 | REQ-002-AC-003  |   API   | `confirm-title` 成功更新标题并将小说状态切换为 `planning`，随后持久化规划结果        | PASS | `tests/task-010.spec.ts` 路由用例；`lib/novels/wizard-service.test.ts` 服务用例 | —        |
| TASK-010 | REQ-003-AC-001  |   API   | `GET /api/novel/[id]/plan` 返回大纲、人设与章节列表；`PUT /plan` 成功保存单章摘要    | PASS | `tests/task-010.spec.ts` 路由用例；`lib/novels/wizard-service.test.ts` 服务用例 | —        |

---

## 测试命令与输出

```bash
pnpm test -- lib/novels/wizard-service.test.ts tests/task-010.spec.ts
```

```text
Test Files  2 passed (2)
Tests       17 passed (17)
```
