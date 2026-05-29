# 接口设计（API Design）

> 文件路径：`docs/spec/api.md`
> 版本：1.0.0 · 日期：2026-05-29
> 状态：已定稿

---

## 接口总览

后端接口使用 Next.js App Router 的 Route Handlers 实现，前缀统一为 `/api`。

| 路由 | 方法 | 功能说明 | 响应格式 |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js 认证端点（登录、注销、会话） | HTML / JSON |
| `/api/preferences` | GET | 获取当前登录用户偏好与未完成项目检测 | JSON |
| `/api/novel/create` | POST | 提交Q1-Q8表单，创建草稿并生成标题 | JSON |
| `/api/novel/[id]/confirm-title` | POST | 确认标题并启动大纲异步生成 | JSON |
| `/api/novel/[id]/plan` | GET | 获取大纲规划、人物设定 | JSON |
| `/api/novel/[id]/plan/chapter` | PUT | 修改单章大纲提纲 | JSON |
| `/api/novel/[id]/start-writing` | POST | 确认大纲并启动小说串行写作任务 | JSON |
| `/api/novel/[id]/write/stream` | GET | SSE 服务端推送流式正文、校验日志与重试故障状态 | Event Stream |
| `/api/novel/[id]/chapters` | GET | 获取小说章节列表与校验状态 | JSON |
| `/api/novel/[id]/chapter/[chapterNumber]` | PUT | 手动编辑章节正文内容 | JSON |
| `/api/novel/[id]/export` | GET | 导出下载整本小说（Markdown） | File (Markdown) |

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

### 3. `POST /api/novel/create`
- **说明**：创建新小说草稿（status = 'draft'），并调用 LLM 生成 5 个候选标题。
- **请求体**：
  ```json
  {
    "coreConfig": {
      "genre": "科幻",
      "protagonist": "林克",
      "conflict": "飞船坠入黑洞，AI 在撒谎"
    },
    "customConfig": {
      "worldbuilding": "近未来硬科幻",
      "perspective": "第一人称",
      "tone": "冷峻",
      "theme": "信任与谎言",
      "audience": "科幻读者",
      "chapterCount": 10
    }
  }
  ```
- **响应体**：
  ```json
  {
    "novelId": "e456c7d8-f9a8-4b7c-8d9e-0f1e2a3b4c5d",
    "candidateTitles": ["黑洞视界", "最后的领航员", "智能的阴谋"]
  }
  ```

### 4. `POST /api/novel/[id]/confirm-title`
- **说明**：确认小说的标题，并置状态为 `planning`。后台会启动 LLM 异步生成小说完整大纲和人设。
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
      { "chapterNumber": 1, "title": "虚无的苏醒", "outlineSummary": "主角在冷冻舱中醒来..." }
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

### 10. `PUT /api/novel/[id]/chapter/[chapterNumber]`
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

### 11. `GET /api/novel/[id]/export`
- **说明**：以 Markdown 文件形式打包小说下载。
- **响应格式**：文件的 MIME 类型为 `text/markdown`。
