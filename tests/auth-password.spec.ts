import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, test } from "vitest";

describe("Auth 密码校验", () => {
  test("users schema 应包含 password_hash 字段", () => {
    const schemaSource = readFileSync(
      resolve(process.cwd(), "db/schema.ts"),
      "utf8",
    );

    expect(schemaSource).toContain("passwordHash");
    expect(schemaSource).toContain('text("password_hash")');
  });

  test("hashPassword / verifyPassword 应正确工作", async () => {
    const authModule = await import(
      pathToFileURL(resolve(process.cwd(), "lib/auth.ts")).href
    );

    const hash = await authModule.hashPassword("User123!");
    expect(hash).toEqual(expect.any(String));
    expect(hash.length).toBeGreaterThan(20);

    const valid = await authModule.verifyPassword("User123!", hash);
    const invalid = await authModule.verifyPassword("wrong-password", hash);

    expect(valid).toBe(true);
    expect(invalid).toBe(false);
  });
});
