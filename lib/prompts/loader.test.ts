import { describe, it, expect } from "vitest";
import {
  getSystem,
  renderInstruction,
  loadTemplate,
  PromptFileNotFoundError,
  type InstructionId,
} from "./index";

describe("prompt loader", () => {
  it("getSystem returns non-empty editor persona", () => {
    const text = getSystem("editor");
    expect(text.length).toBeGreaterThan(10);
    expect(text).toMatch(/编辑|策划/);
  });

  it("getSystem returns author and reviewer personas", () => {
    expect(getSystem("author")).toMatch(/作者|创作/);
    expect(getSystem("reviewer")).toMatch(/审核|质量/);
  });

  it("renderInstruction injects {{variables}} into instruction", () => {
    const output = renderInstruction("phase1-title", {
      genre: "科幻",
      protagonist: "男性主角",
      conflict: "查明真相",
      theme: "信任与谎言",
      tone: "冷峻",
    });
    expect(output).toContain("科幻");
    expect(output).toContain("男性主角");
    expect(output).toContain("查明真相");
  });

  it("renderInstruction for phase3-chapter-draft includes word count and suspense constraints", () => {
    const output = renderInstruction("phase3-chapter-draft", {
      chapterNumber: "1",
      chapterTitle: "启程",
      outlineRow: "核心事件：主角觉醒",
      characterProfiles: "林克：冷静侦探",
      previousChapterSummary: "（首章无上文）",
    });
    expect(output).toContain("3000");
    expect(output).toContain("5000");
    expect(output).toMatch(/悬念|钩子/);
  });

  it("loadTemplate loads outline skeleton from templates/", () => {
    const outline = loadTemplate("outline");
    expect(outline).toContain("章节规划");
    expect(outline).toContain("章首引子类型");
  });

  it("throws PromptFileNotFoundError when instruction file is missing", () => {
    expect(() =>
      renderInstruction("missing-instruction-id" as InstructionId, {}),
    ).toThrow(PromptFileNotFoundError);
  });

  it("throws PromptFileNotFoundError when system role file is missing", () => {
    expect(() => getSystem("missing-role" as "editor")).toThrow(
      PromptFileNotFoundError,
    );
  });
});
