# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-002-AC.md`
> 任务编号：TASK-002
> 执行日期：2026-05-29
> 执行人：Codex

---

## 验收结果

| TASK ID  | AC ID           | QA 类型 | 实际结果摘要                                                                                                                                                                                                                                      | 状态 | 证据                                                                                             | 错误详情 |
| -------- | --------------- | :-----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--: | ------------------------------------------------------------------------------------------------ | -------- |
| TASK-002 | TASK-002-AC-001 |  Unit   | `pnpm test -- tests/task-002.spec.ts` 通过，验证 `db/index.ts` 已导出 `client`、`db` 与 `schema`。                                                                                                                                                | PASS | `pnpm test -- tests/task-002.spec.ts`                                                            | —        |
| TASK-002 | TASK-002-AC-002 |  Unit   | `pnpm test -- tests/task-002.spec.ts` 通过，验证 `.env.example` 已声明 `DATABASE_URL`、`NEXTAUTH_SECRET`、`GEMINI_API_KEY`、`OPENAI_API_KEY`。                                                                                                    | PASS | `pnpm test -- tests/task-002.spec.ts`                                                            | —        |
| TASK-002 | TASK-002-AC-003 | Manual  | `pnpm exec drizzle-kit push` 成功返回 `Changes applied`；随后通过 `pg` 真实查询 `information_schema.tables`，确认 `account`、`chapters`、`novel_profiles`、`novels`、`session`、`user`、`user_preferences`、`verificationToken` 共 8 张表已存在。 | PASS | `pnpm exec drizzle-kit push`; `node --input-type=module -` 查询 `information_schema.tables` 结果 | —        |
