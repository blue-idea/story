# 数据库设计（Data Design）

> 文件路径：`docs/spec/data.md`
> 版本：1.0.0 · 日期：2026-05-29
> 状态：已定稿

---

## 实体关系概览

系统底层包含两大板块表结构：

1. **NextAuth 核心认证表**：`users`、`accounts`、`sessions`、`verification_tokens`。
2. **小说的创作业务表**：`user_preferences`、`novels`、`novel_profiles`、`chapters`。

---

## 表结构设计

### 1. NextAuth 核心认证表

#### `users` (用户账号主表)

- 存储基础用户资料，支持邮箱免密登录等凭据。

| 字段名           | 数据类型       | 约束                                   | 说明                       |
| ---------------- | -------------- | -------------------------------------- | -------------------------- |
| `id`             | `uuid`         | PRIMARY KEY, DEFAULT gen_random_uuid() | 用户唯一标识               |
| `name`           | `varchar(255)` |                                        | 用户昵称                   |
| `email`          | `varchar(255)` | UNIQUE, NOT NULL                       | 登录邮箱                   |
| `password_hash`  | `text`         |                                        | 凭据登录密码哈希（bcrypt） |
| `email_verified` | `timestamp`    |                                        | 邮箱激活确认时间           |
| `image`          | `varchar(255)` |                                        | 用户头像链接               |

#### `accounts` (第三方联合登录关联表)

- 存储绑定的 OAuth 信息（若未来扩充 GitHub/Google 登录）。

| 字段名              | 数据类型       | 约束                                   | 说明                              |
| ------------------- | -------------- | -------------------------------------- | --------------------------------- |
| `id`                | `uuid`         | PRIMARY KEY, DEFAULT gen_random_uuid() | 唯一标识                          |
| `userId`            | `uuid`         | REFERENCES users(id) ON DELETE CASCADE | 关联的用户 ID                     |
| `type`              | `varchar(255)` | NOT NULL                               | 账户类型 (如 oauth / credentials) |
| `provider`          | `varchar(255)` | NOT NULL                               | 联合提供商 (如 github)            |
| `providerAccountId` | `varchar(255)` | NOT NULL                               | 提供商端的账号 ID                 |
| `refresh_token`     | `text`         |                                        | 刷新令牌                          |
| `access_token`      | `text`         |                                        | 访问令牌                          |
| `expires_at`        | `integer`      |                                        | 令牌过期时间                      |
| `token_type`        | `varchar(255)` |                                        | 令牌类型                          |
| `scope`             | `varchar(255)` |                                        | 授权范围                          |
| `id_token`          | `text`         |                                        | ID 令牌                           |
| `session_state`     | `varchar(255)` |                                        | 会话状态                          |

#### `sessions` (用户会话表)

- 存储登录会话信息。

| 字段名         | 数据类型       | 约束                                   | 说明          |
| -------------- | -------------- | -------------------------------------- | ------------- |
| `id`           | `uuid`         | PRIMARY KEY, DEFAULT gen_random_uuid() | 唯一标识      |
| `sessionToken` | `varchar(255)` | UNIQUE, NOT NULL                       | 会话 Token    |
| `userId`       | `uuid`         | REFERENCES users(id) ON DELETE CASCADE | 关联的用户 ID |
| `expires`      | `timestamp`    | NOT NULL                               | 会话过期时间  |

#### `verification_tokens` (邮箱验证/魔法链接 Token 表)

| 字段名       | 数据类型       | 约束     | 说明           |
| ------------ | -------------- | -------- | -------------- |
| `identifier` | `varchar(255)` | NOT NULL | 邮箱/标识符    |
| `token`      | `varchar(255)` | NOT NULL | 校验 Token     |
| `expires`    | `timestamp`    | NOT NULL | Token 过期时间 |

> 联合主键：`(identifier, token)`

---

### 2. 小说创作业务表

#### `user_preferences` (用户偏好表)

| 字段名        | 数据类型    | 约束                                   | 说明                                 |
| ------------- | ----------- | -------------------------------------- | ------------------------------------ |
| `id`          | `uuid`      | PRIMARY KEY, DEFAULT gen_random_uuid() | 唯一标识                             |
| `user_id`     | `uuid`      | REFERENCES users(id) ON DELETE CASCADE | 关联的用户 ID                        |
| `preferences` | `jsonb`     | NOT NULL                               | 包含题材历史权重、默认设置的 JSON 块 |
| `created_at`  | `timestamp` | DEFAULT now()                          | 创建时间                             |
| `updated_at`  | `timestamp` | DEFAULT now()                          | 更新时间                             |

#### `novels` (小说主表)

| 字段名          | 数据类型       | 约束                                   | 说明                                                            |
| --------------- | -------------- | -------------------------------------- | --------------------------------------------------------------- |
| `id`            | `uuid`         | PRIMARY KEY, DEFAULT gen_random_uuid() | 小说唯一标识                                                    |
| `user_id`       | `uuid`         | REFERENCES users(id) ON DELETE CASCADE | 拥有者 ID                                                       |
| `title`         | `varchar(255)` | NOT NULL                               | 小说标题                                                        |
| `status`        | `varchar(32)`  | NOT NULL, DEFAULT 'draft'              | 状态：`draft`, `planning`, `in_progress`, `completed`, `failed` |
| `core_config`   | `jsonb`        | NOT NULL                               | 核心定位（Q1-Q3）：题材、主角、核心冲突                         |
| `custom_config` | `jsonb`        | NOT NULL                               | 深度配置（Q4-Q8）：世界观、视角、基调、读者、章节数             |
| `created_at`    | `timestamp`    | DEFAULT now()                          | 创建时间                                                        |
| `updated_at`    | `timestamp`    | DEFAULT now()                          | 更新时间                                                        |

