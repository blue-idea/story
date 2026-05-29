import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

describe("TASK-003 NextAuth.js 配置与轻量邮箱登录/注册", () => {
  test("REQ-001-AC-001: 认证配置应导出自定义登录页和认证处理器", async () => {
    const authModulePath = resolve(process.cwd(), "lib/auth.ts");

    expect(existsSync(authModulePath)).toBe(true);

    const authModule = await import(pathToFileURL(authModulePath).href);

    expect(authModule).toMatchObject({
      authConfig: expect.objectContaining({
        pages: expect.objectContaining({
          signIn: "/login",
        }),
      }),
      auth: expect.any(Function),
      handler: expect.any(Function),
    });
  });

  test("REQ-001-AC-001: Auth route handler 应导出 GET 和 POST", async () => {
    const routeModulePath = resolve(
      process.cwd(),
      "app/api/auth/[...nextauth]/route.ts",
    );

    expect(existsSync(routeModulePath)).toBe(true);

    const routeModule = await import(pathToFileURL(routeModulePath).href);

    expect(routeModule.GET).toEqual(expect.any(Function));
    expect(routeModule.POST).toEqual(expect.any(Function));
  });

  test("REQ-001-AC-001: session route 应导出 GET 和 HEAD 以支持 curl -I", async () => {
    const sessionRouteModulePath = resolve(
      process.cwd(),
      "app/api/auth/session/route.ts",
    );

    expect(existsSync(sessionRouteModulePath)).toBe(true);

    const sessionRouteModule = await import(
      pathToFileURL(sessionRouteModulePath).href
    );

    expect(sessionRouteModule.GET).toEqual(expect.any(Function));
    expect(sessionRouteModule.HEAD).toEqual(expect.any(Function));
  });

  test("REQ-001-AC-001: 自定义登录页应渲染邮箱与密码表单", async () => {
    const pageModulePath = resolve(process.cwd(), "app/login/page.tsx");

    expect(existsSync(pageModulePath)).toBe(true);

    const pageModule = await import(pathToFileURL(pageModulePath).href);
    const LoginPage = pageModule.default;
    const markup = renderToStaticMarkup(await LoginPage());

    expect(markup).toContain('name="email"');
    expect(markup).toContain('type="password"');
    expect(markup).toContain("Sign in");
  });
});
