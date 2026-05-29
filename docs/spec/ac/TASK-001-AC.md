# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-001-AC.md`
> 任务编号：TASK-001
> 执行日期：2026-05-29
> 执行人：Codex

---

## 验收结果

| TASK ID  | AC ID           | QA 类型 | 实际结果摘要                                                                                                                                                                                 | 状态 | 证据                                                                                                   | 错误详情 |
| -------- | --------------- | :-----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--: | ------------------------------------------------------------------------------------------------------ | -------- |
| TASK-001 | TASK-001-AC-001 |  Unit   | `pnpm test` 通过，验证 `package.json`、`tsconfig.json`、`drizzle.config.ts`、`db/schema.ts`、`eslint.config.mjs`、`next.config.ts`、`.husky/pre-commit`、`.github/workflows/ci.yml` 已创建。 | PASS | `pnpm test`                                                                                            | —        |
| TASK-001 | TASK-001-AC-002 |  Unit   | `pnpm test` 通过，验证 `db/schema.ts` 导出 `users`、`accounts`、`sessions`、`verificationTokens`、`userPreferences`、`novels`、`novelProfiles`、`chapters` 共 8 张核心表。                   | PASS | `pnpm test`                                                                                            | —        |
| TASK-001 | TASK-001-AC-003 |  Unit   | `pnpm typecheck`、`pnpm lint`、`pnpm build` 全部通过；`pnpm audit --registry https://registry.npmjs.org --json` 返回 `0` 个漏洞，CI 已包含 `pnpm audit` 与 `CodeQL`。                        | PASS | `pnpm typecheck`; `pnpm lint`; `pnpm build`; `pnpm audit --registry https://registry.npmjs.org --json` | —        |
