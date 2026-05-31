# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-014-AC.md`
> 任务编号：TASK-014
> 执行日期：2026-05-31
> 执行人：Codex

---

## 验收结果

| TASK ID  | AC ID           | QA 类型 | 实际结果摘要                                                                                     | 状态 | 证据                                                                                                                                                                                                                | 错误详情 |
| -------- | --------------- | :-----: | ------------------------------------------------------------------------------------------------ | :--: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| TASK-014 | REQ-002-AC-001  |   E2E   | 新建向导首屏仅展示 Layer1 当前题（Q1），未显示 Layer2 或标题区；Q1→Q2→Q3 为逐题推进。            | PASS | `tests/task-014.spec.ts`；`components/novel-wizard/novel-wizard.tsx`；截图 `C:/Users/blue/Downloads/task-014-layer1-q1-v2-2026-05-31T13-59-14-868Z.png`                                                             | —        |
| TASK-014 | REQ-002-AC-001b |   E2E   | 完成 Q1-Q3 后进入 Layer1 Summary，需用户显式点击 “Enter Layer 2” 才进入下一层。                  | PASS | `lib/novels/wizard-ui-state.test.ts`（状态机断言 summary→enterLayer2）；`components/novel-wizard/novel-wizard.tsx`                                                                                                  | —        |
| TASK-014 | REQ-002-AC-002  |   E2E   | Layer2 单题模式下提供 “Skip This Question / Random Suggestion / Jump to Q8” 操作。               | PASS | `lib/novels/wizard-ui-state.test.ts`；`components/novel-wizard/novel-wizard.tsx`；截图 `C:/Users/blue/Downloads/task-014-layer2-q4-2026-05-31T13-59-32-132Z.png`                                                    | —        |
| TASK-014 | REQ-002-AC-002b |   E2E   | Q8 后先展示 Configuration Review，点击 “Confirm Configuration” 后才进入 Title candidates。       | PASS | `lib/novels/wizard-ui-state.test.ts`（config-review 前不显示 Layer3，确认后进入 titles）；Playwright 操作结果 `hasTitles: true`；截图 `C:/Users/blue/Downloads/task-014-layer3-titles-2026-05-31T13-59-56-953Z.png` | —        |
| TASK-014 | REQ-002-AC-002c |   API   | 向导配置确认调用 `POST /api/novel/[id]/wizard/confirm-config`；请求契约与返回结构符合预期。      | PASS | `lib/novels/wizard-api-client.test.ts`（`confirmWizardConfigRequest`） + `tests/task-010.spec.ts`（Route Handler 端到端契约）                                                                                       | —        |
| TASK-014 | REQ-002-AC-003  |   API   | 标题确认调用 `POST /api/novel/[id]/confirm-title` 并返回 `planning`；UI 提供候选标题与确认按钮。 | PASS | `lib/novels/wizard-api-client.test.ts`（`confirmWizardTitleRequest`） + `tests/task-010.spec.ts`（Route Handler 返回 `planning`） + `components/novel-wizard/novel-wizard.tsx`（Title candidates + Confirm Title）  | —        |
| TASK-014 | REQ-002-AC-004  |   E2E   | 历史偏好在选项区置顶并标记 ★（题材、基调、章节数）。                                             | PASS | `lib/novels/wizard-ui-state.test.ts`（`sortOptionsByPreference`） + `components/novel-wizard/novel-wizard.tsx`（`★ Preferred` 展示）                                                                                | —        |

---

## 测试命令与输出

```bash
pnpm test tests/task-014.spec.ts lib/novels/wizard-ui-state.test.ts lib/novels/wizard-api-client.test.ts
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

```text
task-014 related tests: 11 passed
Test Files  26 passed (26)
Tests       103 passed (103)
typecheck: passed
lint: passed
build: passed
```

```text
Playwright MCP visual regression (http://localhost:3001/qa/task-014):
1) Initial Layer1 screen screenshot
   C:\Users\blue\Downloads\task-014-layer1-q1-v2-2026-05-31T13-59-14-868Z.png
2) Layer2 screenshot after Q1→Q3→Enter Layer 2
   C:\Users\blue\Downloads\task-014-layer2-q4-2026-05-31T13-59-32-132Z.png
3) Layer3 title candidates screenshot after Jump to Q8 + Confirm Configuration
   C:\Users\blue\Downloads\task-014-layer3-titles-2026-05-31T13-59-56-953Z.png
```
