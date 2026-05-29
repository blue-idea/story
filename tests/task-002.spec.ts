import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, test } from "vitest";

describe("TASK-002 数据库连接与 schema 推送准备", () => {
  test("TASK-002-AC-001: db/index.ts 应导出客户端与 schema 感知的 drizzle 实例", async () => {
    const dbIndexPath = resolve(process.cwd(), "db/index.ts");

    expect(existsSync(dbIndexPath)).toBe(true);

    const dbModule = await import(pathToFileURL(dbIndexPath).href);

    expect(dbModule).toMatchObject({
      client: expect.anything(),
      db: expect.anything(),
      schema: expect.anything(),
    });
  });

  test("TASK-002-AC-002: .env.example 应声明数据库与后续认证/模型环境变量", () => {
    const envExamplePath = resolve(process.cwd(), ".env.example");

    expect(existsSync(envExamplePath)).toBe(true);

    const envExample = readFileSync(envExamplePath, "utf8");

    expect(envExample).toContain("DATABASE_URL=");
    expect(envExample).toContain("NEXTAUTH_SECRET=");
    expect(envExample).toContain("GEMINI_API_KEY=");
    expect(envExample).toContain("OPENAI_API_KEY=");
  });
});
