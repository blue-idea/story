# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-006R-AC.md`
> 任务编号：TASK-006R
> 执行日期：2026-05-29
> 执行人：Cursor Agent

---

## 验收结果

| TASK ID   | AC ID             | QA 类型 | 实际结果摘要                                                               | 状态 | 证据                                  | 错误详情 |
| --------- | ----------------- | :-----: | -------------------------------------------------------------------------- | :--: | ------------------------------------- | -------- |
| TASK-006R | prompts-design §4 |  Unit   | `getSystem` 返回 editor/author/reviewer 非空人设文案                       | PASS | `lib/prompts/loader.test.ts` 用例 1-2 | —        |
| TASK-006R | 变量注入          |  Unit   | `renderInstruction('phase1-title')` 注入 genre/protagonist/conflict 等变量 | PASS | `lib/prompts/loader.test.ts` 用例 3   | —        |
| TASK-006R | phase3 字数/悬念  |  Unit   | `phase3-chapter-draft` 输出含 3000、5000 与悬念/钩子约束                   | PASS | `lib/prompts/loader.test.ts` 用例 4   | —        |
| TASK-006R | 模版加载          |  Unit   | `loadTemplate('outline')` 含「章节规划」「章首引子类型」                   | PASS | `lib/prompts/loader.test.ts` 用例 5   | —        |
| TASK-006R | 缺失文件报错      |  Unit   | 非法 instruction/system id 抛出 `PromptFileNotFoundError`                  | PASS | `lib/prompts/loader.test.ts` 用例 6-7 | —        |

---

## 测试命令与输出

```bash
pnpm vitest run lib/prompts/loader.test.ts
```

```
Test Files  1 passed (1)
Tests       7 passed (7)
```
