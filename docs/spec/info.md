# 测试信息（Info）

> 文件路径：`docs/spec/info.md`
> 创建步骤：STEP 5（任务拆分 - 补齐基础文件）
> ⚠️ 本文件包含测试凭据，**必须加入 `.gitignore`，禁止提交到版本库**

---

## 测试账号

| 角色 | 邮箱 | 密码 | 备注 |
|---|---|---|---|
| 管理员 | `admin@novelist.local` | `Admin123!` | 拥有全部权限 |
| 普通用户 | `user@novelist.local` | `User123!` | 标准权限，用于大纲与写作测试 |

---

## 测试环境

| 环境 | 基础 URL | 数据库 | 说明 |
|---|---|---|---|
| dev | `http://localhost:3000` | 本地 PostgreSQL | 本地日常开发与测试 |

---

## 第三方服务测试凭据

| 服务 | 密钥 / 配置 | 用途 |
|---|---|---|
| Google Gemini API | `process.env.GEMINI_API_KEY` | 小说大纲及章节写作生成服务 |

---

## 测试数据说明

### 预置种子数据
- 包含在 `userPreferences` 表中的一组默认推荐题材：“悬念、科幻、历史、都市、奇幻”。

### 数据重置方式
```bash
# 运行 Drizzle push 命令重置本地数据库表结构
pnpm drizzle-kit push
```

---

## 使用规范

1. 测试账号与测试数据统一从本文件获取，严禁在测试代码中自行捏造。
2. 本文件已加入 `.gitignore`；敏感信息使用本地环境变量 `.env.local` 引入。
