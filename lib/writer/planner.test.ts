import { describe, it, expect, vi } from "vitest";
import { generatePlan } from "./planner";

// Mock the LLM client
vi.mock("../llm", () => {
  return {
    createLLMClient: vi.fn(() => ({
      generateText: vi.fn().mockResolvedValue(`
# 候选标题
1. 剑道通神
2. 万古第一神
3. 绝世剑神

# 人物档案
\`\`\`json
[
  { "name": "林云", "role": "主角", "background": "没落家族少爷，机智果敢" }
]
\`\`\`

# 大纲
## 第一章：家族惊变
林云发现家族被灭，获得神秘宝剑。
## 第二章：拜入宗门
林云逃到剑宗，通过考核成为外门弟子。
        `),
    })),
  };
});

describe("Planner", () => {
  it("Planner 根据输入生成大纲、候选标题和人物档案，并正确解析返回", async () => {
    const input = {
      genre: "玄幻小说",
      protagonist: "没落家族少爷，机智果敢",
      conflict: "家族被灭，寻找仇人",
      world: "高武世界，以剑为尊",
      wordCount: "短篇 5万字",
      style: "热血",
      pacing: "快节奏",
      extra: "无",
    };

    const result = await generatePlan(input);

    expect(result).toBeDefined();

    // 断言标题解析正确
    expect(result.candidateTitles).toHaveLength(3);
    expect(result.candidateTitles[0]).toBe("剑道通神");

    // 断言人设解析正确
    expect(result.characters).toBeDefined();
    expect(Array.isArray(result.characters)).toBe(true);
    expect(result.characters).toHaveLength(1);
    expect(result.characters[0].name).toBe("林云");
    expect(result.characters[0].role).toBe("主角");

    // 断言大纲 Markdown 被正确截取
    expect(result.outline).toContain("第一章：家族惊变");
    expect(result.outline).toContain("第二章：拜入宗门");
    expect(result.outline).not.toContain("候选标题"); // 大纲里不应该包含上面部分的文本
  });
});
