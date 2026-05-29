# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-007R-AC.md`
> 任务编号：TASK-007R
> 执行日期：2026-05-29
> 执行人：Cursor Agent

---

## 验收结果

| TASK ID   | AC ID              | QA 类型 | 实际结果摘要                                                        | 状态 | 证据                           | 错误详情 |
| --------- | ------------------ | :-----: | ------------------------------------------------------------------- | :--: | ------------------------------ | -------- |
| TASK-007R | 外置 phase4 prompt |  Unit   | `validateChapter` 使用 `renderInstruction('phase4-suspense-check')` | PASS | `validator.test.ts` 用例 3     | —        |
| TASK-007R | 既有行为保持       |  Unit   | 字数/悬念失败诊断与通过路径与原单测一致                             | PASS | `validator.test.ts` 用例 1-2   | —        |
| TASK-007R | JSON 解析          |  Unit   | `parseSuspenseCheckResponse` 支持 `{ "hasHook": bool }`             | PASS | `validator.test.ts` parse 用例 | —        |

---

## 测试命令与输出

```bash
pnpm vitest run lib/writer/validator.test.ts
```

```
Test Files  1 passed (1)
Tests       5 passed (5)
```
