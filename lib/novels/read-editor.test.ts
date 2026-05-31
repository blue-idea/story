import { describe, expect, it } from "vitest";

import {
  applyPolishReplacement,
  buildPolishSelectionPayload,
} from "./read-editor";

describe("read-editor", () => {
  it("buildPolishSelectionPayload 提取非空选区与前后文", () => {
    const content =
      "Alpha intro.\nBeta scene with tension.\nGamma twist ending.";

    const payload = buildPolishSelectionPayload({
      content,
      selectionStart: 13,
      selectionEnd: 36,
      contextRadius: 8,
    });

    expect(payload.selectedText).toBe("Beta scene with tension");
    expect(payload.surroundingContext).toContain("intro.");
    expect(payload.surroundingContext).toContain("Gamma");
  });

  it("buildPolishSelectionPayload 在空选区时抛出错误", () => {
    expect(() =>
      buildPolishSelectionPayload({
        content: "Only one line.",
        selectionStart: 2,
        selectionEnd: 2,
      }),
    ).toThrowError("Invalid selection");
  });

  it("applyPolishReplacement 仅替换选中区间", () => {
    const content = "Alpha Beta Gamma";

    const nextContent = applyPolishReplacement({
      content,
      selectionStart: 6,
      selectionEnd: 10,
      replacement: "Delta",
    });

    expect(nextContent).toBe("Alpha Delta Gamma");
  });
});
