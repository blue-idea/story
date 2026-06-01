# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-015-AC.md`
> 任务编号：TASK-015
> 执行日期：2026-06-01
> 执行人：Codex

---

## 验收结果

| TASK ID  | AC ID          | QA 类型 | 实际结果摘要                                                                                                | 状态 | 证据                                                                                                                                                                                                                                                                                                                               | 错误详情 |
| -------- | -------------- | :-----: | ----------------------------------------------------------------------------------------------------------- | :--: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| TASK-015 | REQ-003-AC-001 |   E2E   | 规划确认页渲染大纲、人设卡片与章节提纲卡；章节卡可展开编辑并保存，新增编辑图标按钮与确认按钮发光样式。      | PASS | `tests/task-015.spec.ts`（`REQ-003-AC-001` 用例）；`components/plan/chapter-outline-card.tsx`（`plan-text-button-icon`）；`components/plan/plan-dashboard.tsx`（`plan-primary-button-glow`）；`app/globals.css`（按钮发光动画）；Playwright 页面与交互截图：`task-015-qa-2026-06-01.png`、`task-015-qa-edit-save-2026-06-01.png`。 | —        |
| TASK-015 | REQ-003-AC-003 |   E2E   | 点击 “Confirm and Write” 后跳转写作页预览路径；服务端启动写作接口契约由 TASK-011 API 测试继续提供回归保障。 | PASS | `tests/task-015.spec.ts`（QA 预览页可达性用例）；Playwright 点击后 URL 从 `/qa/task-015` 跳转到 `/qa/task-015/write`，截图 `task-015-qa-write-2026-06-01.png`；接口契约回归：`tests/task-011.spec.ts`、`lib/novels/writing-service.test.ts`（既有通过）。                                                                          | —        |

---

## 测试命令与输出

```bash
pnpm test tests/task-015.spec.ts
pnpm typecheck
pnpm test tests/task-013.spec.ts tests/task-014.spec.ts tests/task-015.spec.ts
```

```text
Test Files  1 passed (1)
Tests       3 passed (3)
```

```text
Test Files  3 passed (3)
Tests       9 passed (9)
```

```text
Playwright MCP:
1) 打开 http://localhost:3000/qa/task-015 并保存全页截图 task-015-qa-2026-06-01.png
2) 点击第 1 章 Edit Outline，修改 Outline Summary，点击 Save Outline，保存截图 task-015-qa-edit-save-2026-06-01.png
3) 点击 Confirm and Write，跳转 /qa/task-015/write，保存截图 task-015-qa-write-2026-06-01.png
```
