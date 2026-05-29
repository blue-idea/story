import { createLLMClient } from "../llm";

export type ValidationResult = {
  wordCountValid: boolean;
  suspenseValid: boolean;
  passed: boolean;
  diagnosticLog?: string;
};

export async function validateChapter(text: string): Promise<ValidationResult> {
  const len = text.length;
  const wordCountValid = len >= 3000 && len <= 5000;

  const llm = createLLMClient({ provider: "gemini" });
  const tailText = text.slice(-300);

  const prompt = `
请判断以下小说正文结尾（最后300字）是否包含有效的故事悬念、未解的冲突或吸引读者继续阅读的钩子（留白）。
如果包含悬念或钩子，请仅回复 "true"；如果不包含，请仅回复 "false"。不要包含任何其他字符。

正文结尾：
${tailText}
`;

  const responseText = await llm.generateText({
    prompt,
    systemInstruction:
      "你是一位严苛的网文质量审核员，擅长判断文章结尾的悬念质量。",
    temperature: 0.1,
  });

  const suspenseValid = responseText.trim().toLowerCase() === "true";

  const passed = wordCountValid && suspenseValid;

  let diagnosticLog: string | undefined;

  if (!passed) {
    const logs = [];
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
