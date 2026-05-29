import { createLLMClient } from "../llm";

export type PlannerInput = {
  genre: string;
  protagonist: string;
  conflict: string;
  world: string;
  wordCount: string;
  style: string;
  pacing: string;
  extra: string;
};

export type Character = {
  name: string;
  role: string;
  background: string;
};

export type PlanResult = {
  candidateTitles: string[];
  characters: Character[];
  outline: string;
};

export async function generatePlan(input: PlannerInput): Promise<PlanResult> {
  const llm = createLLMClient({ provider: "gemini" });

  const prompt = `
请作为一名专业的小说大纲策划，根据以下设定生成小说规划。
设定要求：
- 题材：${input.genre}
- 主角：${input.protagonist}
- 核心冲突：${input.conflict}
- 世界观：${input.world}
- 目标字数/篇幅：${input.wordCount}
- 风格基调：${input.style}
- 节奏安排：${input.pacing}
- 补充说明：${input.extra}

请严格按以下格式输出结果，不要包含额外废话：

# 候选标题
1. [标题1]
2. [标题2]
3. [标题3]
4. [标题4]
5. [标题5]

# 人物档案
\`\`\`json
[
  { "name": "角色名", "role": "角色定位(主角/配角/反派)", "background": "背景和性格设定" }
]
\`\`\`

# 大纲
（在此处输出多章节分卷大纲，使用 Markdown 格式，例如 ## 第一章：标题）
`;

  const responseText = await llm.generateText({
    prompt,
    systemInstruction:
      "你是一位经验丰富的金牌网络小说编辑，擅长构思具有极强商业价值和悬念冲突的网文大纲。",
  });

  const titles: string[] = [];
  const titlesMatch = responseText.match(/# 候选标题\n([\s\S]*?)\n# 人物档案/);
  if (titlesMatch && titlesMatch[1]) {
    const lines = titlesMatch[1]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+)/);
      if (match) {
        titles.push(match[1]);
      }
    }
  }

  let characters: Character[] = [];
  const charsMatch = responseText.match(
    /# 人物档案\s*```json\s*([\s\S]*?)\s*```/,
  );
  if (charsMatch && charsMatch[1]) {
    try {
      characters = JSON.parse(charsMatch[1]);
    } catch (e) {
      console.error("Failed to parse characters JSON", e);
    }
  }

  let outline = "";
  const outlineMatch = responseText.match(/# 大纲\s*([\s\S]*)/);
  if (outlineMatch && outlineMatch[1]) {
    outline = outlineMatch[1].trim();
  }

  return {
    candidateTitles: titles,
    characters,
    outline,
  };
}
