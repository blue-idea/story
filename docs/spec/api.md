# 接口设计（API Design）

> 文件路径：`docs/spec/api.md`
> 版本：1.1.0 · 日期：2026-05-29
> 状态：已定稿（含渐进式披露向导 API）

---

## 接口总览

后端接口使用 Next.js App Router 的 Route Handlers 实现，前缀统一为 `/api`。

| 路由                                             | 方法     | 功能说明                                       | 响应格式        |
| ------------------------------------------------ | -------- | ---------------------------------------------- | --------------- |
| `/api/auth/[...nextauth]`                        | GET/POST | NextAuth.js 认证端点（登录、注销、会话）       | HTML / JSON     |
| `/api/preferences`                               | GET      | 获取当前登录用户偏好与未完成项目检测           | JSON            |
| `/api/novel/wizard`                              | POST     | Layer1 完成后创建 draft（`core_config`）       | JSON            |
| `/api/novel/[id]/wizard`                         | PATCH    | 增量更新 `custom_config`（Layer2，可选）       | JSON            |
| `/api/novel/[id]/wizard/suggest`                 | POST     | Layer2 单题随机建议（🎲）                      | JSON            |
| `/api/novel/[id]/wizard/confirm-config`          | POST     | Layer2 创作配置确认                            | JSON            |
| `/api/novel/[id]/wizard/titles`                  | POST     | Layer3 生成候选标题                            | JSON            |
| `/api/novel/[id]/confirm-title`                  | POST     | 确认标题并启动大纲异步生成                     | JSON            |
| `/api/novel/[id]/plan`                           | GET      | 获取大纲规划、人物设定                         | JSON            |
| `/api/novel/[id]/plan/chapter`                   | PUT      | 修改单章大纲提纲                               | JSON            |
| `/api/novel/[id]/start-writing`                  | POST     | 确认大纲并启动小说串行写作任务                 | JSON            |
| `/api/novel/[id]/write/stream`                   | GET      | SSE 服务端推送流式正文、校验日志与重试故障状态 | Event Stream    |
| `/api/novel/[id]/chapters`                       | GET      | 获取小说章节列表与校验状态                     | JSON            |
| `/api/novel/[id]/chapter/[chapterNumber]`        | PUT      | 手动编辑章节正文内容                           | JSON            |
| `/api/novel/[id]/chapter/[chapterNumber]/polish` | POST     | 对用户选中的正文片段做去 AI 味润色             | JSON            |
| `/api/novel/[id]/export`                         | GET      | 导出下载整本小说（Markdown）                   | File (Markdown) |

---

## 接口详细说明

### 1. `GET/POST /api/auth/[...nextauth]`

- NextAuth.js 自动接管的认证路由。支持：
  - `/api/auth/signin`：登录页面。
  - `/api/auth/signout`：登出页面。
  - `/api/auth/session`：获取当前登录的用户 session。

### 2. `GET /api/preferences`

- **说明**：获取当前认证用户的历史偏好及未完成小说（`in_progress` 或 `planning`）。
- **响应体**：
  ```json
  {
    "hasPreferences": true,
    "preferences": {
      "favoriteGenres": ["悬念", "历史"],
      "defaultChapterCount": 10
    },
    "unfinishedProject": {
      "id": "e456c7d8-f9a8-4b7c-8d9e-0f1e2a3b4c5d",
      "title": "黑洞视界",
      "progress": "2 / 10",
      "updatedAt": "2026-05-29T12:00:00Z"
    }
  }
  ```

### 3. 渐进式披露向导 API（Phase 1）

> 披露节奏见 `docs/spec/prompts-design.md` §2。UI 逐题调用；仅在 Layer2「配置确认」后才请求标题。

#### `POST /api/novel/wizard`

- **时机**：Layer 1 摘要确认后。
- **请求体**：`{ "coreConfig": { ... Q1-Q3 及追问字段 } }`
- **响应体**：`{ "novelId": "uuid", "status": "draft" }`

#### `PATCH /api/novel/[id]/wizard`

- **时机**：Layer 2 每完成一题（可选，用于断点续填）。
- **请求体**：`{ "customConfigPartial": { "worldbuilding": "..." } }`

#### `POST /api/novel/[id]/wizard/suggest`

- **时机**：用户点击 🎲 随机生成。
- **请求体**：`{ "questionId": "q4", "context": { "coreConfig", "customConfigSoFar" } }`
- **响应体**：`{ "suggestion": "一句话建议", "field": "worldbuilding" }`
- **Prompt**：`prompts/instructions/wizard-suggest.md`

#### `POST /api/novel/[id]/wizard/confirm-config`

- **时机**：Layer 2 完整配置摘要页用户点击「确认」。
- **说明**：合并默认值（跳过题），校验必填；**不**生成标题。

#### `POST /api/novel/[id]/wizard/titles`

