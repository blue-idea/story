# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-022-AC.md`
> 任务编号：TASK-022
> 执行日期：2026-06-04
> 执行人：Codex

---

## 验收结果

| TASK ID  | AC ID           | QA 类型 | 实际结果摘要                                                                                          | 状态 | 证据                                                                                                                                                                                                                                                          | 错误详情 |
| -------- | --------------- | :-----: | ----------------------------------------------------------------------------------------------------- | :--: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| TASK-022 | REQ-002-AC-002d |   E2E   | 向导除首题外提供 `Back`；从 `Jump to Q8` 后点击 `Back` 会返回最近实际访问的 Q4 追问，并保留已填内容。 | PASS | `lib/novels/wizard-ui-state.test.ts`；`components/novel-wizard/novel-wizard.tsx`；`e2e/wizard-back-navigation.spec.ts`；截图 `test-results/wizard-back-navigation-REQ-002-AC-002d-向导支持后退回到刚刚访问的步骤并重新选择-chromium/task-022-wizard-back.png` | —        |

---

## 测试命令与真实结果

```bash
pnpm test lib/novels/wizard-ui-state.test.ts tests/task-014.spec.ts
pnpm exec playwright test e2e/wizard-back-navigation.spec.ts
pnpm exec playwright test e2e/auth-and-planning.spec.ts
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

```text
pnpm test lib/novels/wizard-ui-state.test.ts tests/task-014.spec.ts
Test Files  2 passed (2)
Tests       11 passed (11)

pnpm exec playwright test e2e/wizard-back-navigation.spec.ts
1 passed (chromium)

pnpm exec playwright test e2e/auth-and-planning.spec.ts
1 passed (chromium)
```

```text
pnpm test
Test Files  31 passed (31)
Tests       129 passed (129)

pnpm typecheck
passed

pnpm lint
passed

pnpm build
Compiled successfully
```
