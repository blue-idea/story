# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-018-AC.md`
> 任务编号：TASK-018
> 执行日期：2026-06-01
> 执行人：Codex

---

## 验收结果

| TASK ID  | AC ID      | QA 类型 | 实际结果摘要                                                                                   | 状态 | 证据                                                                                                                                                                                   | 错误详情 |
| -------- | ---------- | :-----: | ---------------------------------------------------------------------------------------------- | :--: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| TASK-018 | TS-018-001 |  Unit   | `planner/validator/generator` 相关单元测试保持通过，核心写作链路与重试状态机回归通过。         | PASS | `lib/writer/planner.test.ts`, `lib/writer/validator.test.ts`, `lib/writer/generator.test.ts`；全量 `pnpm test --coverage` 显示 `Test Files 27 passed`、`Tests 109 passed`。            | —        |
| TASK-018 | TS-018-002 |  Unit   | 新增 Route Handlers 越权隔离单测：已登录非拥有者访问小说接口返回 `404`（拒绝泄露资源存在性）。 | PASS | `tests/task-010.spec.ts`, `tests/task-011.spec.ts`, `tests/task-012.spec.ts` 新增越权用例；`lib/api/novel-route.ts` 增强错误类型识别（`instanceof + error.name + constructor.name`）。 | —        |
| TASK-018 | TS-018-003 |  Unit   | 覆盖率门禁已启用并达标：行覆盖率 `84.91%`（≥80%）。                                            | PASS | `vitest.config.ts` 新增 coverage 配置与阈值；`pnpm test --coverage` 输出：`Lines 84.91%`、`Statements 84.66%`、`Functions 100%`、`Branches 63.35%`（阈值 60%）。                       | —        |

---

## 测试命令与输出

```bash
pnpm test tests/task-010.spec.ts tests/task-011.spec.ts tests/task-012.spec.ts
pnpm test --coverage
pnpm typecheck
pnpm lint
```

```text
Test Files  3 passed (3)
Tests       21 passed (21)
```

```text
Test Files  27 passed (27)
Tests       109 passed (109)

Coverage summary:
Statements   : 84.66%
Branches     : 63.35%
Functions    : 100%
Lines        : 84.91%
```
