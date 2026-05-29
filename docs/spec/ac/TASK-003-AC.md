# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-003-AC.md`
> 任务编号：TASK-003
> 执行日期：2026-05-29
> 执行人：Codex

---

## 验收结果

| TASK ID  | AC ID          | QA 类型 | 实际结果摘要                                                                                                                                                                              | 状态 | 证据                                                                                                                  | 错误详情 |
| -------- | -------------- | :-----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--: | --------------------------------------------------------------------------------------------------------------------- | -------- |
| TASK-003 | REQ-001-AC-001 |   E2E   | `pnpm test -- tests/task-003.spec.ts` 通过，验证 `lib/auth.ts`、`app/api/auth/[...nextauth]/route.ts`、`app/api/auth/session/route.ts` 与 `app/login/page.tsx` 已建立自定义登录链路。     | PASS | `pnpm test -- tests/task-003.spec.ts`                                                                                 | —        |
| TASK-003 | REQ-001-AC-001 |   E2E   | `pnpm test -- tests/auth-password.spec.ts` 通过，验证 `users` schema 已包含 `password_hash` 且密码哈希/校验函数行为正确。                                                                 | PASS | `pnpm test -- tests/auth-password.spec.ts`                                                                            | —        |
| TASK-003 | REQ-001-AC-001 |   E2E   | `curl.exe -I http://localhost:3000/api/auth/session` 返回 `HTTP/1.1 200 OK`。                                                                                                             | PASS | `curl.exe -I http://localhost:3000/api/auth/session`                                                                  | —        |
| TASK-003 | REQ-001-AC-001 |   E2E   | 使用 `user@novelist.local / User123!` 走真实 credentials 登录后，`/api/auth/session` 返回已认证用户会话；Maestro 本地 flow 对 `/login` 的 `Email`、`Password`、`Sign in` 可见性断言通过。 | PASS | `Invoke-RestMethod /api/auth/csrf + callback/credentials + /api/auth/session`; `mcp__maestro__.run` (`assertVisible`) | —        |
| TASK-003 | REQ-001-AC-001 |   E2E   | `pnpm exec drizzle-kit push` 完成后，查询 `information_schema.columns` 确认 `public.user` 包含 `password_hash` 列。                                                                       | PASS | `pnpm exec drizzle-kit push`; `node --input-type=module -` 查询 `information_schema.columns`                          | —        |

---

## 备注

- 当前实现已升级为持久化密码方案：`CredentialsProvider` 在注册时写入 `users.password_hash`（bcrypt），登录时必须校验密码哈希。
