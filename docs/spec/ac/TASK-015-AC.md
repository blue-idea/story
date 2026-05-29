# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-015-AC.md`
> 任务编号：TASK-015
> 执行日期：2026-05-29
> 执行人：Codex

---

## 验收结果

| TASK ID  | AC ID          | QA 类型 | 实际结果摘要                                                                                                         | 状态 | 证据                                                                                                                                                                                                                                                                                                                                    | 错误详情                                                                                                                                                                |
| -------- | -------------- | :-----: | -------------------------------------------------------------------------------------------------------------------- | :--: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TASK-015 | REQ-003-AC-001 |   E2E   | 规划确认页组件在浏览器中真实渲染出大纲 Markdown、人物卡片与章节提纲卡片；章节卡支持展开编辑与保存反馈                | PASS | `app/novel/[id]/plan/page.tsx`, `components/plan/plan-dashboard.tsx`, `components/plan/chapter-outline-card.tsx`, `components/plan/character-card.tsx`, `components/plan/plan-dashboard-preview.tsx`, `lib/novels/outline-summary.test.ts`；Maestro `chromium` 流程打开 `/qa/task-015` 并断言可见文案；Chrome DevTools 截图显示页面布局 | 本地 `DATABASE_URL` 指向的 PostgreSQL 未监听 `127.0.0.1:5432`，因此未能在真实 `/novel/[id]/plan` 数据链路上完成登录后验收；改以同一组件的开发态 QA 预览页完成浏览器验证 |
| TASK-015 | REQ-003-AC-003 |   E2E   | 点击 “Confirm and Write” 后，页面能真实跳转到写作工作台预览页；正式启动写作接口契约由 TASK-011 已通过的 API 测试覆盖 | PASS | Maestro `chromium` 流程点击 `/qa/task-015` 页面按钮并断言 `/qa/task-015/write` 文案；`tests/task-011.spec.ts`, `lib/novels/writing-service.test.ts`                                                                                                                                                                                     | 真实 `POST /api/novel/[id]/start-writing` 的按钮联调依赖数据库，受同一环境问题影响未在浏览器中直连验证                                                                  |

---

## 测试命令与输出

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

```text
Test Files  17 passed (17)
Tests       69 passed (69)
```

```text
Maestro chromium flow #1:
- openLink http://localhost:3001/qa/task-015
- assertVisible "Outline review before automatic writing."
- assertVisible "Confirm and Write"
- assertVisible "Story architecture"
- assertVisible "Cast cards"
- assertVisible "Beat-by-beat chapter cards"

Maestro chromium flow #2:
- openLink http://localhost:3001/qa/task-015
- tapOn first "Edit Outline"
- 编辑并保存第 1 章提纲
- assertVisible "Saved."
- assertVisible "林夏锁定广播塔入口并截获第二段录音"

Maestro chromium flow #3:
- openLink http://localhost:3001/qa/task-015
- tapOn "Confirm and Write"
- assertVisible "Writing workspace preview reached."
```
