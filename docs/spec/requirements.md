# 需求文档（Requirements）

> 文件路径：`docs/spec/requirements.md`
> 版本：1.0.0 · 日期：2026-05-29
> 状态：已定稿

---

## 介绍

本项目旨在构建一个基于 Next.js + Postgres + Drizzle ORM 的 Novelist 写作网站。该网站将 `chinese-novelist` 的中文小说多阶段创作逻辑（偏好加载、三层问答表单、大纲与计划确认、流式创作、字数与质量自动校验修复）完全 Web 可视化。系统使用 NextAuth.js 进行轻量级多用户认证和数据隔离。用户通过选项与表单交互定制小说题材后，AI 串行逐章进行创作，并在页面上流式渲染正文及自动化的字数/悬念质量校验。

---

## 需求列表

---

### 需求 REQ-001 · 用户认证与项目续写检测

**用户故事：** 作为创作者，我希望通过邮箱登录/注册我的账户，并在登录后自动加载我的偏好以及我名下未完成的写作项目，以便不同用户的小说数据能够完全隔离，且能够随时续写。

#### 验收标准

```yaml
- id: REQ-001-AC-001
  ears: >
    While the user is not authenticated, when they access any page other than public pages,
    the system shall redirect the user to the sign-in page.
  test_type: E2E
  expected:
    ui_state: "重定向到 /api/auth/signin 或自定义登录页面，显示邮箱登录表单"
    url: "/api/auth/signin"

- id: REQ-001-AC-002
  ears: >
    When the authenticated user accesses the homepage,
    the system shall retrieve the user's historical preferences and scan the database for any novels belonging to this user with a status of 'in_progress' or 'planning'.
  test_type: API
  expected:
    http_status: 200
    body_schema:
      hasPreferences: "boolean"
      unfinishedProject: "object | null"
      unfinishedProject.id: "string | undefined"
      unfinishedProject.title: "string | undefined"
      unfinishedProject.progress: "string | undefined"

- id: REQ-001-AC-003
  ears: >
    While the system detects an unfinished project, when the user clicks "Continue Writing",
    the system shall redirect the user to the active workspace page of that project.
  test_type: E2E
  expected:
    ui_state: "点击'继续创作'后，浏览器跳转到 /novel/[id]/write"
    url: "/novel/[id]/write"
```

---

### 需求 REQ-002 · 三层递进式问答表单

**用户故事：** 作为已登录创作者，我希望通过表单选项逐步定制小说的核心属性（题材、主角、冲突、世界观等），以发起新作品的创作，并支持 AI 推荐生成候选标题。

#### 验收标准

```yaml
- id: REQ-002-AC-001
  ears: >
    When the user completes and submits the first layer form (Q1-Q3: genre, protagonist, conflict),
    the system shall transition the UI seamlessly to the second layer custom settings form (Q4-Q8).
  test_type: E2E
  expected:
    ui_state: "表单第一阶段提交成功，UI 无缝滑动到下一阶段"

- id: REQ-002-AC-002
  ears: >
    When the user completes and submits Q1-Q8 questions,
    the system shall create a novel record with status 'draft' owned by the current logged-in user, and return AI-generated candidate titles.
  test_type: API
  expected:
    http_status: 200
    body_schema:
      novelId: "string"
      candidateTitles: "array of strings"
    side_effects:
      - "在 novels 表中插入一条状态为 'draft' 的记录，其 user_id 关联当前登录的 user id"

- id: REQ-002-AC-003
  ears: >
    When the user confirms a title (selected or custom-input) and submits,
    the system shall update the novel's title and set its status to 'planning'.
  test_type: E2E
  expected:
    ui_state: "更新标题成功，页面跳转到大纲规划页面"
    url: "/novel/[id]/plan"
```

---

### 需求 REQ-003 · 大纲规划与确认

**用户故事：** 作为创作者，我希望在写作前预览大纲、人物设定和章节计划，并可以在页面上直接编辑各个章节的概要，以便把控小说的核心剧情走向。

#### 验收标准

```yaml
- id: REQ-003-AC-001
  ears: >
    While the novel status is 'planning', when the user requests the planning view,
    the system shall load and render the outline markdown, character JSON array, and the detailed chapter list.
  test_type: E2E
  expected:
    ui_state: "显示大纲文本、人设卡片列表及每一章的剧情概要卡片，带有‘确认并开始写作’按钮"

- id: REQ-003-AC-002
  ears: >
    When the user edits the outline summary of a specific chapter and clicks save,
    the system shall update the corresponding chapter outline in the database.
  test_type: API
  expected:
    http_status: 200
    body_schema:
      success: "boolean"
    side_effects:
      - "修改并持久化 chapters 表中对应章的 outline_summary 字段"

- id: REQ-003-AC-003
  ears: >
    When the user clicks the "Confirm and Write" button,
    the system shall set the novel status to 'in_progress' and redirect the browser to the writing workspace.
  test_type: API
  expected:
    http_status: 200
    body_schema:
      novelId: "string"
      status: "string" # 'in_progress'
    side_effects:
      - "更新 novels 表的状态，并在 chapters 表中将所有章节的状态初始化为 'pending'"
```

