# Prompts 目录

运行时 LLM 指令与输出模版，对齐 `docs/novelist/SKILL.md` 与 `docs/spec/prompts-design.md`。

## 结构

| 子目录          | 用途                                          |
| --------------- | --------------------------------------------- |
| `system/`       | 全局 System Instruction（编辑 / 作者 / 审核） |
| `instructions/` | 分阶段 User Prompt，支持 `{{变量}}`           |
| `templates/`    | 输出 Markdown 骨架（解析与导出）              |
| `fragments/`    | 可注入的写作技法摘录                          |

## 变量约定

见 `docs/spec/prompts-design.md` §4.1。加载方式：`lib/prompts/loader.ts` 的 `getSystem`、`renderInstruction`、`loadTemplate`。

## 与 novelist 对照

| prompts 文件             | novelist 参考                             |
| ------------------------ | ----------------------------------------- |
| `templates/outline.md`   | `references/guides/outline-template.md`   |
| `templates/character.md` | `references/guides/character-template.md` |
| `templates/chapter.md`   | `references/guides/chapter-template.md`   |
