import { describe, expect, test } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

describe("TASK-001 初始化基础设施", () => {
  test("REQ-TASK-001-AC-001: 关键项目文件应存在", () => {
    const requiredFiles = [
      "package.json",
      "tsconfig.json",
      "drizzle.config.ts",
      "db/schema.ts",
      "eslint.config.mjs",
      "next.config.ts",
      ".husky/pre-commit",
      ".github/workflows/ci.yml",
    ];

    for (const file of requiredFiles) {
      expect(existsSync(resolve(process.cwd(), file))).toBe(true);
    }
  });

  test("REQ-TASK-001-AC-002: schema 应导出 8 张核心表", async () => {
    expect(existsSync(resolve(process.cwd(), "db/schema.ts"))).toBe(true);

    const schemaModule = await import(
      pathToFileURL(resolve(process.cwd(), "db/schema.ts")).href
    );

    expect(schemaModule).toMatchObject({
      users: expect.anything(),
      accounts: expect.anything(),
      sessions: expect.anything(),
      verificationTokens: expect.anything(),
      userPreferences: expect.anything(),
      novels: expect.anything(),
      novelProfiles: expect.anything(),
      chapters: expect.anything(),
    });
  });

  test("REQ-TASK-001-AC-003: drizzle、husky 与 CI 应包含关键配置", async () => {
    process.env.DATABASE_URL ??=
      "postgres://postgres:postgres@localhost:5432/story";

    expect(existsSync(resolve(process.cwd(), "drizzle.config.ts"))).toBe(true);

    const drizzleConfigModule = await import(
      pathToFileURL(resolve(process.cwd(), "drizzle.config.ts")).href
    );
    const drizzleConfig = drizzleConfigModule.default;

    expect(drizzleConfig).toMatchObject({
      schema: "./db/schema.ts",
      dialect: "postgresql",
    });

    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
    ) as {
      scripts?: Record<string, string>;
      "lint-staged"?: Record<string, string | string[]>;
    };

    expect(packageJson.scripts).toMatchObject({
      dev: expect.any(String),
      build: expect.any(String),
      lint: expect.any(String),
      prepare: expect.any(String),
    });

    expect(packageJson["lint-staged"]).toBeDefined();

    const preCommitHook = readFileSync(
      resolve(process.cwd(), ".husky/pre-commit"),
      "utf8",
    );
    expect(preCommitHook).toContain("lint-staged");

    const workflow = readFileSync(
      resolve(process.cwd(), ".github/workflows/ci.yml"),
      "utf8",
    );
    expect(workflow).toContain("pnpm audit");
    expect(workflow).toContain("CodeQL");
  });
});
