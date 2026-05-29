# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-006R-b-AC.md`
> 任务编号：TASK-006R-b
> 执行日期：2026-05-29
> 执行人：Cursor Agent

---

## 验收结果

| TASK ID     | AC ID            | QA 类型 | 实际结果摘要                                                         | 状态 | 证据                             | 错误详情 |
| ----------- | ---------------- | :-----: | -------------------------------------------------------------------- | :--: | -------------------------------- | -------- |
| TASK-006R-b | REQ-002 配置字段 |  Unit   | `PlannerInput` 使用 `coreConfig` / `customConfig`（Q1-Q8）           | PASS | `lib/writer/planner.ts` 类型定义 | —        |
| TASK-006R-b | phase1-title     |  Unit   | `generateCandidateTitles` 调用外置 prompt 并解析编号标题             | PASS | `planner.test.ts` 用例 3         | —        |
| TASK-006R-b | 两次 LLM 顺序    |  Unit   | `runPhase2Planning` 先 outline 再 characters，共 2 次 `generateText` | PASS | `planner.test.ts` 用例 6         | —        |
| TASK-006R-b | 7 列解析         |  Unit   | `parseChaptersFromOutline` 从 fixture 解析 `outlineSummary` 含 7 列  | PASS | `planner.test.ts` 用例 1         | —        |

---

## 测试命令与输出

```bash
pnpm vitest run lib/writer/planner.test.ts
```

```
Test Files  1 passed (1)
Tests       6 passed (6)
```
