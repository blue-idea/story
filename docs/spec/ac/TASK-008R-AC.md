# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-008R-AC.md`
> 任务编号：TASK-008R
> 执行日期：2026-05-29
> 执行人：Cursor Agent

---

## 验收结果

| TASK ID   | AC ID          | QA 类型 | 实际结果摘要                                                      | 状态 | 证据                                 | 错误详情 |
| --------- | -------------- | :-----: | ----------------------------------------------------------------- | :--: | ------------------------------------ | -------- |
| TASK-008R | phase3-draft   |  Unit   | 初稿使用 `phase3-chapter-draft`，含 7 列规划、人物、3000/悬念约束 | PASS | `generator.test.ts` 首次 stream 调用 | —        |
| TASK-008R | phase3-rewrite |  Unit   | 重试使用 `phase3-chapter-rewrite` + `diagnosticLog`               | PASS | `generator.test.ts` 第 2 次调用      | —        |
| TASK-008R | 无自动润色     |  Unit   | `generator.ts` 未引用 `phase3-chapter-polish`                     | PASS | 代码审查                             | —        |
| TASK-008R | 重试逻辑保持   |  Unit   | 3 次重试后第 4 次失败仍触发 `onError`                             | PASS | `generator.test.ts` 主用例           | —        |

---

## 测试命令与输出

```bash
pnpm vitest run lib/writer/generator.test.ts lib/writer/chapter-prompt.test.ts
```

```
Test Files  2 passed (2)
Tests       2 passed (2)
```
