# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-017-AC.md`
> 任务编号：TASK-017
> 执行日期：2026-05-31
> 执行人：Codex

---

## 验收结果

| TASK ID  | AC ID          | QA 类型 | 实际结果摘要                                                                                                                                                                                                                  | 状态 | 证据                                                                                                                                                                                                                                                                                                           | 错误详情 |
| -------- | -------------- | :-----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| TASK-017 | REQ-006-AC-001 |   E2E   | 使用 `docs/spec/info.md` 中的标准测试账号登录真实 `/novel/[id]/read` 页面后，阅读页展示小说标题、章节侧栏、正文区域与显著的 `Export Markdown` 按钮；点击导出按钮后浏览器网络面板记录 `GET /api/novel/[id]/export [200]`。     | PASS | `app/novel/[id]/read/page.tsx`, `components/read/reading-workspace.tsx`, `app/globals.css`；Chrome DevTools 页面快照与全页截图 `.tmp-task017-read-page.png`；网络请求 `reqid=24 GET /api/novel/81015f3d-bc6c-4f4b-a6e4-db80e71713b6/export [200]`                                                              | —        |
| TASK-017 | REQ-006-AC-002 |   E2E   | 在编辑模式下向真实章节正文追加 ` More.` 后点击 `Save Changes`，页面出现 `Changes saved.`，章节侧栏字数从 `56` 更新到 `62`；再次应用润色结果并保存后，侧栏字数更新到 `73`，数据库查询确认 `word_count=73` 与正文持久化。       | PASS | `components/read/reading-workspace.tsx`, `lib/novels/reader-service.ts`, `lib/novels/read-editor.ts`；Chrome DevTools 快照显示 `Saved Count: 62/73` 与 `Changes saved.`；网络请求 `reqid=21`、`reqid=23` 均为 `PUT /chapter/1 [200]`；数据库查询结果 `word_count: 73`                                          | —        |
| TASK-017 | REQ-006-AC-003 |   E2E   | 在编辑模式中选中非空文本并点击 `Polish Selection` 后，页面展示 `Polish preview is ready.`、原文与润色结果预览；点击 `Apply Polish` 仅本地替换正文并提示 `Preview applied locally. Save when ready.`，未在用户保存前自动写库。 | PASS | `components/read/reading-workspace.tsx`, `lib/novels/read-editor.ts`, `lib/writer/polish.ts`；Chrome DevTools 快照显示 `Apply Polish` / `Discard Preview` 与预览文案；网络请求 `reqid=22 POST /api/novel/81015f3d-bc6c-4f4b-a6e4-db80e71713b6/chapter/1/polish [200]`；全页截图 `.tmp-task017-edit-polish.png` | —        |

---

## 测试命令与输出

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

```text
Test Files  22 passed (22)
Tests       89 passed (89)
```

```text
Chrome DevTools E2E notes:
1. 使用 docs/spec/info.md 中的 user@novelist.local / User123! 登录真实页面
2. 打开 /novel/81015f3d-bc6c-4f4b-a6e4-db80e71713b6/read
3. 验证 Export Markdown、Chapter stack、Read Mode / Edit Mode 可见
4. 进入 Edit Mode，向章节末尾追加 " More." 并保存
5. 全选正文，点击 Polish Selection，观察预览卡与 Apply Polish
6. 应用润色结果后再次保存
7. 点击 Export Markdown，网络面板记录 GET /export [200]

Network summary:
- PUT /api/novel/81015f3d-bc6c-4f4b-a6e4-db80e71713b6/chapter/1 [200]
- POST /api/novel/81015f3d-bc6c-4f4b-a6e4-db80e71713b6/chapter/1/polish [200]
- PUT /api/novel/81015f3d-bc6c-4f4b-a6e4-db80e71713b6/chapter/1 [200]
- GET /api/novel/81015f3d-bc6c-4f4b-a6e4-db80e71713b6/export [200]

Database verification:
- word_count: 73
- content: Alpha, beta, gamma, delta. The signal hums beneath the ice. There’s more.
```
