# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-020-AC.md`
> 任务编号：TASK-020
> 执行日期：2026-06-03
> 执行人：Codex

---

## 验收结果

| TASK ID  | AC ID          |  QA 类型  | 实际结果摘要                                                                    | 状态 | 证据                                                                                                                                                                  | 错误详情 |
| -------- | -------------- | :-------: | ------------------------------------------------------------------------------- | :--: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| TASK-020 | REQ-007-AC-001 |    E2E    | 首页作品管理区成功渲染全部作品卡片，包含标题、状态、更新时间与主操作按钮。      | PASS | `e2e/home-library-management.spec.ts`；截图 `test-results/home-library-management-home-library-management-???????????-chromium/task-020-home-library-before.png`      | -        |
| TASK-020 | REQ-007-AC-002 |   Unit    | `draft` / `planning` 作品被映射为 `Edit -> /novel/[id]/plan`。                  | PASS | `lib/home/home-service.test.ts`，`tests/task-020.spec.ts`                                                                                                             | -        |
| TASK-020 | REQ-007-AC-003 |   Unit    | `in_progress` / `failed` 作品被映射为 `Continue Writing -> /novel/[id]/write`。 | PASS | `lib/home/home-service.test.ts`，`tests/task-020.spec.ts`                                                                                                             | -        |
| TASK-020 | REQ-007-AC-004 |   Unit    | `completed` 作品被映射为 `Read -> /novel/[id]/read`。                           | PASS | `lib/home/home-service.test.ts`，`tests/task-020.spec.ts`                                                                                                             | -        |
| TASK-020 | REQ-007-AC-005 | API / E2E | 删除本人作品返回 `200`，并在前端交互后从作品列表中移除。                        | PASS | `tests/api-novel-management.spec.ts`；截图 `test-results/home-library-management-home-library-management-???????????-chromium/task-020-home-library-after-delete.png` | -        |
| TASK-020 | REQ-007-AC-006 |    API    | 删除非本人作品时返回 `404`，未发生越权删除。                                    | PASS | `tests/api-novel-management.spec.ts`                                                                                                                                  | -        |

---

## 测试命令与输出

```bash
pnpm vitest run lib/home/home-service.test.ts tests/task-013.spec.ts tests/task-020.spec.ts tests/api-novel-management.spec.ts
pnpm test
pnpm typecheck
pnpm lint
pnpm exec playwright test e2e/home-library-management.spec.ts
```

```text
vitest targeted: 4 passed, 9 passed
pnpm test: 30 passed, 122 passed
typecheck: passed
lint: passed
playwright: 1 passed
```

---

## 变更覆盖

- 首页服务：`lib/home/home-service.ts`
- 首页 UI：`components/home/home-dashboard.tsx`、`components/home/work-library.tsx`
- 删除接口：`app/api/novel/[id]/route.ts`、`lib/novels/management-service.ts`、`lib/novels/repository.ts`
- 视觉回归：`app/qa/task-013/page.tsx`、`e2e/home-library-management.spec.ts`