- **时机**：配置确认通过后，进入 Layer 3。
- **前置**：须已调用 `confirm-config`；`novel.status === 'draft'`。
- **响应体**：`{ "candidateTitles": ["...", "..."] }`（3 或 5 个）
- **说明**：替代原 `POST /api/novel/create`；**禁止**一次性提交 Q1-Q8。

### 4. `POST /api/novel/[id]/confirm-title`

- **说明**：确认小说的标题，并置状态为 `planning`。后台**串行两次** LLM 调用：① `phase2-outline` 生成完整 7 列大纲 Markdown 写入 `novel_profiles.outline`；② `phase2-characters` 生成人物档案写入 `novel_profiles.character_profiles`；最后解析大纲表写入 `chapters` 行。
- **请求体**：
  ```json
  {
    "title": "黑洞视界"
  }
  ```
- **响应体**：
  ```json
  {
    "novelId": "e456c7d8-f9a8-4b7c-8d9e-0f1e2a3b4c5d",
    "status": "planning"
  }
  ```

### 5. `GET /api/novel/[id]/plan`

- **说明**：获取生成大纲及人物设定。
- **响应体**：
  ```json
  {
    "outline": "# 黑洞视界 - 整体大纲...",
    "characterProfiles": [
      { "name": "林克", "role": "主角", "description": "冷漠但善于自救" }
    ],
    "chapters": [
      {
        "chapterNumber": 1,
        "title": "虚无的苏醒",
        "outlineSummary": "主角在冷冻舱中醒来..."
      }
    ]
  }
  ```

### 6. `PUT /api/novel/[id]/plan/chapter`

- **说明**：用户微调单章概要。
- **请求体**：
  ```json
  {
    "chapterNumber": 1,
    "outlineSummary": "修改后的第一章大纲提纲..."
  }
  ```
- **响应体**：
  ```json
  {
    "success": true
  }
  ```

### 7. `POST /api/novel/[id]/start-writing`

- **说明**：确认规划大纲并开启写作流程。小说状态置为 `in_progress`，并在 `chapters` 表中将所有章节置为 `pending`。
- **响应体**：
  ```json
  {
    "novelId": "e456c7d8-f9a8-4b7c-8d9e-0f1e2a3b4c5d",
    "status": "in_progress"
  }
  ```

### 8. `GET /api/novel/[id]/write/stream`

- **说明**：SSE 长连接，负责向客户端推送实时串行写作流状态、文字片段及校验结果。
- **SSE 事件类型**：
  - `chapter_start`：开始本章写作。`{ "chapterNumber": 1, "status": "writing" }`
  - `content_chunk`：正文流式输出。`{ "chapterNumber": 1, "chunk": "林克吃力地推开舱盖..." }`
  - `validation_start`：开始本章质量校验。`{ "chapterNumber": 1, "status": "validating" }`
  - `validation_result`：推送字数/钩子检测报告与结果。
    `{ "chapterNumber": 1, "passed": true, "wordCount": 3540, "hasSuspense": true, "retryCount": 0 }`
  - `chapter_complete`：章节入库成功。`{ "chapterNumber": 1, "status": "completed", "content": "..." }`
  - `error`：生成发生致命错误或连续 3 次校验失败，写作挂起。
    `{ "chapterNumber": 1, "status": "failed", "message": "大模型调用超时或连续校验失败3次，写作已暂停。" }`
  - `novel_complete`：整部小说创作校验完毕。`{ "novelId": "e456c7d8-f9a8-4b7c-8d9e-0f1e2a3b4c5d", "status": "completed" }`

### 9. `GET /api/novel/[id]/chapters`

- **说明**：获取整部小说的所有章节及其目前的生成/校验状态。
- **响应体**：
  ```json
  {
    "novelTitle": "黑洞视界",
    "status": "in_progress", # 或 completed, failed
    "chapters": [
      {
        "chapterNumber": 1,
        "title": "虚无的苏醒",
        "wordCount": 3540,
        "status": "completed",
        "passed": true,
        "retryCount": 0
      }
    ]
  }
  ```

### 10. `POST /api/novel/[id]/chapter/[chapterNumber]/polish`

- **说明**：对用户**选中**的正文片段执行去 AI 味润色（`prompts/instructions/phase3-chapter-polish.md`）。不自动覆盖整章，由前端替换选区或展示对比后由用户保存。
- **请求体**：
  ```json
  {
    "selectedText": "需要润色的选中片段……",
    "surroundingContext": "选区前后各约 200 字上下文（可选）"
  }
  ```
- **响应体**：
  ```json
  {
    "polishedText": "润色后的片段文本……"
  }
  ```

### 11. `PUT /api/novel/[id]/chapter/[chapterNumber]`

- **说明**：手动微调章节正文内容。
- **请求体**：
  ```json
  {
    "content": "用户手动修改后的本章完整正文..."
  }
  ```
- **响应体**：
  ```json
  {
    "success": true,
    "newWordCount": 3560
  }
  ```

### 12. `GET /api/novel/[id]/export`

- **说明**：以 Markdown 文件形式打包小说下载。
- **响应格式**：文件的 MIME 类型为 `text/markdown`。
