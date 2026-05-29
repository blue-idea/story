import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export interface LLMConfig {
  provider: "gemini" | "openai";
  apiKey?: string;
  model?: string;
}

export interface GenerateTextOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
}

export interface LLMClient {
  generateText(options: GenerateTextOptions): Promise<string>;
  generateStream(
    options: GenerateTextOptions,
  ): AsyncGenerator<string, void, unknown>;
}

class GeminiClient implements LLMClient {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(config: LLMConfig) {
    const key = config.apiKey || process.env.GEMINI_API_KEY || "";
    this.genAI = new GoogleGenerativeAI(key);
    this.modelName = config.model || "gemini-1.5-flash";
  }

  async generateText(options: GenerateTextOptions): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: options.systemInstruction,
    });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: options.prompt }] }],
      generationConfig: { temperature: options.temperature },
    });
    return result.response.text();
  }

  async *generateStream(
    options: GenerateTextOptions,
  ): AsyncGenerator<string, void, unknown> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: options.systemInstruction,
    });
    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: options.prompt }] }],
      generationConfig: { temperature: options.temperature },
    });
    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  }
}

class OpenAIClient implements LLMClient {
  private openai: OpenAI;
  private modelName: string;

  constructor(config: LLMConfig) {
    const key = config.apiKey || process.env.OPENAI_API_KEY || "";
    this.openai = new OpenAI({ apiKey: key });
    this.modelName = config.model || "gpt-3.5-turbo";
  }

  async generateText(options: GenerateTextOptions): Promise<string> {
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [];
    if (options.systemInstruction) {
      messages.push({ role: "system", content: options.systemInstruction });
    }
    messages.push({ role: "user", content: options.prompt });

    const response = await this.openai.chat.completions.create({
      model: this.modelName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: messages as any,
      temperature: options.temperature,
    });
    return response.choices[0]?.message?.content || "";
  }

  async *generateStream(
    options: GenerateTextOptions,
  ): AsyncGenerator<string, void, unknown> {
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [];
    if (options.systemInstruction) {
      messages.push({ role: "system", content: options.systemInstruction });
    }
    messages.push({ role: "user", content: options.prompt });

    const stream = await this.openai.chat.completions.create({
      model: this.modelName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: messages as any,
      temperature: options.temperature,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}

export function createLLMClient(config: LLMConfig): LLMClient {
  if (config.provider === "gemini") {
    return new GeminiClient(config);
  }
  if (config.provider === "openai") {
    return new OpenAIClient(config);
  }
  throw new Error(`Unsupported provider: ${config.provider}`);
}
