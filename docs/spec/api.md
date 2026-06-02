# 接口设计（API Design）

> 文件路径：`docs/spec/api.md`
> 版本：1.2.0 · 日期：2026-06-03
> 状态：已定稿

---

## 接口总览

后端接口使用 Next.js App Router 的 Route Handlers 实现，统一以前缀 `/api` 暴露。

| 路由                                             | 方法     | 功能说明                           | 响应格式        |
| ------------------------------------------------ | -------- | ---------------------------------- | --------------- |
| `/api/auth/[...nextauth]`                        | GET/POST | NextAuth.js 认证端点               | HTML / JSON     |
| `/api/preferences`                               | GET      | 获取当前登录用户偏好与最近活跃作品 | JSON            |
| `/api/preferences`                               | POST     | 保存或更新当前登录用户偏好         | JSON            |
| `/api/novel/wizard`                              | POST     | Layer1 完成后创建草稿作品          | JSON            |
| `/api/novel/[id]/wizard`                         | PATCH    | 增量更新 `custom_config`           | JSON            |
| `/api/novel/[id]/wizard/suggest`                 | POST     | Layer2 单题随机建议                | JSON            |
| `/api/novel/[id]/wizard/confirm-config`          | POST     | 确认 Layer2 创作配置               | JSON            |
| `/api/novel/[id]/wizard/titles`                  | POST     | 生成候选标题                       | JSON            |
| `/api/novel/[id]/confirm-title`                  | POST     | 确认标题并进入规划阶段             | JSON            |
| `/api/novel/[id]/plan`                           | GET/PUT  | 获取规划数据或保存章节大纲摘要     | JSON            |
| `/api/novel/[id]/plan/chapter`                   | PUT      | 保存单章节大纲摘要的兼容别名       | JSON            |
| `/api/novel/[id]/start-writing`                  | POST     | 启动或恢复自动写作                 | JSON            |
| `/api/novel/[id]/write/stream`                   | GET      | SSE 推送写作与校验事件             | Event Stream    |
| `/api/novel/[id]/chapters`                       | GET      | 获取章节列表与阅读数据             | JSON            |
| `/api/novel/[id]/chapter/[chapterNumber]`        | PUT      | 手动编辑章节正文                   | JSON            |
| `/api/novel/[id]/chapter/[chapterNumber]/polish` | POST     | 对选中文本执行局部润色             | JSON            |
| `/api/novel/[id]/export`                         | GET      | 导出整本小说 Markdown              | File (Markdown) |
| `/api/novel/[id]`                                | DELETE   | 删除当前登录用户名下的指定作品     | JSON            |

---

## 认证约束

- 所有业务接口都必须先校验 `session.user.id`。
- 所有涉及作品读取、修改、删除的接口都必须限定 `novels.userId = session.user.id`。
- 未登录请求返回 `401`。
- 作品不存在或不属于当前用户时返回 `404`。

---

## 关键接口说明

### 1. `GET /api/preferences`

- 说明：返回用户偏好与最近活跃作品，用于首页首屏渲染。
- 响应体示例：

```json
{
  "preferences": {
    "preferredGenres": ["Sci-Fi", "Thriller"],
    "defaultTone": "Noir",
    "defaultChapterCount": 24
  },
  "lastActiveNovel": {
    "id": "novel-1",
    "title": "Neon Meridian",
    "status": "in_progress"
  }
}
```

### 2. `POST /api/preferences`

- 说明：保存或更新当前登录用户偏好。
- 请求体示例：

```json
{
  "preferredGenres": ["Sci-Fi", "Thriller"],
  "defaultTone": "Noir",
  "defaultChapterCount": 24
}
```

### 3. `GET /api/novel/[id]/plan`

- 说明：获取作品规划数据，包括完整大纲、人物档案与章节摘要列表。

### 4. `PUT /api/novel/[id]/plan`

- 说明：保存指定章节的 `outlineSummary`。
- 请求体示例：

```json
{
  "chapterNumber": 1,
  "outlineSummary": "Updated chapter summary."
}
```

### 5. `POST /api/novel/[id]/start-writing`

- 说明：
  - 当作品状态为 `planning` 时，初始化全部章节为 `pending` 并切换到 `in_progress`。
  - 当作品状态为 `failed` 时，从失败章节继续恢复写作。

### 6. `GET /api/novel/[id]/write/stream`

- 说明：通过 SSE 向前端持续推送写作事件。
- 事件类型：
  - `chapter_start`
  - `content_chunk`
  - `validation_start`
  - `validation_result`
  - `chapter_complete`
  - `error`
  - `novel_complete`

### 7. `GET /api/novel/[id]/chapters`

- 说明：提供阅读页所需章节列表与正文内容。

### 8. `PUT /api/novel/[id]/chapter/[chapterNumber]`

- 说明：保存用户手动修改后的章节正文，并重新计算字数。
- 请求体示例：

```json
{
  "content": "Updated chapter content."
}
```

### 9. `POST /api/novel/[id]/chapter/[chapterNumber]/polish`

- 说明：仅对选中的文本片段进行润色，不直接覆盖整章正文。
- 请求体示例：

```json
{
  "selectedText": "Original selected text.",
  "surroundingContext": "Optional nearby context."
}
```

### 10. `GET /api/novel/[id]/export`

- 说明：导出整本小说 Markdown 文件，文件名使用作品标题清洗后生成。

### 11. `DELETE /api/novel/[id]`

- 说明：删除当前登录用户拥有的作品，并依赖数据库外键级联删除其 `novel_profiles` 与 `chapters` 记录。
- 成功响应：

```json
{
  "success": true,
  "deletedNovelId": "novel-1"
}
```

- 失败语义：
  - 未登录：`401`
  - 作品不存在或无权限：`404`

---

## 作品管理动作映射

首页作品管理区根据作品状态提供不同入口：

| 状态          | 主动作             | 跳转目标            |
| ------------- | ------------------ | ------------------- |
| `draft`       | `Edit`             | `/novel/[id]/plan`  |
| `planning`    | `Edit`             | `/novel/[id]/plan`  |
| `in_progress` | `Continue Writing` | `/novel/[id]/write` |
| `failed`      | `Continue Writing` | `/novel/[id]/write` |
| `completed`   | `Read`             | `/novel/[id]/read`  |

删除动作对所有归属当前用户的作品开放，但必须先进行前端确认，再调用 `DELETE /api/novel/[id]`。