> 索引：`idx_novels_user` (user_id), `idx_novels_status` (status)

#### `novel_profiles` (大纲人设定稿表)

| 字段名               | 数据类型    | 约束                                    | 说明                                                                                               |
| -------------------- | ----------- | --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `id`                 | `uuid`      | PRIMARY KEY, DEFAULT gen_random_uuid()  | 唯一标识                                                                                           |
| `novel_id`           | `uuid`      | REFERENCES novels(id) ON DELETE CASCADE | 关联的小说 ID                                                                                      |
| `outline`            | `text`      | NOT NULL                                | 完整大纲 Markdown，结构对齐 `docs/novelist/references/guides/outline-template.md`（含 7 列章节表） |
| `character_profiles` | `jsonb`     | NOT NULL                                | 人物档案，字段对齐 `character-template.md`（非简化 name/role 三元组）                              |
| `created_at`         | `timestamp` | DEFAULT now()                           | 创建时间                                                                                           |
| `updated_at`         | `timestamp` | DEFAULT now()                           | 更新时间                                                                                           |

#### `chapters` (章节明细表)

| 字段名             | 数据类型       | 约束                                    | 说明                                                                                                         |
| ------------------ | -------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `id`               | `uuid`         | PRIMARY KEY, DEFAULT gen_random_uuid()  | 唯一标识                                                                                                     |
| `novel_id`         | `uuid`         | REFERENCES novels(id) ON DELETE CASCADE | 关联的小说 ID                                                                                                |
| `chapter_number`   | `integer`      | NOT NULL                                | 章节序号 (1 至 N)                                                                                            |
| `title`            | `varchar(255)` | NOT NULL                                | 章节标题                                                                                                     |
| `outline_summary`  | `text`         | NOT NULL                                | 本章剧情概要                                                                                                 |
| `content`          | `text`         | DEFAULT ''                              | 生成的正文 Markdown 内容                                                                                     |
| `word_count`       | `integer`      | NOT NULL, DEFAULT 0                     | 字符数                                                                                                       |
| `status`           | `varchar(32)`  | NOT NULL, DEFAULT 'pending'             | 状态：`pending` (待生成), `writing` (生成中), `validating` (校验中), `completed` (完成), `failed` (生成失败) |
| `word_count_valid` | `boolean`      | DEFAULT false                           | 字数检测是否通过 (3000-5000)                                                                                 |
| `suspense_valid`   | `boolean`      | DEFAULT false                           | 结尾悬念钩子是否检测通过                                                                                     |
| `passed`           | `boolean`      | DEFAULT false                           | 综合质量校验是否通过                                                                                         |
| `retry_count`      | `integer`      | NOT NULL, DEFAULT 0                     | 校验失败重试轮数 (上限 3)                                                                                    |
| `validation_log`   | `text`         |                                         | 自动校验诊断说明或错误日志                                                                                   |
| `created_at`       | `timestamp`    | DEFAULT now()                           | 创建时间                                                                                                     |
| `updated_at`       | `timestamp`    | DEFAULT now()                           | 更新时间                                                                                                     |

> 索引：`idx_chapters_novel_num` (novel_id, chapter_number) UNIQUE

---

## Drizzle Schema 定义参考 (TypeScript)

```typescript
import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  integer,
  boolean,
  text,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

// ── NextAuth 核心表 ──────────────────────────────────────────
export const users = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash"),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: varchar("image", { length: 255 }),
});

export const accounts = pgTable("account", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: varchar("type", { length: 255 })
    .$type<AdapterAccount["type"]>()
    .notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  id_token: text("id_token"),
  session_state: varchar("session_state", { length: 255 }),
});

export const sessions = pgTable("session", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: varchar("sessionToken", { length: 255 }).unique().notNull(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

// ── 业务表 ───────────────────────────────────────────────────
export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  preferences: jsonb("preferences").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const novels = pgTable("novels", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: varchar("status", { length: 32 }).default("draft").notNull(), // 'draft' | 'planning' | 'in_progress' | 'completed' | 'failed'
  coreConfig: jsonb("core_config").notNull(), // { genre, protagonist, conflict }
  customConfig: jsonb("custom_config").notNull(), // { worldbuilding, perspective, tone, theme, audience, chapterCount }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const novelProfiles = pgTable("novel_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  novelId: uuid("novel_id")
    .references(() => novels.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  outline: text("outline").notNull(),
  characterProfiles: jsonb("character_profiles").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chapters = pgTable("chapters", {
  id: uuid("id").defaultRandom().primaryKey(),
  novelId: uuid("novel_id")
    .references(() => novels.id, { onDelete: "cascade" })
    .notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  outlineSummary: text("outline_summary").notNull(),
  content: text("content").default("").notNull(),
  wordCount: integer("word_count").default(0).notNull(),
  status: varchar("status", { length: 32 }).default("pending").notNull(), // 'pending' | 'writing' | 'validating' | 'completed' | 'failed'
  wordCountValid: boolean("word_count_valid").default(false).notNull(),
  suspenseValid: boolean("suspense_valid").default(false).notNull(),
  passed: boolean("passed").default(false).notNull(),
  retryCount: integer("retry_count").default(0).notNull(),
  validationLog: text("validation_log"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```
