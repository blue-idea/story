# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/ac/TASK-004-AC.md`
> 任务编号：TASK-004
> 执行日期：2026-05-29
> 执行人：AI Agent

---

## 验收结果

| TASK ID  | AC ID          | QA 类型 | 实际结果摘要                                                             | 状态 | 证据                   | 错误详情 |
| -------- | -------------- | :-----: | ------------------------------------------------------------------------ | :--: | ---------------------- | -------- |
| TASK-004 | REQ-001-AC-001 |   API   | 未携带 Cookie 访问 /api/preferences 成功拦截并重定向到 /login (HTTP 307) | PASS | task-71.log            | —        |
| TASK-004 | REQ-001-AC-001 |  Unit   | middleware.ts 及 session 拦截单元测试均成功跑通                          | PASS | tests/task-004.spec.ts | —        |