---

### 需求 REQ-004 · 小说自动流式写作

**用户故事：** 作为创作者，我希望 AI 能够按照串行机制依次生成各个章节，并在写作工作台上以打字机流式渲染正在创作的正文，让我直观感受创作状态。

#### 验收标准

```yaml
- id: REQ-004-AC-001
  ears: >
    While in the writing workspace, when the user clicks 'Start Automatic Writing',
    the system shall invoke the AI writer to generate the chapters one by one in serial order.
  test_type: E2E
  expected:
    ui_state: "第一章状态变为 'writing'，工作台终端区通过 Server-Sent Events (SSE) 流式传输正文片段并实现打字机效果渲染"

- id: REQ-004-AC-002
  ears: >
    When the generation of a chapter succeeds,
    the system shall save the generated text to the database and transition the chapter to the validation stage.
  test_type: Unit
  expected:
    return_value: "object"
    throws: null
    side_effects:
      - "在 chapters 表中保存正文，字数，并更新状态为 'validating'"
```

---

### 需求 REQ-005 · 质量自动校验与故障暂停重试

**用户故事：** 作为创作者，我希望系统自动检测每章生成的字数（3000-5000字）和悬念钩子，当不合格时能自动重试扩写（最多 3 轮）；而当大模型发生网络故障或 3 轮重试均失败时，系统能够自动暂停写作并允许我点击按钮“重试本章”。

#### 验收标准

```yaml
- id: REQ-005-AC-001
  ears: >
    When the chapter text generation is completed,
    the validator shall check if character count is between 3000 and 5000, and parse the end of the text to detect if suspense hooks exist.
  test_type: Unit
  expected:
    return_value: "object"
    body_schema:
      wordCountValid: "boolean"
      suspenseValid: "boolean"
      passed: "boolean"

- id: REQ-005-AC-002
  ears: >
    While validation fails and the retry count is less than 3, when validation completes,
    the system shall automatically query the LLM to rewrite or extend the current chapter, incrementing the retry count.
  test_type: Unit
  expected:
    side_effects:
      - "更新 chapters 表的 retry_count 字段 +1"
      - "触发带有质量诊断说明的 AI 扩写请求"

- id: REQ-005-AC-003
  ears: >
    While writing is in progress, when an API call fails or a chapter fails validation 3 times,
    the system shall halt writing, set the novel and active chapter status to 'failed', and display the error message in the UI with a "Retry Chapter" button.
  test_type: E2E
  expected:
    ui_state: "终端高亮红字显示报错，小说状态置为 'failed'，写作停止，UI 激活并显示 '重试本章写作' 的按钮"
    side_effects:
      - "在数据库中更新 novels 表和 chapters 表对应的状态为 'failed'"

- id: REQ-005-AC-004
  ears: >
    While the writing is halted due to failure, when the user clicks the "Retry Chapter" button,
    the system shall reset the chapter status to 'pending' and resume the automatic serial writing flow from this chapter.
  test_type: E2E
  expected:
    ui_state: "故障恢复，终端清空报错，状态变回 'writing'，流式写作与校验逻辑从失败章节重新启动"
```

---

### 需求 REQ-006 · 小说阅读、修改与打包导出

**用户故事：** 作为创作者，我希望查看最终成稿的所有章节内容、手动修改微调正文，或一键将小说完整打包（含人物档案与大纲）以 Markdown 格式下载到本地。

#### 验收标准

```yaml
- id: REQ-006-AC-001
  ears: >
    When the user requests to export the novel,
    the system shall generate a unified Markdown file containing the title, outline, character profiles, and all completed chapters, triggering a browser download.
  test_type: E2E
  expected:
    ui_state: "浏览器弹出下载保存框，下载文件名为 '[小说标题].md'"

- id: REQ-006-AC-002
  ears: >
    When the user edits chapter text and saves,
    the system shall update the chapter's content and recount the word count in the database.
  test_type: API
  expected:
    http_status: 200
    body_schema:
      success: "boolean"
      newWordCount: "number"
    side_effects:
      - "持久化更新 chapters 表的 content 和 word_count 字段"
```
