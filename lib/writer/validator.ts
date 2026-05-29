import { createLLMClient } from "../llm";
import { getSystem, renderInstruction } from "../prompts";

export type ValidationResult = {
  wordCountValid: boolean;
  suspenseValid: boolean;
  passed: boolean;
  diagnosticLog?: string;
};

/** 解析 phase4-suspense-check 的 JSON 或兼容纯文本 true/false */
export function parseSuspenseCheckResponse(responseText: string): boolean {
  const trimmed = responseText.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { hasHook?: boolean };
      if (typeof parsed.hasHook === "boolean") {
        return parsed.hasHook;
      }
    } catch {
      // 回退到纯文本解析
    }
  }
  return trimmed.toLowerCase() === "true";
}

export async function validateChapter(
  text: string,
  chapterNumber = 1,
): Promise<ValidationResult> {
  const len = text.length;
  const wordCountValid = len >= 3000 && len <= 5000;

  const llm = createLLMClient({ provider: "gemini" });
  const chapterEnding = text.slice(-300);

  const prompt = renderInstruction("phase4-suspense-check", {
    chapterNumber: String(chapterNumber),
    chapterEnding,
  });

  const responseText = await llm.generateText({
    prompt,
    systemInstruction: getSystem("reviewer"),
    temperature: 0.1,
  });

  const suspenseValid = parseSuspenseCheckResponse(responseText);
  const passed = wordCountValid && suspenseValid;

  let diagnosticLog: string | undefined;

  if (!passed) {
    const logs: string[] = [];
    if (!wordCountValid) {
      if (len < 3000) {
        logs.push(
          `字数 ${len}，少于标准，请在此剧情基础上扩充写 ${3000 - len} 字。`,
        );
      } else {
        logs.push(`字数 ${len}，超出标准，请精简多余的情节。`);
      }
    }
    if (!suspenseValid) {
      logs.push(`末尾缺乏悬念或钩子，请在章节末尾增强冲突，留下悬念。`);
    }
    diagnosticLog = logs.join(" ");
  }

  return {
    wordCountValid,
    suspenseValid,
    passed,
    diagnosticLog,
  };
}
