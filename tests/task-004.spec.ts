import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, test } from "vitest";

describe("TASK-004 认证拦截中间件与多租户隔离", () => {
  test("REQ-001-AC-001: 必须存在 middleware.ts 并且导出 config 和 middleware", async () => {
    const middlewarePath = resolve(process.cwd(), "middleware.ts");
    expect(existsSync(middlewarePath)).toBe(true);

    const middlewareModule = await import(pathToFileURL(middlewarePath).href);
    expect(middlewareModule.default).toEqual(expect.any(Function));
    expect(middlewareModule.config).toEqual(
      expect.objectContaining({
        matcher: expect.any(Array),
      }),
    );
  });

  test("REQ-001-AC-001: /api/preferences 必须存在 GET Route Handler", async () => {
    const routePath = resolve(process.cwd(), "app/api/preferences/route.ts");
    expect(existsSync(routePath)).toBe(true);

    const routeModule = await import(pathToFileURL(routePath).href);
    expect(routeModule.GET).toEqual(expect.any(Function));
  });
});
