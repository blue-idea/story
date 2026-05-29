# 测试策略简报（Test Strategy）

> 文件路径：`docs/spec/test_strategy.md`
> 参考方法论：`phases/qa_engine.md` §第1阶段
> 版本：1.0.0 · 日期：2026-05-29

---

## 项目信息

```yaml
project:
  name: "Novelist 写作网站"
  type: web-app
  languages: [TypeScript]
  frameworks: [Next.js, Drizzle ORM, NextAuth.js]
```

---

## 风险概况

```yaml
risk_profile:
  data_sensitivity: medium  # 包含用户认证状态及小说创作成果
  user_impact: b2c          # 独立开发者及创作者用户
  deployment_frequency: daily
  regulatory: [none]
```

---

## 测试范围

```yaml
test_scope:
  in_scope:
    - "基于 NextAuth.js 的邮箱凭据认证与隔离控制"
    - "三层渐进式问答表单录入与草稿生成"
    - "大纲与人设生成预览，大纲单章保存"
    - "基于 SSE 的串行自动创作流程与打字机效果渲染"
    - "小说创作质量自动校验（字数 >=3000、悬念检测）与 3 轮自动扩写"
    - "AI 接口网络故障 / 校验失败超限时的暂停机制与‘重试本章’自愈逻辑"
    - "小说手动修改与 Markdown 打包导出"
  out_of_scope:
    - "Google Gemini API 外部服务的稳定性与网络吞吐：仅对 API 调用异常进行 Mock 与阻断处理，不验证其外部服务本身的服务等级协议"
```

---

## 测试类型决策

| 测试类型 | 是否执行 | 覆盖目标 | 工具 |
|---|:---:|---|---|
| 单元测试 | ✅ | 核心业务模型（大纲解析、字数/悬念校验、重试状态机等），行覆盖率 80%+ | Vitest |
| 集成 / API 测试 | ✅ | 涵盖 `/api/preferences`、`/api/novel/create` 等端点的契约和逻辑验证 | Vitest (API Route Handlers 模拟测试) |
| E2E 测试 | ✅ | 覆盖两条关键用户旅程：<br>1. 用户注册/登录后从零问答生成大纲确认开始写作。<br>2. 写作台经历故障挂起后，点击重试成功生成并打包下载。 | Playwright |
| 性能测试 | ❌ | 本应用为单用户/个人轻量开发工具，不做高并发压测 | — |
| 安全测试 | ✅ | 针对 Route Handler 端点进行拥有权隔离过滤测试，验证防越权 | Vitest / 手动 curl |

---

## 测试金字塔目标比例

```
单元测试：70%
集成测试：20%
E2E 测试：10%
```

> **比例说明**：核心控制器、校验算法、大纲生成器均采用 TDD 单元测试覆盖；接口输入输出通过集成测试覆盖；Playwright 仅用于保障几条主要的用户端到端操作路径不崩盘，避免冰淇淋蛋筒反模式。

---

## 环境配置

```yaml
environments:
  dev:
    url: "http://localhost:3000"
    db: "local"
```

---

## 测试数据策略

| 测试层级 | 数据来源 | 清理策略 |
|---|---|---|
| 单元测试 | Factory 内存对象与 Mock 函数 | 不需要清除 |
| 集成测试 | Drizzle 事务与单元隔离 (测试数据库) | 每套件/用例执行完毕后清空表，或在事务回滚中执行 |
| E2E 测试 | `docs/spec/info.md` 中预设的普通测试账号 | 测试套件前通过 Drizzle 注入测试账号，执行完后级联删除该账号下的 novels 记录 |

> **重要**：严禁在测试代码中硬编码敏感账号。统一读取 `docs/spec/info.md` 结合本地环境变量。

---

## 质量基线（最低通过标准）

| 指标 | 目标值 |
|---|---|
| 行覆盖率 | ≥ 80% |
| 关键路径覆盖率 | 100% |
| E2E 不稳定率 | < 2% |
| CI 检查 | 运行 `pnpm test` 和 `pnpm playwright test` 无红灯 |
| 质量评分 | ≥ 61（按照 qa_engine.md §第8阶段计算） |
