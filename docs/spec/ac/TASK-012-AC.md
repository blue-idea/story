# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-012-AC.md`
> 任务编号：TASK-012
> 执行日期：2026-05-31
> 执行人：Codex

---

## 验收结果

| TASK ID  | AC ID          | QA 类型 | 实际结果摘要                                                                                                                                                                         | 状态 | 证据                                                                                                                                | 错误详情 |
| -------- | -------------- | :-----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--: | ----------------------------------------------------------------------------------------------------------------------------------- | -------- |
| TASK-012 | REQ-006-AC-001 |   API   | `GET /api/novel/[id]/export` 实际返回 `200 OK`、`text/markdown; charset=utf-8` 和 `Content-Disposition` 下载头，正文包含标题、人物档案、大纲与章节正文。                             | PASS | `tests/task-012.spec.ts`，`lib/novels/reader-service.test.ts`，手工 `curl` 导出验收                                                 | —        |
| TASK-012 | REQ-006-AC-002 |   API   | `GET /api/novel/[id]/chapters` 实际返回章节列表；`PUT /api/novel/[id]/chapter/[chapterNumber]` 实际返回 `{"success":true,"newWordCount":32}`，并可在后续读取中观察到章节字数已更新。 | PASS | `tests/task-012.spec.ts`，`lib/novels/reader-service.test.ts`，手工 `curl` 读取/保存验收                                            | —        |
| TASK-012 | REQ-006-AC-003 |   API   | `POST /api/novel/[id]/chapter/[chapterNumber]/polish` 在补齐 DeepSeek OpenAI-compatible 回退后，实际返回 `200 OK` 与 `{"polishedText":"第二节 手写内容"}`，未覆盖整章内容。          | PASS | `tests/task-012.spec.ts`，`lib/novels/reader-service.test.ts`，`lib/writer/polish.test.ts`，`lib/llm.test.ts`，手工 `curl` 润色验收 | —        |

---

## 测试命令与输出

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build

curl -b .tmp-task012-cookie.txt http://localhost:3000/api/novel/0078ab4a-1527-4d66-8f05-06be7fe3c732/chapters
curl -b .tmp-task012-cookie.txt -X PUT \
  http://localhost:3000/api/novel/0078ab4a-1527-4d66-8f05-06be7fe3c732/chapter/2 \
  -H "Content-Type: application/json" \
  --data-binary @.tmp-task012-put.json
curl -b .tmp-task012-cookie.txt -X POST \
  http://localhost:3000/api/novel/0078ab4a-1527-4d66-8f05-06be7fe3c732/chapter/2/polish \
  -H "Content-Type: application/json" \
  --data-binary @.tmp-task012-polish.json
curl -D .tmp-task012-export-headers.txt \
  -b .tmp-task012-cookie.txt \
  http://localhost:3000/api/novel/0078ab4a-1527-4d66-8f05-06be7fe3c732/export \
  -o .tmp-task012-export.md
```

```text
Test Files  21 passed (21)
Tests       86 passed (86)

PUT /chapter/2 => {"success":true,"newWordCount":32}
POST /chapter/2/polish => {"polishedText":"第二节 手写内容"}
GET /export => HTTP/1.1 200 OK
content-disposition: attachment; filename="novel.md"; filename*=UTF-8''TASK-012%20Manual%20Novel.md
content-type: text/markdown; charset=utf-8
```
