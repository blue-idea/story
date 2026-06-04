# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-021-AC.md`
> 任务编号：TASK-021
> 执行日期：2026-06-04
> 执行人：Codex

---

## 验收结果

| TASK ID  | AC ID          |  QA 类型  | 实际结果摘要                                                                                                                                                        | 状态 | 证据                                                                                                                                                                                                                                                                                                                                                  | 错误详情 |
| -------- | -------------- | :-------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| TASK-021 | REQ-004-AC-003 |   Unit    | 写前上下文改为“章节出场人物 + POV 边界 + 已完成章节摘要链 + 上章结尾片段”，且恢复写作时会读取数据库中已完成章节的历史摘要。                                         | PASS | `lib/writer/context-memory.test.ts`, `lib/writer/chapter-prompt.test.ts`, `lib/writer/generator.test.ts`；断言角色过滤、视角约束文本、摘要链与尾段均被注入 Prompt，并覆盖 failed 后续写场景。                                                                                                                                                         | —        |
| TASK-021 | REQ-004-AC-004 |   Unit    | 章节通过校验后会额外生成并落库 `chapter_summary`，供后续章节复用。                                                                                                  | PASS | `lib/writer/generator.test.ts`；断言 `generateText` 被调用生成摘要，且完成态更新包含 `chapterSummary`。                                                                                                                                                                                                                                               | —        |
| TASK-021 | TS-021-001     |  Static   | 新增 `chapter_summary` 字段与相关类型改动后，TypeScript 仍保持零错误。                                                                                              | PASS | `pnpm exec tsc --noEmit` 真实执行通过。                                                                                                                                                                                                                                                                                                               | —        |
| TASK-021 | TS-021-002     | API / SSE | 使用正式登录会话恢复一部 `failed` 小说后，`/start-writing` 将其恢复为 `in_progress`，`/write/stream` 从第 2 章继续生成，最终写回 `chapter_summary` 并完结整部小说。 | PASS | `curl.exe /api/auth/csrf` + `POST /api/auth/callback/credentials` + `POST /api/novel/{id}/start-writing` + `GET /api/novel/{id}/write/stream`；真实结果显示 chapter1 保持 completed、chapter2 从 failed -> pending -> completed、novels.status -> completed，SSE 输出 `chapter_start` / `validation_result` / `chapter_complete` / `novel_complete`。 | —        |

---

## 测试命令与输出

```bash
pnpm vitest run lib/writer/context-memory.test.ts lib/writer/chapter-prompt.test.ts lib/writer/generator.test.ts
pnpm exec tsc --noEmit
curl.exe http://localhost:3000/api/auth/csrf
curl.exe -X POST http://localhost:3000/api/auth/callback/credentials
curl.exe -X POST http://localhost:3000/api/novel/{id}/start-writing
curl.exe -N http://localhost:3000/api/novel/{id}/write/stream
```

```text
Test Files  3 passed (3)
Tests       7 passed (7)
```

```text
POST /api/novel/c5a3fdcf-c408-4e8c-ac8a-bceb5b099ddb/start-writing
=> {"novelId":"c5a3fdcf-c408-4e8c-ac8a-bceb5b099ddb","status":"in_progress"}

GET /api/novel/c5a3fdcf-c408-4e8c-ac8a-bceb5b099ddb/write/stream
=> event: chapter_start / validation_result(passed=true) / chapter_complete / novel_complete
```
